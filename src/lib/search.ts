import type { ContentEntry, EntryType } from '../content-types'

export type EntryFilterType = EntryType | 'all'

export interface EntryFilters {
  query: string
  type: EntryFilterType
  tag: string
}

function normalize(value: string): string {
  return value.normalize('NFKC').toLowerCase()
}

/** Match every whitespace-separated term across metadata, prose, and commands. */
export function filterEntries(entries: ContentEntry[], filters: EntryFilters): ContentEntry[] {
  const terms = normalize(filters.query).trim().split(/\s+/).filter(Boolean)
  return entries.filter((entry) => {
    if (filters.type !== 'all' && entry.type !== filters.type) return false
    if (filters.tag && !entry.tags.includes(filters.tag)) return false
    if (!terms.length) return true
    const searchable = normalize([
      entry.title, entry.description, ...entry.tags, ...entry.aliases, entry.searchText,
      ...entry.commands.map((snippet) => `${snippet.language} ${snippet.code}`),
    ].join('\n'))
    return terms.every((term) => searchable.includes(term))
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.order - b.order || a.title.localeCompare(b.title, 'zh-CN'))
}
