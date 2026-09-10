<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ContentEntry, EntryType, SiteConfig } from './content-types'
import { filterEntries, type EntryFilterType } from './lib/search'

const props = defineProps<{ entries: ContentEntry[]; site: SiteConfig }>()
const typeLabels: Record<EntryType, string> = {
  command: '命令', bookmark: '网址', tool: '工具', note: '笔记',
}
const typeSymbols: Record<EntryType, string> = {
  command: '>_', bookmark: '↗', tool: '{ }', note: '≡',
}
const tabs: { type: EntryFilterType; label: string }[] = [
  { type: 'all', label: '全部' },
  { type: 'command', label: '命令' },
  { type: 'bookmark', label: '网址' },
  { type: 'tool', label: '工具' },
  { type: 'note', label: '笔记' },
]
const query = ref('')
const type = ref<EntryFilterType>('all')
const tag = ref('')
const searchInput = ref<HTMLInputElement>()
const copyStatus = ref<Record<string, string>>({})
const copyTimers = new Map<string, ReturnType<typeof setTimeout>>()
const copying = new Set<string>()

const tags = computed(() => {
  const counts = new Map<string, number>()
  for (const entry of props.entries) {
    for (const value of new Set(entry.tags)) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts].map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
})
const typeCounts = computed(() => {
  const counts = { all: props.entries.length, command: 0, bookmark: 0, tool: 0, note: 0 }
  for (const entry of props.entries) counts[entry.type]++
  return counts
})
const results = computed(() => filterEntries(props.entries, {
  query: query.value, type: type.value, tag: tag.value,
}))
const isFiltered = computed(() => Boolean(query.value.trim() || type.value !== 'all' || tag.value))
const pinnedCount = computed(() => props.entries.filter((entry) => entry.pinned).length)
const contentUrl = computed(() => `${props.site.repositoryUrl.replace(/\/$/, '')}/tree/main/content`)

function readUrl() {
  const params = new URLSearchParams(window.location.search)
  query.value = params.get('query') ?? ''
  const requestedType = params.get('type')
  type.value = tabs.some((tab) => tab.type === requestedType) ? requestedType as EntryFilterType : 'all'
  tag.value = params.get('tag') ?? ''
}

function writeUrl(mode: 'push' | 'replace') {
  const url = new URL(window.location.href)
  const filters: [string, string][] = [
    ['query', query.value], ['type', type.value === 'all' ? '' : type.value], ['tag', tag.value],
  ]
  for (const [key, value] of filters) {
    if (value) url.searchParams.set(key, value)
    else url.searchParams.delete(key)
  }
  if (url.href !== window.location.href) window.history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', url)
}

function search(event: Event) {
  query.value = (event.target as HTMLInputElement).value
  writeUrl('replace')
}

function selectType(value: EntryFilterType) {
  type.value = value
  writeUrl('push')
}

function selectTag(value: string) {
  tag.value = tag.value === value ? '' : value
  writeUrl('push')
}

function clearSearch() {
  query.value = ''
  writeUrl('replace')
  searchInput.value?.focus()
}

function resetFilters() {
  query.value = ''
  type.value = 'all'
  tag.value = ''
  writeUrl('push')
  searchInput.value?.focus()
}

function keyboardShortcut(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const editing = target?.matches('input, textarea, select') || target?.isContentEditable
  if (event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    searchInput.value?.focus()
  } else if (event.key === 'Escape' && target === searchInput.value) {
    if (query.value) clearSearch()
    else searchInput.value?.blur()
  }
}

async function copyCode(event: MouseEvent, entryId: string, index: number, code: string) {
  const key = `${entryId}:${index}`
  if (copying.has(key)) return
  copying.add(key)
  clearTimeout(copyTimers.get(key))
  const codeElement = (event.currentTarget as HTMLElement).closest('.code-block')?.querySelector('code')
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
    await navigator.clipboard.writeText(code)
    copyStatus.value[key] = '已复制'
  } catch {
    if (codeElement) {
      const range = document.createRange()
      range.selectNodeContents(codeElement)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
    copyStatus.value[key] = '无法自动复制，已选中代码，请手动复制'
  } finally {
    copying.delete(key)
    copyTimers.set(key, setTimeout(() => { delete copyStatus.value[key] }, 6000))
  }
}

onMounted(() => {
  readUrl()
  window.addEventListener('popstate', readUrl)
  window.addEventListener('keydown', keyboardShortcut)
})
onBeforeUnmount(() => {
  window.removeEventListener('popstate', readUrl)
  window.removeEventListener('keydown', keyboardShortcut)
  for (const timer of copyTimers.values()) clearTimeout(timer)
})
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <header class="site-header">
    <a class="brand" href="/" :aria-label="`${site.title}首页`">
      <span class="brand-mark" aria-hidden="true">z<span>.</span></span>
      <span>{{ site.title }}<small>个人备忘 · 常用工具</small></span>
    </a>
    <nav class="header-actions" aria-label="站点导航">
      <a :href="contentUrl" target="_blank" rel="noopener noreferrer" class="edit-content-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m16 3 5 5M4 15 16 3a2.1 2.1 0 0 1 3 0l2 2a2.1 2.1 0 0 1 0 3L9 20l-6 1 1-6Z"/></svg>
        编辑内容
      </a>
      <a :href="site.repositoryUrl" target="_blank" rel="noopener noreferrer" class="github-link" aria-label="GitHub">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 19c-4 1-4-2-6-2m12 5v-4a3.5 3.5 0 0 0-1-3c3-.3 6-1.5 6-6a5 5 0 0 0-1.5-3.5A4.7 4.7 0 0 0 18.4 2S17 1.5 14.8 3a13 13 0 0 0-5.6 0C7 1.5 5.6 2 5.6 2a4.7 4.7 0 0 0-.1 3.5A5 5 0 0 0 4 9c0 4.5 3 5.7 6 6a3.5 3.5 0 0 0-1 3v4"/></svg>
        <span>GitHub</span>
      </a>
    </nav>
  </header>

  <main id="main-content" class="page-shell home-shell">
    <div class="workspace-heading">
      <div><p class="eyebrow">PERSONAL INDEX</p><h1>备忘与工具</h1></div>
      <p class="workspace-description">{{ site.description }}</p>
    </div>

    <form class="search-box" role="search" @submit.prevent>
      <label class="visually-hidden" for="content-search">搜索命令、网址、工具和笔记</label>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
      <input id="content-search" ref="searchInput" :value="query" type="search" placeholder="搜索命令、网址、工具和笔记…" autocomplete="off" @input="search" />
      <button v-if="query" type="button" class="search-clear" aria-label="清空搜索" @click="clearSearch">×</button>
      <kbd v-else aria-hidden="true">/</kbd>
    </form>

    <div class="type-tabs" role="group" aria-label="按内容类型筛选">
      <button v-for="tab in tabs" :key="tab.type" type="button" :class="['type-tab', { active: type === tab.type }]" :aria-pressed="type === tab.type" @click="selectType(tab.type)">
        {{ tab.label }}<span>{{ typeCounts[tab.type] }}</span>
      </button>
    </div>

    <div class="workspace-grid">
      <aside class="tag-sidebar" aria-label="标签筛选">
        <div class="sidebar-heading"><h2>标签</h2><span>{{ tags.length }}</span></div>
        <div class="tag-filters">
          <button type="button" :class="['tag-filter', { active: !tag }]" :aria-pressed="!tag" @click="selectTag('')"><span>全部标签</span><span>{{ entries.length }}</span></button>
          <button v-for="item in tags" :key="item.name" type="button" :class="['tag-filter', { active: tag === item.name }]" :aria-pressed="tag === item.name" @click="selectTag(item.name)"><span><i aria-hidden="true">#</i>{{ item.name }}</span><span>{{ item.count }}</span></button>
        </div>
        <div class="sidebar-note"><span class="small-pin" aria-hidden="true">◆</span><p>{{ pinnedCount }} 条常用记录<br /><span>常用在前，随手可取。</span></p></div>
        <p class="keyboard-hint"><kbd>/</kbd> 搜索 <span>·</span> <kbd>Esc</kbd> 清空</p>
      </aside>

      <section class="results-panel" aria-labelledby="results-heading">
        <div class="results-toolbar">
          <h2 id="results-heading">{{ isFiltered ? '筛选结果' : '所有记录' }}<span aria-live="polite">{{ results.length }} 条</span></h2>
          <button v-if="isFiltered" type="button" class="text-button" @click="resetFilters">清空筛选</button>
          <span v-else class="sort-hint">常用优先</span>
        </div>
        <div v-if="tag" class="active-filter">标签：<button type="button" @click="selectTag(tag)">{{ tag }} <span aria-hidden="true">×</span><span class="visually-hidden">，取消筛选</span></button></div>

        <div v-if="results.length" class="entry-list">
          <article v-for="entry in results" :key="entry.id" :class="['entry-card', `entry-${entry.type}`]">
            <div class="entry-row">
              <span :class="['entry-icon', `icon-${entry.type}`]" aria-hidden="true">{{ typeSymbols[entry.type] }}</span>
              <div class="entry-main">
                <div class="entry-title-line">
                  <h3><a :href="entry.href" :target="entry.type === 'bookmark' ? '_blank' : undefined" :rel="entry.type === 'bookmark' ? 'noopener noreferrer' : undefined">{{ entry.title }}<span v-if="entry.type === 'bookmark'" class="external-arrow" aria-label="在新标签页打开">↗</span></a></h3>
                  <span v-if="entry.pinned" class="pinned-label"><span aria-hidden="true">◆</span> 常用</span>
                </div>
                <p class="entry-description">{{ entry.description }}</p>
                <div class="entry-meta"><span class="entry-type">{{ typeLabels[entry.type] }}</span><span aria-hidden="true" class="meta-divider">·</span><div class="tags"><button v-for="value in entry.tags" :key="value" type="button" :class="['tag', { selected: value === tag }]" :aria-pressed="value === tag" @click="selectTag(value)">{{ value }}</button></div></div>
              </div>
              <a v-if="entry.type !== 'command'" :href="entry.href" :target="entry.type === 'bookmark' ? '_blank' : undefined" :rel="entry.type === 'bookmark' ? 'noopener noreferrer' : undefined" class="entry-open" :aria-label="`${entry.type === 'bookmark' ? '打开网址' : '查看'}：${entry.title}`">{{ entry.type === 'bookmark' ? '↗' : '→' }}</a>
            </div>
            <details v-if="entry.type === 'command' && entry.commands.length" class="command-preview">
              <summary><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg><span class="expand-label">展开命令</span><span class="collapse-label">收起命令</span><span class="command-count">{{ entry.commands.length }} 段</span></summary>
              <div class="command-snippets">
                <div v-for="(snippet, index) in entry.commands" :key="index" class="code-block">
                  <div class="code-toolbar"><span>{{ snippet.language || 'text' }}</span><button type="button" class="copy-button" @click="copyCode($event, entry.id, index, snippet.code)">{{ copyStatus[`${entry.id}:${index}`] === '已复制' ? '已复制 ✓' : '复制' }}<span class="visually-hidden">第 {{ index + 1 }} 段命令</span></button></div>
                  <pre tabindex="0"><code>{{ snippet.code }}</code></pre>
                  <p v-if="copyStatus[`${entry.id}:${index}`]" class="copy-status" role="status">{{ copyStatus[`${entry.id}:${index}`] }}</p>
                </div>
                <a :href="entry.href" class="command-detail-link">查看完整说明 <span aria-hidden="true">→</span></a>
              </div>
            </details>
          </article>
        </div>
        <div v-else class="empty-state">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="13" cy="13" r="8"/><path d="m19 19 8 8M10 13h6"/></svg>
          <h3>{{ isFiltered ? '没有找到匹配的记录' : '从第一条备忘开始' }}</h3>
          <p>{{ isFiltered ? '试试更短的关键词，或减少筛选条件。' : '把常用命令、网址和笔记放在这里。' }}</p>
          <button v-if="isFiltered" type="button" class="primary-button" @click="resetFilters">查看全部记录</button>
          <a v-else :href="contentUrl" target="_blank" rel="noopener noreferrer" class="primary-button">添加内容</a>
        </div>
        <p v-if="results.length" class="list-end">{{ isFiltered ? '以上是全部匹配记录' : '常用的，留在手边。' }}</p>
      </section>
    </div>
  </main>
  <footer class="site-footer"><span>{{ site.title }}</span><span>记录 · 查找 · 使用</span></footer>
</template>
