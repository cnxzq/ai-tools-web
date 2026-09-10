import type { Component } from 'vue'
import './base'
import registry from './tools/registry.json'

// Static content stays readable independently of this enhancement script.
document.addEventListener('click', async (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-copy]') : null
  if (!target) return
  const code = document.getElementById(target.dataset.copy ?? '')
  const status = target.closest('.code-block')?.querySelector('.copy-status')
  if (!code || !status) return
  try {
    await navigator.clipboard.writeText(code.textContent ?? '')
    status.textContent = '已复制'
    target.textContent = '已复制'
  } catch {
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(code)
    selection?.removeAllRanges()
    selection?.addRange(range)
    status.textContent = '无法自动复制，已选中代码，请手动复制。'
  }
})

const host = document.getElementById('tool-app')
if (host) {
  const modules = import.meta.glob<{ default: Component }>('./tools/*.vue')
  const file = (registry as Record<string, string>)[host.dataset.component ?? '']
  const load = file ? modules[`./tools/${file}`] : undefined
  if (load) {
    Promise.all([load(), import('vue')]).then(([{ default: component }, { createApp }]) => createApp(component).mount(host)).catch(() => {
      host.textContent = '工具加载失败，请刷新页面重试。'
    })
  } else host.textContent = '此工具暂时不可用。'
}
