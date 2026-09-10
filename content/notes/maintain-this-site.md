---
title: 怎样维护这份备忘
description: 直接在 GitHub 编辑 JSON 与 Markdown，提交后由构建流程更新页面。
tags: [GitHub, 备忘]
aliases: [编辑, 新增, markdown, md, json, 发布, 部署]
order: 30
---

## 选择内容文件

- 常用命令：在 `content/commands/` 新增或修改 Markdown。
- 备忘笔记：在 `content/notes/` 新增或修改 Markdown。
- 常用网址：编辑 `content/bookmarks.json`。
- 工具目录：在 `content/tools/` 新增或修改 JSON；工具功能需要已有的 Vue 组件。

复制同目录的一份内容作为起点，修改标题、简介和正文。`id` 是稳定标识；Markdown 未填写时使用文件名，避免仅为了改标题而改动它。

## 让内容更容易找到

`tags` 用于筛选，`aliases` 用于记录英文名称、缩写或其他搜索词。`pinned: true` 放入常用区，`order` 越小越靠前。

## 编辑与发布

页面的编辑入口可以定位到 GitHub 中的源文件。未准备好的内容设为 `draft: true`。提交到 `main` 后，Actions 校验内容并构建发布；字段或链接校验失败时，先根据日志修正内容。

这批内容是可替换的起始示例，后续按实际使用习惯删改即可。
