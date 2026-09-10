import path from 'node:path'
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import { escapeHtml as e, type ContentSnapshot } from './content.ts'
import type { ContentEntry, SiteConfig } from '../src/content-types.ts'

const typeNames = { command: '命令', bookmark: '网址', tool: '工具', note: '笔记' }

function editUrl(site: SiteConfig, source: string) {
  return site.editBaseUrl.replace(/\/?$/, '/') + source.split('/').map(encodeURIComponent).join('/')
}

function header(site: SiteConfig, source?: string) {
  return `<header class="site-header"><a class="brand" href="/">${e(site.title)}</a><nav class="header-actions" aria-label="页面导航"><a href="/">全部条目</a><a href="${e(source ? editUrl(site, source) : site.repositoryUrl)}" target="_blank" rel="noopener noreferrer">${source ? '编辑此条目' : 'GitHub'}</a></nav></header>`
}

function document(site: SiteConfig, title: string, description: string, href: string, body: string, script: string, noindex = false) {
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="description" content="${e(description)}" /><meta name="theme-color" content="#f6f7f9" /><link rel="icon" type="image/svg+xml" href="/favicon.svg" /><link rel="canonical" href="${e(site.url + href)}" />${noindex ? '<meta name="robots" content="noindex" />' : ''}<title>${e(title)}</title></head>
<body>${body}<script type="module" src="/src/${script}"></script></body></html>\n`
}

function tags(entry: ContentEntry) {
  return `<div class="tags">${entry.tags.map((tag) => `<a class="tag" href="/?tag=${encodeURIComponent(tag)}">${e(tag)}</a>`).join('')}</div>`
}

export function siteDocuments(snapshot: ContentSnapshot): Map<string, string> {
  const { site, entries, pages } = snapshot
  const result = new Map<string, string>()
  const fallback = `${header(site)}<main class="page-shell"><h1>${e(site.title)}</h1><p>${e(site.description)}</p><noscript><p>可直接浏览以下条目；启用 JavaScript 后可搜索、筛选和复制命令。</p></noscript><ul>${entries.map((entry) => `<li><a href="${e(entry.href)}"${entry.type === 'bookmark' ? ' target="_blank" rel="noopener noreferrer"' : ''}>${e(entry.title)}</a> — ${e(entry.description)}</li>`).join('')}</ul></main>`
  result.set('index.html', document(site, site.title, site.description, '/', `<div id="app">${fallback}</div>`, 'main.ts'))
  for (const { entry, html } of pages) {
    const tool = entry.type === 'tool' ? `<section class="tool-panel" aria-label="${e(entry.title)}"><div id="tool-app" data-component="${e(entry.component!)}"><p>正在加载工具…</p></div><noscript>此工具需要启用 JavaScript。</noscript></section>` : ''
    const body = `${header(site, entry.sourcePath)}<main id="main-content" class="page-shell"><div class="detail-header"><a class="back-link" href="/">← 返回全部条目</a><p class="entry-type">${typeNames[entry.type]}</p><h1>${e(entry.title)}</h1><p>${e(entry.description)}</p>${tags(entry)}</div>${tool}<article class="prose">${html}</article><footer class="detail-footer"><a href="${e(editUrl(site, entry.sourcePath))}" target="_blank" rel="noopener noreferrer">在 GitHub 编辑此条目 ↗</a><a href="/">返回全部条目</a></footer></main><footer class="site-footer">${e(site.description)}</footer>`
    result.set(`${entry.href.slice(1)}index.html`, document(site, `${entry.title} · ${site.title}`, entry.description, entry.href, body, 'detail.ts'))
  }
  result.set('404.html', document(site, `页面不存在 · ${site.title}`, '这个条目可能已经移动或删除。', '/404.html', `${header(site)}<main class="page-shell"><h1>找不到这个条目</h1><p>地址可能有误，或条目已经移动、删除。</p><a href="/">返回首页搜索</a></main>`, 'detail.ts', true))
  result.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', ...pages.map(({ entry }) => entry.href)].map((href) => `<url><loc>${e(site.url + href)}</loc></url>`).join('')}</urlset>\n`)
  result.set('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`)
  return result
}

/** Only generated files under the dedicated .generated directory are owned here. */
export async function writeSite(root: string, documents: Map<string, string>): Promise<string[]> {
  const base = path.resolve(root, '.generated')
  const inside = (file: string) => {
    const absolute = path.resolve(base, file)
    if (!absolute.startsWith(base + path.sep)) throw new Error(`生成路径越界：${file}`)
    return absolute
  }
  await mkdir(base, { recursive: true })
  const keep = new Set([...documents.keys()].map(inside))
  async function removeStale(directory: string) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name)
      if (item.isSymbolicLink()) throw new Error(`生成目录不允许符号链接：${file}`)
      if (item.isDirectory()) await removeStale(file)
      else if (!keep.has(file)) await unlink(file)
    }
  }
  await removeStale(base)
  for (const [file, text] of documents) {
    const target = inside(file)
    await mkdir(path.dirname(target), { recursive: true })
    const current = await readFile(target, 'utf8').catch(() => null)
    if (current !== text) await writeFile(target, text, 'utf8')
  }
  return [...documents.keys()].filter((file) => file.endsWith('.html')).map(inside)
}
