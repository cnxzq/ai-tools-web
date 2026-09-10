---
title: JSON 常见格式问题
description: 快速排查引号、尾逗号、注释，以及数字精度问题。
tags: [JSON, Web, 备忘]
aliases: [语法, parse, 双引号, 尾逗号, 大整数, 精度]
order: 20
---

## 常见检查项

- 对象键名和字符串都使用双引号。
- 最后一个成员后面不能有逗号。
- 标准 JSON 不支持注释、`undefined`、`NaN` 或 `Infinity`。
- 布尔值和空值写成小写的 `true`、`false`、`null`。
- 字符串内部换行写成 `\n`，路径中的反斜杠写成 `\\`。

```json
{
  "name": "备忘示例",
  "enabled": true,
  "tags": ["JSON", "命令"],
  "path": "C:\\temp\\example.json"
}
```

## 根节点不一定是对象

数组、字符串、数字、布尔值和 `null` 也可以是完整 JSON。本站的 [JSON 格式化工具](/tools/json-formatter/) 支持这些值。

## 大整数与重复键

JavaScript 数值有精度边界。本站工具只调整 JSON 结构之间的空白，保留数字原文；接收数据的其他程序仍可能发生精度转换。作为标识的长整数，适合在数据协议中约定为字符串。

对象键名应保持唯一。本站格式化会保留重复键，但不同程序读取重复键时可能产生不同结果。

参考：[JSON 标准 RFC 8259](https://www.rfc-editor.org/rfc/rfc8259.html)。
