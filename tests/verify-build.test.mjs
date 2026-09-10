import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { loadContent } from '../build/content.ts'
import { siteDocuments } from '../build/site.ts'
import { verifyBuild } from '../scripts/verify-build.mjs'

async function artifactFixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'ai-tools-content-'))
  t.after(async () => {
    assert.equal(dirname(root), resolve(tmpdir()))
    assert.ok(basename(root).startsWith('ai-tools-content-'))
    await rm(root, { recursive: true, force: true })
  })
  const files = {
    'content/site.json': JSON.stringify({
      title: 'Artifact fixture',
      description: 'A collection for checking static build output.',
      url: 'https://tools.example.com',
      repositoryUrl: 'https://github.com/example/tools',
      editBaseUrl: 'https://github.com/example/tools/edit/main/',
    }),
    'content/notes/example.md': '---\ntitle: Example note\ndescription: A published example.\n---\n\nThis paragraph must be readable without JavaScript.\n\n```html\n<a href="/not-a-real-link/">A code example, not navigation</a>\n```\n',
    'content/bookmarks.json': '[]',
    'src/tools/registry.json': '{}',
    'dist/assets/site.js': '// bundled script placeholder',
    'dist/assets/site.css': 'body { color: black }',
    'dist/favicon.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  }
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), content, 'utf8')
  }
  const snapshot = await loadContent(root)
  for (const [path, body] of siteDocuments(snapshot)) {
    await mkdir(dirname(join(root, 'dist', path)), { recursive: true })
    const output = path.endsWith('.html')
      ? body.replace(/\/src\/(?:main|detail)\.ts/g, '/assets/site.js').replace('</head>', '<link rel="stylesheet" href="/assets/site.css" /></head>')
      : body
    await writeFile(join(root, 'dist', path), output, 'utf8')
  }
  return root
}

test('accepts complete static output and ignores escaped HTML examples as navigation', async (t) => {
  const root = await artifactFixture(t)
  const result = await verifyBuild(root)
  assert.equal(result.pages, 2)
  assert.equal(result.htmlFiles, 3)
  assert.ok(result.links > 0)
})

test('accepts a same-site directory URL without a trailing slash when its index exists', async (t) => {
  const root = await artifactFixture(t)
  const index = join(root, 'dist/index.html')
  const html = await readFile(index, 'utf8')
  await writeFile(index, html.replace('</body>', '<a href="https://tools.example.com/notes/example?view=full#details">Example note</a></body>'))
  const result = await verifyBuild(root)
  assert.equal(result.pages, 2)
})

test('rejects a directory URL when the directory has no index page', async (t) => {
  const root = await artifactFixture(t)
  await mkdir(join(root, 'dist/empty-directory'))
  const index = join(root, 'dist/index.html')
  const html = await readFile(index, 'utf8')
  await writeFile(index, html.replace('</body>', '<a href="https://tools.example.com/empty-directory">Missing page</a></body>'))
  await assert.rejects(() => verifyBuild(root), /Broken local link.*empty-directory.*index\.html/)
})

test('rejects an otherwise valid page whose body would only appear after JavaScript runs', async (t) => {
  const root = await artifactFixture(t)
  const page = join(root, 'dist/notes/example/index.html')
  const html = await readFile(page, 'utf8')
  await writeFile(page, html.replace(/<article\b[^>]*>[\s\S]*?<\/article>/, '<article></article>'))
  await assert.rejects(() => verifyBuild(root), /Static body is missing or incomplete/)
})

test('rejects missing bundled assets', async (t) => {
  const root = await artifactFixture(t)
  await unlink(join(root, 'dist/assets/site.css'))
  await assert.rejects(() => verifyBuild(root), /Broken local link.*site\.css/)
})

test('rejects stale HTML routes left over from deleted content', async (t) => {
  const root = await artifactFixture(t)
  await writeFile(join(root, 'dist/stale.html'), '<!doctype html><title>Stale page</title>')
  await assert.rejects(() => verifyBuild(root), /Generated HTML routes do not match published content/)
})

test('rejects a sitemap that omits a published page', async (t) => {
  const root = await artifactFixture(t)
  await writeFile(join(root, 'dist/sitemap.xml'), '<urlset><url><loc>https://tools.example.com/</loc></url></urlset>')
  await assert.rejects(() => verifyBuild(root), /Sitemap does not match published HTML pages/)
})
