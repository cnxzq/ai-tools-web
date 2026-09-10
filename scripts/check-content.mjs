import { loadContent } from '../build/content.ts'
import { fileURLToPath } from 'node:url'
const snapshot = await loadContent(fileURLToPath(new URL('..', import.meta.url)))
console.log(`内容校验通过：${snapshot.entries.length} 个条目，${snapshot.pages.length} 个内容页面。`)
