import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { loadContent } from './build/content.ts'
import { siteDocuments, writeSite } from './build/site.ts'
import { contentPlugin } from './build/plugin.ts'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(async (): Promise<UserConfig> => {
  const snapshot = await loadContent(root)
  const input = await writeSite(root, siteDocuments(snapshot))
  return {
    root: path.join(root, '.generated'),
    base: '/',
    appType: 'mpa',
    publicDir: path.join(root, 'public'),
    plugins: [contentPlugin(root, snapshot), vue(), UnoCSS(path.join(root, 'uno.config.ts'))],
    resolve: {
      alias: { '@': path.join(root, 'src'), '/src': path.join(root, 'src') },
    },
    server: { fs: { allow: [root] } },
    build: {
      outDir: path.join(root, 'dist'),
      emptyOutDir: true,
      rolldownOptions: { input },
    },
  }
})
