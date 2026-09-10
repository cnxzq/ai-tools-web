import assert from 'node:assert/strict'
import test from 'node:test'
import { formatJson, JsonFormatError, JSON_INPUT_LIMIT } from './json-format.ts'

test('formats all JSON root types without changing their parsed values', () => {
  const values = [null, true, false, 42, -12.5, '中文 "quoted"\nline', [], {}, { a: [1, {}, [], null], b: '\\path' }]
  for (const value of values) {
    const source = JSON.stringify(value)
    assert.deepEqual(JSON.parse(formatJson(source)), value)
    assert.equal(formatJson(formatJson(source), 'compact'), source)
    assert.equal(formatJson(source, 'validate'), '')
  }
  assert.equal(formatJson('{"a":[1,2]}'), '{\n  "a": [\n    1,\n    2\n  ]\n}')
})

test('preserves number lexemes, escapes, member order and duplicate keys', () => {
  const compact = '{"id":9007199254740993,"tiny":1e-999,"huge":1E+999,"zero":-0,"decimal":1.2300,"s":"\\u4e2d\\/", "id":2}'.replace(', "id"', ',"id"')
  assert.equal(formatJson(formatJson(compact), 'compact'), compact)
  assert.equal(formatJson('9007199254740993'), '9007199254740993')
  assert.equal(formatJson('  " white space  " \r\n', 'compact'), '" white space  "')
})

test('rejects malformed syntax and non-JSON whitespace', () => {
  const invalid = ['', ' ', '{a:1}', "{'a':1}", '[1,]', '{"a":1,}', '{"a" 1}', '[1 2]', '01', '+1', '.5', '1.', '1e', '1e+', 'true false', 'undefined', 'NaN', 'Infinity', '"\\x41"', '"\\u123"', '"line\nline"', '"unterminated', '/*comment*/null', '\u00a0null', '[', '{', '[true', '{"a":', '{"a":1]']
  for (const source of invalid) {
    assert.throws(() => JSON.parse(source), SyntaxError, source)
    assert.throws(() => formatJson(source), JsonFormatError, source)
  }
})

test('reports a useful line, column and editor selection offset', () => {
  assert.throws(() => formatJson('{\n  "a": 1,\n}'), (error) => {
    assert.ok(error instanceof JsonFormatError)
    assert.equal(error.line, 3)
    assert.equal(error.column, 1)
    assert.equal(error.offset, 12)
    assert.match(error.message, /逗号/)
    return true
  })
})

test('bounds input size and nesting to avoid unbounded browser work', () => {
  const nested = (depth) => '['.repeat(depth) + '0' + ']'.repeat(depth)
  assert.equal(formatJson(nested(256), 'compact'), nested(256))
  assert.throws(() => formatJson(nested(257)), /256/)
  assert.throws(() => formatJson(' '.repeat(JSON_INPUT_LIMIT + 1)), /2,000,000/)
})

test('matches native JSON syntax acceptance across single-character mutations', () => {
  const fixtures = ['{"a":[1,true,null,"x"],"b":-1.2e+3}', '[{},[],false,"\\u1234","\\n"]', '"a\\\\b\\\"c"']
  const replacements = [' ', '"', '\\', ',', ':', '[', ']', '{', '}', '0', '.', 'e', '\n', '\u0000']
  for (const source of fixtures) {
    for (let offset = 0; offset <= source.length; offset++) {
      for (const replacement of replacements) {
        const changed = source.slice(0, offset) + replacement + source.slice(offset + 1)
        let nativeValid = true
        try { JSON.parse(changed) } catch { nativeValid = false }
        let formatterValid = true
        try { formatJson(changed, 'validate') } catch { formatterValid = false }
        assert.equal(formatterValid, nativeValid, JSON.stringify(changed))
      }
    }
  }
})
