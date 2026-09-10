/// <reference types="vite/client" />

declare module 'virtual:content' {
  export const entries: import('./content-types').ContentEntry[]
  export const site: import('./content-types').SiteConfig
}
