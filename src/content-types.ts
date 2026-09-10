/** Shared contract between the build-time content loader and the browser. */
export type EntryType = 'command' | 'bookmark' | 'tool' | 'note'

export interface CodeSnippet {
  language: string
  code: string
}

export interface ContentEntry {
  id: string
  type: EntryType
  title: string
  description: string
  tags: string[]
  aliases: string[]
  pinned: boolean
  order: number
  href: string
  /** Plain text for local search. No Markdown parser is shipped to the browser. */
  searchText: string
  commands: CodeSnippet[]
  sourcePath: string
  component?: string
}

export interface SiteConfig {
  title: string
  description: string
  url: string
  repositoryUrl: string
  editBaseUrl: string
}
