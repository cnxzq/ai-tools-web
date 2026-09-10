import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { loadContent, type ContentSnapshot } from './content.ts'
import { siteDocuments, writeSite } from './site.ts'

const virtualId = 'virtual:content'
const resolvedId = '\0' + virtualId

/** Keep development and production on the same loader and HTML templates. */
export function contentPlugin(root: string, initial: ContentSnapshot): Plugin {
  let snapshot = initial
  let documents = siteDocuments(snapshot)
  return {
    name: 'personal-content',
    resolveId(id) { if (id === virtualId) return resolvedId },
    load(id) {
      if (id === resolvedId) return `export const site = ${JSON.stringify(snapshot.site)}; export const entries = ${JSON.stringify(snapshot.entries)};`
    },
    generateBundle() {
      for (const name of ['sitemap.xml', 'robots.txt']) {
        this.emitFile({ type: 'asset', fileName: name, source: documents.get(name)! })
      }
    },
    configureServer(server: ViteDevServer) {
      const contentDir = path.join(root, 'content')
      const registryFile = path.join(root, 'src/tools/registry.json')
      server.watcher.add([contentDir, registryFile])
      let timer: ReturnType<typeof setTimeout> | undefined
      let queue = Promise.resolve()
      let closed = false
      async function refresh() {
        try {
          const next = await loadContent(root)
          const nextDocuments = siteDocuments(next)
          if (closed) return
          await writeSite(root, nextDocuments)
          snapshot = next
          documents = nextDocuments
          const module = server.moduleGraph.getModuleById(resolvedId)
          if (module) server.moduleGraph.invalidateModule(module)
          server.ws.send({ type: 'full-reload', path: '*' })
          server.config.logger.info(`内容已更新：${snapshot.entries.length} 个条目`)
        } catch (error) {
          const failure = error instanceof Error ? error : new Error(String(error))
          server.config.logger.error(failure.message)
          server.ws.send({ type: 'error', err: { message: failure.message, stack: failure.stack ?? '', plugin: 'personal-content' } })
        }
      }
      const changed = (_event: string, file: string) => {
        const absolute = path.resolve(file)
        if (absolute !== registryFile && !absolute.startsWith(contentDir + path.sep)) return
        clearTimeout(timer)
        timer = setTimeout(() => { queue = queue.then(refresh) }, 100)
      }
      server.watcher.on('all', changed)
      server.httpServer?.once('close', () => {
        closed = true
        clearTimeout(timer)
        server.watcher.off('all', changed)
      })
    },
  }
}
