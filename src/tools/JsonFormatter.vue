<script setup lang="ts">
import { ref } from 'vue'
import { formatJson, JSON_INPUT_LIMIT, JsonFormatError, type JsonFormatMode } from './json-format'

const source = ref('')
const output = ref('')
const message = ref('')
const failed = ref(false)
const inputElement = ref<HTMLTextAreaElement>()
const outputElement = ref<HTMLTextAreaElement>()
const example = '{"name":"随手记","enabled":true,"tags":["命令","网址"],"id":9007199254740993,"value":null}'

function resetFeedback() {
  output.value = ''
  message.value = ''
  failed.value = false
}

function run(mode: JsonFormatMode) {
  resetFeedback()
  try {
    output.value = formatJson(source.value, mode)
    message.value = mode === 'validate' ? 'JSON 语法有效。' : mode === 'pretty' ? '已格式化为 2 空格缩进。' : '已移除结构之间的空白。'
  } catch (error) {
    failed.value = true
    message.value = error instanceof Error ? error.message : '处理失败，请检查输入内容。'
    if (error instanceof JsonFormatError && inputElement.value) {
      inputElement.value.focus()
      inputElement.value.setSelectionRange(error.offset, Math.min(error.offset + 1, source.value.length))
    }
  }
}

function loadExample() {
  source.value = example
  run('pretty')
}

function clear() {
  source.value = ''
  resetFeedback()
  inputElement.value?.focus()
}

async function copy() {
  try {
    await navigator.clipboard.writeText(output.value)
    failed.value = false
    message.value = '结果已复制。'
  } catch {
    failed.value = true
    message.value = '自动复制失败，已选中结果，请使用 Ctrl+C 或系统复制菜单。'
    outputElement.value?.focus()
    outputElement.value?.select()
  }
}
</script>

<template>
  <section class="json-tool" aria-label="JSON 格式化工具">
    <p class="tool-hint">内容仅在当前浏览器处理。保留数字、字符串转义、键顺序和重复键的原文。</p>
    <div class="tool-actions">
      <button class="primary" type="button" @click="run('pretty')">格式化</button>
      <button type="button" @click="run('compact')">压缩</button>
      <button type="button" @click="run('validate')">校验</button>
      <button type="button" @click="loadExample">填入示例</button>
      <button type="button" @click="clear">清空</button>
    </div>
    <p class="tool-feedback" :class="{ error: failed }" role="status" aria-live="polite">{{ message || '粘贴 JSON 后，选择需要的操作。' }}</p>
    <div class="tool-editors">
      <div class="editor-panel">
        <label for="json-input">输入 <span>{{ source.length.toLocaleString() }} 字符</span></label>
        <textarea id="json-input" ref="inputElement" v-model="source" aria-describedby="json-limit" :aria-invalid="failed || undefined" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder='{"hello": "world"}' @input="resetFeedback" />
      </div>
      <div class="editor-panel">
        <div class="output-heading">
          <label for="json-output">结果 <span>{{ output.length.toLocaleString() }} 字符</span></label>
          <button type="button" :disabled="!output" @click="copy">复制结果</button>
        </div>
        <textarea id="json-output" ref="outputElement" :value="output" readonly spellcheck="false" placeholder="格式化或压缩后的结果显示在这里" />
      </div>
    </div>
    <p id="json-limit" class="tool-hint">支持标准 JSON，包括字符串、数字、布尔值和 null；不支持注释或尾逗号。输入上限 {{ JSON_INPUT_LIMIT.toLocaleString() }} 字符，嵌套最多 256 层。</p>
  </section>
</template>

<style scoped>
.json-tool { color: var(--text, #202b37); }
.tool-hint { margin: 0 0 1rem; color: var(--muted, #627184); font-size: .86rem; line-height: 1.7; }
.tool-actions { display: flex; flex-wrap: wrap; gap: .55rem; }
button { border: 1px solid var(--border, #dbe2e9); border-radius: 7px; padding: .48rem .85rem; color: var(--text, #202b37); background: var(--surface, #fff); font: inherit; font-size: .86rem; cursor: pointer; }
button:hover { border-color: var(--accent, #2563eb); color: var(--accent, #2563eb); }
button.primary { border-color: var(--accent, #2563eb); background: var(--accent, #2563eb); color: white; }
button:disabled { cursor: default; opacity: .45; }
button:focus-visible, textarea:focus-visible { outline: 2px solid var(--accent, #2563eb); outline-offset: 3px; }
.tool-feedback { min-height: 1.5em; margin: .85rem 0; color: #20704d; font-size: .87rem; }
.tool-feedback.error { color: #b42318; }
.tool-editors { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-bottom: .9rem; }
.editor-panel { display: flex; flex-direction: column; min-width: 0; }
.editor-panel > label, .output-heading { display: flex; align-items: center; min-height: 2.65rem; gap: .65rem; }
label { font-weight: 600; font-size: .9rem; }
label span { color: var(--muted, #627184); font-size: .75rem; font-weight: 400; margin-left: .4rem; }
.output-heading { justify-content: space-between; }
.output-heading button { padding: .3rem .65rem; font-size: .78rem; }
textarea { box-sizing: border-box; width: 100%; min-height: 340px; resize: vertical; border: 1px solid var(--border, #dbe2e9); border-radius: 8px; padding: .9rem; color: var(--text, #202b37); background: var(--surface, #fff); font: .84rem/1.7 ui-monospace, SFMono-Regular, Consolas, monospace; tab-size: 2; white-space: pre; overflow-wrap: normal; }
textarea[readonly] { background: var(--background, #f8fafc); }
textarea::placeholder { color: #8390a0; }
@media (max-width: 720px) { .tool-editors { grid-template-columns: minmax(0, 1fr); } textarea { min-height: 240px; } }
</style>
