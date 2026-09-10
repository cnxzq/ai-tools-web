import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadContent } from '../build/content.ts'

function decodeEntities(value) {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' }
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity) => {
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? match
    const code = entity[1].toLowerCase() === 'x' ? Number.parseInt(entity.slice(2), 16) : Number.parseInt(entity.slice(1), 10)
    return code <= 0x10ffff ? String.fromCodePoint(code) : match
  })
}

function plainText(html) {
  return decodeEntities(html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

async function filesWithin(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await filesWithin(path))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

function outputPath(dist, pathname) {
  const decoded = decodeURIComponent(pathname)
  const path = resolve(dist, `.${decoded}`)
  assert.ok(path === dist || path.startsWith(`${dist}${sep}`), `Path escapes dist: ${pathname}`)
  return decoded.endsWith('/') ? join(path, 'index.html') : path
}

function pageUrl(siteUrl, dist, file) {
  let path = relative(dist, file).split(sep).join('/')
  if (path === 'index.html') path = ''
  else if (path.endsWith('/index.html')) path = path.slice(0, -'index.html'.length)
  return new URL(`/${path}`, siteUrl)
}

async function requireOutputFile(path, reason, allowDirectoryIndex = false) {
  try {
    const information = await stat(path)
    if (allowDirectoryIndex && information.isDirectory()) {
      await requireOutputFile(join(path, 'index.html'), reason)
      return
    }
    assert.ok(information.isFile(), `${reason}: expected a file at ${path}`)
  } catch (error) {
    if (error?.code === 'ENOENT') assert.fail(`${reason}: missing ${path}`)
    throw error
  }
}

export async function verifyBuild(projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')) {
  const root = resolve(projectRoot)
  const dist = join(root, 'dist')
  const { site, pages } = await loadContent(root)
  const siteUrl = new URL(site.url)
  const htmlFiles = (await filesWithin(dist)).filter((file) => extname(file) === '.html')
  const expectedUrls = new Set([new URL('/', siteUrl).href])

  for (const { entry, html: body } of pages) {
    const url = new URL(entry.href, siteUrl)
    assert.equal(url.origin, siteUrl.origin, `Generated page must be local: ${entry.id}`)
    expectedUrls.add(url.href)
    const file = outputPath(dist, url.pathname)
    await requireOutputFile(file, `Page ${entry.id}`)
    const html = await readFile(file, 'utf8')
    assert.match(html, /<title\b[^>]*>[\s\S]+?<\/title>/i, `Missing title: ${entry.id}`)
    const heading = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i)?.[0] ?? ''
    assert.ok(plainText(heading).includes(entry.title), `Static heading is missing: ${entry.id}`)
    const expectedBody = plainText(body)
    if (expectedBody) {
      assert.ok(plainText(html).includes(expectedBody), `Static body is missing or incomplete: ${entry.id}`)
    }
  }

  let checkedLinks = 0
  const actualPageUrls = new Set()
  for (const file of htmlFiles) {
    const url = pageUrl(siteUrl, dist, file)
    if (url.pathname !== '/404.html') actualPageUrls.add(url.href)
    const html = (await readFile(file, 'utf8'))
      .replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, '$1</script>')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
    for (const tag of html.matchAll(/<[a-z][a-z\d:-]*\b[^>]*>/gi)) {
      for (const match of tag[0].matchAll(/\b(?:src|href)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
        const value = decodeEntities(match[1] ?? match[2])
        if (!value || value.startsWith('#')) continue
        const target = new URL(value, url)
        if (!['http:', 'https:'].includes(target.protocol) || target.origin !== siteUrl.origin) continue
        await requireOutputFile(outputPath(dist, target.pathname), `Broken local link in ${relative(dist, file)}: ${value}`, true)
        checkedLinks += 1
      }
    }
  }

  assert.deepEqual([...actualPageUrls].sort(), [...expectedUrls].sort(), 'Generated HTML routes do not match published content')
  const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8')
  const sitemapUrls = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => decodeEntities(match[1]))
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'Sitemap contains duplicate URLs')
  assert.deepEqual([...sitemapUrls].sort(), [...expectedUrls].sort(), 'Sitemap does not match published HTML pages')
  return { pages: expectedUrls.size, htmlFiles: htmlFiles.length, links: checkedLinks }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await verifyBuild()
  console.log(`Verified ${result.pages} published pages, ${result.htmlFiles} HTML files, and ${result.links} local links.`)
}
