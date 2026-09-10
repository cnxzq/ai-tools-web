export type JsonFormatMode = 'pretty' | 'compact' | 'validate'

export const JSON_INPUT_LIMIT = 2_000_000
const JSON_OUTPUT_LIMIT = 8_000_000
const JSON_DEPTH_LIMIT = 256

export class JsonFormatError extends SyntaxError {
  readonly offset: number
  readonly line: number
  readonly column: number

  constructor(message: string, source: string, offset: number) {
    const lines = source.slice(0, offset).split(/\r\n|\r|\n/)
    const column = (lines.at(-1)?.length ?? 0) + 1
    super(`第 ${lines.length} 行，第 ${column} 列：${message}`)
    this.name = 'JsonFormatError'
    this.offset = offset
    this.line = lines.length
    this.column = column
  }
}

/**
 * Validate JSON grammar and only change whitespace between tokens.
 * Numbers, escaped strings, member order and duplicate keys remain verbatim:
 * no JavaScript number conversion or object reconstruction takes place.
 */
export function formatJson(source: string, mode: JsonFormatMode = 'pretty'): string {
  if (source.length > JSON_INPUT_LIMIT) {
    throw new Error('输入超过 2,000,000 字符，请缩小内容后再处理。')
  }

  let cursor = 0
  let outputLength = 0
  const chunks: string[] = []
  const number = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y
  const fail = (message: string, offset = cursor): never => {
    throw new JsonFormatError(message, source, offset)
  }
  const append = (text: string) => {
    if (mode === 'validate') return
    outputLength += text.length
    if (outputLength > JSON_OUTPUT_LIMIT) {
      throw new Error('排版结果超过 8,000,000 字符，请压缩输出或缩小内容。')
    }
    chunks.push(text)
  }
  const whitespace = () => {
    while (cursor < source.length && /[ \t\r\n]/.test(source[cursor]!)) cursor++
  }
  const newline = (depth: number) => {
    if (mode === 'pretty') append(`\n${'  '.repeat(depth)}`)
  }
  const readString = () => {
    const start = cursor++
    while (cursor < source.length) {
      const char = source[cursor]!
      if (char === '"') {
        cursor++
        append(source.slice(start, cursor))
        return
      }
      if (source.charCodeAt(cursor) < 0x20) fail('字符串中不能包含未转义的换行或控制字符。')
      if (char === '\\') {
        cursor++
        const escaped = source[cursor]
        if (escaped === undefined) fail('转义序列不完整。')
        if (escaped === 'u') {
          for (let digit = 0; digit < 4; digit++) {
            cursor++
            if (!/[0-9a-fA-F]/.test(source[cursor] ?? '')) {
              fail('Unicode 转义需要 4 位十六进制数字。')
            }
          }
        } else if (!'"\\/bfnrt'.includes(escaped!)) {
          fail('无效的字符串转义。')
        }
      }
      cursor++
    }
    fail('字符串缺少结束双引号。')
  }

  const readValue = (depth: number): void => {
    whitespace()
    const char = source[cursor]
    if (char === '"') {
      readString()
      return
    }
    if (char === '{' || char === '[') {
      if (depth >= JSON_DEPTH_LIMIT) fail('嵌套超过 256 层，请减少嵌套后再处理。')
      const object = char === '{'
      const close = object ? '}' : ']'
      append(char)
      cursor++
      whitespace()
      if (source[cursor] === close) {
        append(close)
        cursor++
        return
      }
      newline(depth + 1)
      while (cursor < source.length) {
        if (object) {
          if (source[cursor] !== '"') fail('对象的键名需要使用双引号。')
          readString()
          whitespace()
          if (source[cursor] !== ':') fail('键名后缺少冒号。')
          cursor++
          append(mode === 'pretty' ? ': ' : ':')
        }
        readValue(depth + 1)
        whitespace()
        if (source[cursor] === close) {
          newline(depth)
          append(close)
          cursor++
          return
        }
        if (source[cursor] !== ',') fail(`此处需要逗号或 ${close}。`)
        append(',')
        cursor++
        whitespace()
        if (source[cursor] === close) fail('最后一项后不能保留逗号。')
        newline(depth + 1)
      }
      fail(`内容未结束，缺少 ${close}。`)
    }
    for (const literal of ['true', 'false', 'null']) {
      if (source.startsWith(literal, cursor)) {
        cursor += literal.length
        append(literal)
        return
      }
    }
    number.lastIndex = cursor
    const match = number.exec(source)
    if (match) {
      cursor = number.lastIndex
      append(match[0])
      return
    }
    fail(cursor >= source.length ? '此处缺少 JSON 值。' : '此处需要对象、数组、字符串、数字、true、false 或 null。')
  }

  readValue(0)
  whitespace()
  if (cursor !== source.length) fail('JSON 值之后存在多余内容。')
  return chunks.join('')
}
