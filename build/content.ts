import { existsSync, statSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { Marked } from 'marked'
import { parseDocument } from 'yaml'
import type { ContentEntry, EntryType, SiteConfig } from '../src/content-types.ts'

export interface ContentSnapshot {
  site: SiteConfig
  entries: ContentEntry[]
  pages: { entry: ContentEntry; html: string }[]
}

type RecordData = Record<string, unknown>
const commonFields = ['id', 'title', 'description', 'tags', 'aliases', 'pinned', 'order', 'draft']
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}

function fail(file: string, message: string): never {
  throw new Error(`${file}: ${message}`)
}

function record(value: unknown, file: string): RecordData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(file, '必须是对象')
  return value as RecordData
}

function fields(data: RecordData, allowed: string[], file: string) {
  for (const key of Object.keys(data)) if (!allowed.includes(key)) fail(file, `未知字段 ${key}`)
}

function string(value: unknown, field: string, file: string): string {
  if (typeof value !== 'string' || !value.trim()) fail(file, `${field} 必须是非空字符串`)
  return value.trim()
}

function strings(value: unknown, field: string, file: string): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) fail(file, `${field} 必须是字符串数组`)
  return [...new Set(value.map((item) => string(item, field, file)))]
}

function boolean(value: unknown, field: string, file: string): boolean {
  if (value === undefined) return false
  if (typeof value !== 'boolean') fail(file, `${field} 必须是布尔值`)
  return value
}

function httpUrl(value: unknown, field: string, file: string): string {
  const raw = string(value, field, file)
  let url: URL
  try { url = new URL(raw) } catch { return fail(file, `${field} 不是有效网址`) }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    fail(file, `${field} 只允许不含账号密码的 http/https 网址`)
  }
  return url.href
}

async function json(file: string): Promise<unknown> {
  try { return JSON.parse(await readFile(file, 'utf8')) as unknown } catch (error) {
    return fail(file, `JSON 读取失败：${error instanceof Error ? error.message : error}`)
  }
}

async function filesIn(folder: string, extension: string): Promise<string[]> {
  if (!existsSync(folder)) return []
  const result: string[] = []
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name)
    if (entry.isSymbolicLink()) fail(file, '内容目录不支持符号链接')
    if (entry.isDirectory()) result.push(...await filesIn(file, extension))
    else if (entry.name.endsWith(extension)) result.push(file)
  }
  return result.sort()
}

/** Parse and validate first; callers only write outputs after this succeeds. */
export async function loadContent(projectRoot: string): Promise<ContentSnapshot> {
  const root = path.resolve(projectRoot)
  const siteFile = path.join(root, 'content/site.json')
  const siteData = record(await json(siteFile), siteFile)
  fields(siteData, ['title', 'description', 'url', 'repositoryUrl', 'editBaseUrl'], siteFile)
  const site: SiteConfig = {
    title: string(siteData.title, 'title', siteFile),
    description: string(siteData.description, 'description', siteFile),
    url: httpUrl(siteData.url, 'url', siteFile).replace(/\/$/, ''),
    repositoryUrl: httpUrl(siteData.repositoryUrl, 'repositoryUrl', siteFile),
    editBaseUrl: httpUrl(siteData.editBaseUrl, 'editBaseUrl', siteFile),
  }
  if (new URL(site.url).pathname !== '/' || new URL(site.url).search || new URL(site.url).hash) {
    fail(siteFile, 'url 必须是站点根网址（例如 https://tool.zqzyz.com）')
  }
  const registryFile = path.join(root, 'src/tools/registry.json')
  const registry = existsSync(registryFile) ? record(await json(registryFile), registryFile) : {}
  const sources: { file: string; data: unknown; type: EntryType; body: string }[] = []
  for (const [directory, type] of [['commands', 'command'], ['notes', 'note']] as const) {
    for (const file of await filesIn(path.join(root, 'content', directory), '.md')) {
      const text = (await readFile(file, 'utf8')).replace(/^\uFEFF/, '')
      const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)
      if (!match) fail(file, 'Markdown 必须以 --- 包围的 YAML 元信息开头')
      const document = parseDocument(match[1]!, { uniqueKeys: true, schema: 'core' })
      if (document.errors.length) fail(file, `YAML 解析失败：${document.errors[0]!.message}`)
      sources.push({ file, type, data: document.toJS({ maxAliasCount: 20 }), body: text.slice(match[0].length) })
    }
  }
  for (const file of await filesIn(path.join(root, 'content/tools'), '.json')) {
    sources.push({ file, type: 'tool', data: await json(file), body: '' })
  }
  const bookmarksFile = path.join(root, 'content/bookmarks.json')
  if (existsSync(bookmarksFile)) {
    const bookmarks = await json(bookmarksFile)
    if (!Array.isArray(bookmarks)) fail(bookmarksFile, '网址文件必须是数组')
    for (const data of bookmarks) sources.push({ file: bookmarksFile, type: 'bookmark', data, body: '' })
  }

  const ids = new Map<string, string>()
  const published: { entry: ContentEntry; body: string; file: string }[] = []
  for (const source of sources) {
    const { file, type, body } = source
    const sourcePath = path.relative(root, file).replaceAll('\\', '/')
    const data = record(source.data, sourcePath)
    fields(data, [...commonFields, ...(type === 'bookmark' ? ['url'] : []), ...(type === 'tool' ? ['component'] : [])], sourcePath)
    const id = string(data.id ?? (type === 'bookmark' ? undefined : path.basename(file, path.extname(file))), 'id', sourcePath)
    if (!idPattern.test(id)) fail(sourcePath, `id "${id}" 必须是小写英文、数字和单个连字符组成的标识`)
    if (ids.has(id)) fail(sourcePath, `重复 id "${id}"，已在 ${ids.get(id)} 定义`)
    ids.set(id, sourcePath)
    const draft = boolean(data.draft, 'draft', sourcePath)
    const order = data.order ?? 100
    if (typeof order !== 'number' || !Number.isFinite(order)) fail(sourcePath, 'order 必须是有限数字')
    const entry: ContentEntry = {
      id, type, sourcePath,
      title: string(data.title, 'title', sourcePath),
      description: string(data.description, 'description', sourcePath),
      tags: strings(data.tags, 'tags', sourcePath),
      aliases: strings(data.aliases, 'aliases', sourcePath),
      pinned: boolean(data.pinned, 'pinned', sourcePath), order,
      href: type === 'bookmark' ? httpUrl(data.url, 'url', sourcePath) : `/${type === 'command' ? 'commands' : type === 'note' ? 'notes' : 'tools'}/${id}/`,
      searchText: '', commands: [],
    }
    if (type === 'tool') {
      entry.component = string(data.component, 'component', sourcePath)
      if (!draft) {
        const componentFile = registry[entry.component]
        if (typeof componentFile !== 'string' || !/^[A-Za-z][A-Za-z0-9-]*\.vue$/.test(componentFile)) {
          fail(sourcePath, `未知工具组件 "${entry.component}"，请先在 src/tools/registry.json 注册`)
        }
        if (!existsSync(path.join(root, 'src/tools', componentFile))) fail(sourcePath, `工具组件文件不存在：${componentFile}`)
      }
    }
    if (!draft && ['command', 'note'].includes(type) && !body.trim()) fail(sourcePath, '正文不能为空')
    if (!draft) published.push({ entry, body, file })
  }

  const byFile = new Map(published.filter(({ entry }) => entry.type !== 'bookmark').map(({ file, entry }) => [path.resolve(file), entry.href]))
  const routes = new Set(['/', ...published.filter(({ entry }) => entry.type !== 'bookmark').map(({ entry }) => entry.href)])

  function contentUrl(href: string, file: string, image = false): string {
    const label = path.relative(root, file)
    if (/^[\s\S]*[\u0000-\u0020\\]/.test(href)) fail(label, `链接包含空白或非法字符：${href}`)
    if (href.startsWith('#')) return href
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(href)) return httpUrl(href, '链接', label)
    if (href.startsWith('//')) fail(label, `请使用完整 https 网址：${href}`)
    const parts = /^([^?#]*)([?#].*)?$/.exec(href)!
    let pathname: string
    try { pathname = decodeURIComponent(parts[1]!) } catch { return fail(label, `链接编码无效：${href}`) }
    const suffix = parts[2] ?? ''
    if (!pathname) return href
    if (pathname.endsWith('.md') && !pathname.startsWith('/')) {
      const route = byFile.get(path.resolve(path.dirname(file), pathname))
      if (!route) fail(label, `引用的 Markdown 不存在或为草稿：${href}`)
      return route + suffix
    }
    if (!pathname.startsWith('/')) fail(label, `本地链接请使用站点绝对路径或相对 .md 路径：${href}`)
    const normalized = new URL(pathname, site.url).pathname
    if (!image && routes.has(normalized.endsWith('/') ? normalized : `${normalized}/`)) return (normalized.endsWith('/') ? normalized : `${normalized}/`) + suffix
    const publicRoot = path.join(root, 'public')
    const asset = path.resolve(publicRoot, `.${pathname}`)
    if (!asset.startsWith(publicRoot + path.sep) || !existsSync(asset) || !statSync(asset).isFile()) fail(label, `本地资源或页面不存在：${href}`)
    return encodeURI(pathname) + suffix
  }

  const pages: ContentSnapshot['pages'] = []
  for (const { entry, body, file } of published) {
    let codeIndex = 0
    const headingCounts = new Map<string, number>()
    const markdown = new Marked({
      gfm: true,
      renderer: {
        html({ text }) { return escapeHtml(text) },
        code({ text, lang }) {
          const language = lang?.trim().split(/\s+/)[0] || 'text'
          if (entry.type === 'command') entry.commands.push({ language, code: text })
          const id = `code-${++codeIndex}`
          return `<div class="code-block"><div class="code-toolbar"><span>${escapeHtml(language)}</span><button type="button" class="copy-button" data-copy="${id}" aria-label="复制第 ${codeIndex} 段代码">复制</button></div><pre><code id="${id}">${escapeHtml(text)}</code></pre><span class="copy-status" role="status"></span></div>\n`
        },
        heading({ tokens, depth, text }) {
          const base = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-') || 'section'
          const count = headingCounts.get(base) ?? 0
          headingCounts.set(base, count + 1)
          return `<h${depth} id="${escapeHtml(base + (count ? `-${count}` : ''))}">${this.parser.parseInline(tokens)}</h${depth}>\n`
        },
        link({ href, title, tokens }) {
          const url = contentUrl(href, file)
          const external = /^https?:/.test(url)
          return `<a href="${escapeHtml(url)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${this.parser.parseInline(tokens)}</a>`
        },
        image({ href, text, title }) {
          return `<img src="${escapeHtml(contentUrl(href, file, true))}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy" />`
        },
      },
    })
    const html = markdown.parse(body, { async: false })
    entry.searchText = [entry.title, entry.description, ...entry.tags, ...entry.aliases, body].join(' ').normalize('NFKC').toLocaleLowerCase()
    if (entry.type !== 'bookmark') pages.push({ entry, html })
  }
  const compare = (a: ContentEntry, b: ContentEntry) => Number(b.pinned) - Number(a.pinned) || a.order - b.order || a.id.localeCompare(b.id, 'en')
  return { site, entries: published.map(({ entry }) => entry).sort(compare), pages: pages.sort((a, b) => compare(a.entry, b.entry)) }
}
