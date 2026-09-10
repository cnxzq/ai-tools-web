# 随手记 · ZQZYZ

个人备忘与工具站：查命令、打开网址、阅读笔记、使用 Web 小工具。使用 Vue + Vite + pnpm + Node，部署到 [tool.zqzyz.com](https://tool.zqzyz.com/)。

首页支持名称、别名、标签、正文和命令搜索，多词按 AND 匹配；支持类型与标签筛选、常用优先、命令展开与逐段复制。按 `/` 聚焦搜索，`Esc` 清空搜索。筛选状态保存在 URL，浏览器后退可以恢复。

仓库中的 5 条命令、6 个网址、3 篇笔记是可替换的起始样例；JSON 格式化工具已实现。它们不是从个人历史记录导入的收藏。

## 本地开发与检查

使用 Node 24.12+（CI 使用 Node 24）及 `package.json` 中指定的 pnpm 版本。

```powershell
pnpm install --frozen-lockfile
pnpm dev
pnpm check:content
pnpm test
pnpm build
pnpm preview
```

`pnpm dev` 会监听内容文件的新增、修改和删除，生成成功后自动刷新。内容错误显示具体文件与字段，修正后自动恢复。`pnpm build` 包含类型检查、页面构建、正文/本地链接/sitemap 产物校验。

## 在 GitHub 更新内容

| 内容 | 编辑位置 | 结果 |
| --- | --- | --- |
| 站点名称与简介 | [content/site.json](content/site.json) | 全站信息 |
| 常用命令 | [content/commands/](content/commands/) 下的 `.md` | 首页命令预览与 `/commands/<id>/` |
| 备忘笔记 | [content/notes/](content/notes/) 下的 `.md` | `/notes/<id>/` |
| 常用网址 | [content/bookmarks.json](content/bookmarks.json) 数组 | 首页直接打开外链 |
| 工具目录 | [content/tools/](content/tools/) 下的 `.json` | `/tools/<id>/`，引用已有 Vue 组件 |

复制同目录样例再修改即可。提交到 `main` 后，Actions 测试、构建并自动发布；PR 只检查，不发布。测试或构建失败不会进入部署。删除内容或改成草稿后，下次成功发布会移除对应页面。

### 命令和笔记

Markdown 开头写 YAML 元信息，正文使用普通 Markdown。命令页面的 fenced code 块会自动出现在首页展开区域，并带复制按钮。

````markdown
---
id: node-version
title: 查看 Node 版本
description: 检查当前终端使用的 Node.js 版本。
tags: [Node, 开发]
aliases: [node, version]
pinned: true
order: 10
---

适用于 PowerShell 和 Bash：

```sh
node --version
```
````

公共字段规则：

- `title`、`description` 必填；`id` 在 Markdown 和工具 JSON 中可省略，默认使用文件名。
- `id` 全站唯一，只允许小写英文、数字及单个连字符。修改标题不用修改 `id`，避免地址变化。
- `tags`、`aliases` 默认为空数组；`pinned` 默认 `false`；`order` 默认 `100`，数值越小越靠前。
- `draft: true` 不进入首页、搜索、页面或 sitemap；元信息仍需符合结构要求。
- 未知字段会报错，避免 `draft` 等字段拼写错误后被忽略。
- 代码块注明 `powershell`、`bash` 等环境，正文说明要替换的端口、路径等参数。

站内 Markdown 可写 `[下一篇](./next.md)` 或 `[命令](../commands/node-version.md)`，构建时转换为页面地址。页面链接也可使用 `/notes/example/`。图片等资源放在 `public/`，使用 `/images/example.png` 这类根路径引用。构建检查本地目标是否存在；不在线检查外部网站可用性或锚点存在性。外部链接使用完整 HTTP/HTTPS 网址。原始 HTML 按文本显示，不执行嵌入脚本。

### 常用网址

向 `content/bookmarks.json` 数组添加一项：

```json
{
  "id": "node-docs",
  "title": "Node.js 文档",
  "description": "Node.js API 参考。",
  "url": "https://nodejs.org/docs/latest/api/",
  "tags": ["Node", "文档"],
  "aliases": ["nodejs"],
  "pinned": false,
  "order": 50
}
```

### 新增交互工具

1. 在 `src/tools/` 编写 Vue 组件，将功能和样式放在组件内。
2. 在 [src/tools/registry.json](src/tools/registry.json) 注册组件标识与文件名，例如 `"json-formatter": "JsonFormatter.vue"`。
3. 在 `content/tools/` 新增 JSON，填写公共字段和 `component` 注册标识。

工具组件按需加载；首页不加载其功能代码。JSON 工具只在浏览器处理文本，保留数字原文、重复键和字符串转义，支持格式化、压缩、校验与结果复制。输入限制为 200 万字符、最多 256 层嵌套。

## 构建与部署结构

- `build/content.ts`：解析 JSON/YAML/Markdown、字段和引用校验。
- `build/site.ts`：公共模板、真实 HTML 页面、sitemap、robots。
- `build/plugin.ts`：开发时的内容监听与首页虚拟数据模块。
- `.generated/`：自动生成的 Vite 多页面入口，不手动编辑、不提交。
- `dist/`：最终静态产物，不提交；详情正文不依赖 JavaScript，搜索与工具交互需要 JavaScript。

GitHub 仓库 **Settings → Pages → Source** 保持 **GitHub Actions**，自定义域名保持 `tool.zqzyz.com`。站点使用根路径 `/`，无需手动更新 sitemap，也无需服务器或数据库。撤销一次内容发布可以 revert 对应提交，再由同一流程重新发布。
