import assert from 'node:assert/strict'
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { loadContent } from '../build/content.ts'
import { writeSite } from '../build/site.ts'

const site = {
  title: 'Fixture collection',
  description: 'A small content collection for contract tests.',
  url: 'https://tools.example.com/',
  repositoryUrl: 'https://github.com/example/tools',
  editBaseUrl: 'https://github.com/example/tools/edit/main/',
}

async function fixture(t, files = {}) {
  const root = await mkdtemp(join(tmpdir(), 'ai-tools-content-'))
  t.after(async () => {
    assert.equal(dirname(root), resolve(tmpdir()), 'Fixture cleanup must remain inside the temporary directory')
    assert.ok(basename(root).startsWith('ai-tools-content-'), 'Fixture cleanup must target its own generated directory')
    await rm(root, { recursive: true, force: true })
  })
  for (const directory of ['content/commands', 'content/notes', 'content/tools', 'src/tools', 'public']) {
    await mkdir(join(root, directory), { recursive: true })
  }
  const initial = {
    'content/site.json': JSON.stringify(site),
    'content/bookmarks.json': '[]',
    'src/tools/registry.json': '{}',
    ...files,
  }
  for (const [path, body] of Object.entries(initial)) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), body, 'utf8')
  }
  return root
}

function markdown(body = 'A useful explanation.', extra = '') {
  return `---\ntitle: Example entry\ndescription: A useful entry for the contract test.\n${extra}---\n\n${body}\n`
}

function bookmark(extra = {}) {
  return {
    id: 'reference',
    title: 'Reference',
    description: 'Official reference material.',
    url: 'https://example.com/reference',
    ...extra,
  }
}

function tool(extra = {}) {
  return {
    title: 'JSON formatter',
    description: 'Format JSON in the browser.',
    component: 'json-formatter',
    ...extra,
  }
}

const registeredTool = {
  'src/tools/registry.json': JSON.stringify({ 'json-formatter': 'JsonFormatter.vue' }),
  'src/tools/JsonFormatter.vue': '<template><textarea aria-label="JSON" /></template>',
}

test('loads the four content types while only internal entries create pages', async (t) => {
  const root = await fixture(t, {
    ...registeredTool,
    'content/bookmarks.json': JSON.stringify([bookmark()]),
    'content/notes/getting-started.md': markdown('Read these instructions.'),
    'content/commands/show-version.md': markdown('Run this command.\n\n```sh\nnode --version\n```'),
    'content/tools/json-formatter.json': JSON.stringify(tool()),
  })
  const result = await loadContent(root)
  assert.deepEqual(result.site, { ...site, url: site.url.replace(/\/$/, '') })
  assert.deepEqual(new Set(result.entries.map((entry) => entry.type)), new Set(['bookmark', 'note', 'command', 'tool']))
  assert.equal(result.pages.length, 3)
  assert.equal(result.entries.find((entry) => entry.id === 'reference')?.href, bookmark().url)
  const command = result.entries.find((entry) => entry.id === 'show-version')
  assert.ok(command?.commands.some((snippet) => snippet.language === 'sh' && snippet.code.trim() === 'node --version'))
  assert.match(command.searchText, /node --version/)
  for (const page of result.pages) {
    assert.ok(result.entries.some((entry) => entry.id === page.entry.id))
    assert.match(page.entry.href, /^\//)
    assert.equal(typeof page.html, 'string')
  }
})

test('rejects ids that cannot safely become stable public paths', async (t) => {
  for (const id of ['../escape', 'nested/page', 'Uppercase', 'two words', '']) {
    await t.test(JSON.stringify(id), async (t) => {
      const root = await fixture(t, {
        'content/bookmarks.json': JSON.stringify([bookmark({ id })]),
      })
      await assert.rejects(() => loadContent(root))
    })
  }
})

test('requires globally unique ids, including entries of another type and drafts', async (t) => {
  for (const extra of ['', 'draft: true\n']) {
    await t.test(extra ? 'duplicate draft' : 'duplicate published entry', async (t) => {
      const root = await fixture(t, {
        'content/bookmarks.json': JSON.stringify([bookmark({ id: 'same-id' })]),
        'content/notes/same-id.md': markdown('A duplicate id.', extra),
      })
      await assert.rejects(() => loadContent(root))
    })
  }
})

test('drafts are excluded from both the index and generated pages', async (t) => {
  const root = await fixture(t, {
    'content/bookmarks.json': JSON.stringify([bookmark({ draft: true })]),
    'content/notes/draft-note.md': markdown('Unpublished text.', 'draft: true\n'),
    'content/notes/published-note.md': markdown('Published text.'),
  })
  const { entries, pages } = await loadContent(root)
  assert.deepEqual(entries.map((entry) => entry.id), ['published-note'])
  assert.deepEqual(pages.map((page) => page.entry.id), ['published-note'])
})

test('draft content must still satisfy its data contract', async (t) => {
  const root = await fixture(t, {
    'content/bookmarks.json': JSON.stringify([bookmark({ draft: true, title: 42 })]),
  })
  await assert.rejects(() => loadContent(root))
})

test('published tools require both a registry entry and an existing Vue component', async (t) => {
  await t.test('unknown component', async (t) => {
    const root = await fixture(t, {
      'content/tools/json-formatter.json': JSON.stringify(tool()),
    })
    await assert.rejects(() => loadContent(root))
  })
  await t.test('missing component file', async (t) => {
    const root = await fixture(t, {
      'src/tools/registry.json': registeredTool['src/tools/registry.json'],
      'content/tools/json-formatter.json': JSON.stringify(tool()),
    })
    await assert.rejects(() => loadContent(root))
  })
})

test('rejects executable or local-file protocols in bookmarks and Markdown links', async (t) => {
  for (const url of ['javascript:alert(1)', 'data:text/html,unsafe', 'file:///etc/passwd']) {
    await t.test(`bookmark ${url}`, async (t) => {
      const root = await fixture(t, {
        'content/bookmarks.json': JSON.stringify([bookmark({ url })]),
      })
      await assert.rejects(() => loadContent(root))
    })
    await t.test(`Markdown ${url}`, async (t) => {
      const root = await fixture(t, {
        'content/notes/unsafe-link.md': markdown(`[Unsafe link](${url})`),
      })
      await assert.rejects(() => loadContent(root))
    })
  }
})

test('renders Markdown and code while raw HTML remains inert text', async (t) => {
  const body = [
    '## Instructions',
    '',
    '**Keep this text readable.**',
    '',
    '<script>alert("raw-html")</script>',
    '',
    '<img src="missing.png" onerror="alert(1)">',
    '',
    '```html',
    '<button onclick="alert(1)">example</button>',
    '```',
  ].join('\n')
  const root = await fixture(t, { 'content/notes/safe-markdown.md': markdown(body) })
  const { pages } = await loadContent(root)
  assert.equal(pages.length, 1)
  const html = pages[0].html
  assert.match(html, /<h2(?:\s[^>]*)?>Instructions<\/h2>/)
  assert.match(html, /<strong>Keep this text readable\.<\/strong>/)
  assert.doesNotMatch(html, /<(?:script|img)(?:\s|>)/i)
  assert.doesNotMatch(html, /<[^>]*\son(?:click|error)\s*=/i)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /&lt;button/)
})

test('resolves relative Markdown references to generated routes and validates public assets', async (t) => {
  const root = await fixture(t, {
    'content/notes/start.md': markdown('[Next](./next.md#usage)\n\n![Example](/assets/example.svg)'),
    'content/notes/next.md': markdown('## Usage\n\nThe next step.'),
    'public/assets/example.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>',
  })
  const { pages } = await loadContent(root)
  const start = pages.find((page) => page.entry.id === 'start')
  const next = pages.find((page) => page.entry.id === 'next')
  assert.ok(start && next)
  assert.ok(start.html.includes(`href="${next.entry.href}#usage"`))
  assert.ok(start.html.includes('src="/assets/example.svg"'))
  assert.doesNotMatch(start.html, /href="[^\"]*\.md(?:#|\")/)
})

test('rejects links to missing or unpublished local content and missing assets', async (t) => {
  const cases = [
    { name: 'missing Markdown', body: '[Missing](./missing.md)' },
    { name: 'missing public route', body: '[Missing](/notes/missing/)' },
    { name: 'missing image', body: '![Missing](/assets/missing.png)' },
    {
      name: 'draft Markdown',
      body: '[Draft](./draft-note.md)',
      extra: { 'content/notes/draft-note.md': markdown('Draft text.', 'draft: true\n') },
    },
  ]
  for (const item of cases) {
    await t.test(item.name, async (t) => {
      const root = await fixture(t, {
        'content/notes/start.md': markdown(item.body),
        ...item.extra,
      })
      await assert.rejects(() => loadContent(root))
    })
  }
})

test('regeneration removes stale generated pages while preserving files outside its directory', async (t) => {
  const root = await fixture(t, { 'keep.txt': 'An unrelated source file.' })
  await writeSite(root, new Map([
    ['index.html', '<h1>First version</h1>'],
    ['notes/removed/index.html', '<h1>Old page</h1>'],
    ['sitemap.xml', '<urlset/>'],
  ]))
  const inputs = await writeSite(root, new Map([
    ['index.html', '<h1>Second version</h1>'],
    ['notes/current/index.html', '<h1>Current page</h1>'],
    ['sitemap.xml', '<urlset/>'],
  ]))
  assert.equal(await readFile(join(root, '.generated/index.html'), 'utf8'), '<h1>Second version</h1>')
  await assert.rejects(() => access(join(root, '.generated/notes/removed/index.html')), { code: 'ENOENT' })
  assert.equal(await readFile(join(root, 'keep.txt'), 'utf8'), 'An unrelated source file.')
  assert.deepEqual(new Set(inputs), new Set([
    join(root, '.generated/index.html'),
    join(root, '.generated/notes/current/index.html'),
  ]))
})

test('generation rejects paths outside its owned directory before changing existing outputs', async (t) => {
  const root = await fixture(t, { 'keep.txt': 'Preserve this file.' })
  for (const unsafe of ['../keep.txt', 'nested/../../../keep.txt', join(root, 'keep.txt')]) {
    await writeSite(root, new Map([['index.html', '<h1>Existing output</h1>']]))
    await assert.rejects(() => writeSite(root, new Map([
      ['index.html', '<h1>Replacement</h1>'],
      [unsafe, 'Unsafe replacement'],
    ])))
    assert.equal(await readFile(join(root, '.generated/index.html'), 'utf8'), '<h1>Existing output</h1>')
    assert.equal(await readFile(join(root, 'keep.txt'), 'utf8'), 'Preserve this file.')
  }
})
