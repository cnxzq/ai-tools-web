# Agent 工作指南

[返回 Agent 入口](../AGENTS.md) · [README 与内容示例](../README.md)

## 项目定位

这是个人备忘与常用工具站，主要承载命令、网址、笔记和浏览器小工具。界面优先考虑快速查找、直接使用、代码复制和移动端阅读。使用中文说明，保持紧凑布局；不主动改成营销首页、公开工具评测平台或复杂 CMS。

已确定使用 Vue + Vite + pnpm + Node，静态部署到 GitHub Pages。按现有架构扩展，不因新增内容引入 Astro、Bun、服务端或数据库。用户明确调整目标时，再重新评估。

README 中的环境要求、[package.json](../package.json) 中的脚本与包管理器版本、[工作流](../.github/workflows/deploy.yml) 中的 CI 配置是操作依据。不要把某次运行的测试数量、耗时或本机端口写成长期保证。

## 按任务定位源文件

| 任务 | 优先查看或修改 |
| --- | --- |
| 编辑站点名称、简介和仓库地址 | [content/site.json](../content/site.json) |
| 增改命令、笔记、网址、工具元信息 | [content/](../content/)，示例见 README |
| 首页布局、交互、URL 筛选状态 | [src/App.vue](../src/App.vue) |
| 搜索匹配与排序 | [src/lib/search.ts](../src/lib/search.ts) |
| 公共样式与入口 | [src/style.css](../src/style.css)、[src/base.ts](../src/base.ts)、[src/main.ts](../src/main.ts) |
| 内容类型与字段校验 | [src/content-types.ts](../src/content-types.ts)、[build/content.ts](../build/content.ts) |
| 静态详情、首页备用目录、404、sitemap、robots | [build/site.ts](../build/site.ts) |
| 内容监听与首页数据模块 | [build/plugin.ts](../build/plugin.ts) |
| Vite 多页面配置 | [vite.config.ts](../vite.config.ts)、[uno.config.ts](../uno.config.ts) |
| 工具注册与详情页交互 | [src/tools/registry.json](../src/tools/registry.json)、[src/detail.ts](../src/detail.ts)、[src/tools/](../src/tools/) |
| 内容与产物测试 | [tests/](../tests/)、[scripts/verify-build.mjs](../scripts/verify-build.mjs) |
| 自动构建与部署 | [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) |

开始工作先查看 Git 状态，识别已有改动，再读取任务相关文件。不要把旧示例组件或未引用的资源当作当前入口。

## 数据与页面边界

### 内容契约

解析器是 [build/content.ts](../build/content.ts) 的 `loadContent()`，浏览器收到的类型定义见 [src/content-types.ts](../src/content-types.ts)。内容格式如下：

| 来源 | 输入形状 | 类型与输出 |
| --- | --- | --- |
| `content/commands/**/*.md` | YAML frontmatter + Markdown 正文 | `command`，`/commands/<id>/` |
| `content/notes/**/*.md` | YAML frontmatter + Markdown 正文 | `note`，`/notes/<id>/` |
| `content/bookmarks.json` | 对象数组 | `bookmark`，直接使用 `url`，不生成详情页 |
| `content/tools/**/*.json` | 每文件一个对象 | `tool`，`/tools/<id>/` |

可嵌套组织内容目录，但网址仍由 `id` 推导，不跟随子目录。`docs/` 是仓库开发文档，不进入站点内容集合；需要在站点阅读的备忘放入 `content/notes/`。

公共字段及约束：

| 字段 | 规则 |
| --- | --- |
| `id` | 网址条目必填；Markdown 与工具 JSON 可省略，默认取不含扩展名的文件名 |
| `title`、`description` | 必填非空字符串 |
| `tags`、`aliases` | 字符串数组，默认 `[]`；用于筛选与搜索 |
| `pinned` | 布尔值，默认 `false`；常用项优先展示 |
| `order` | 有限数字，默认 `100`；数值越小越靠前 |
| `draft` | 布尔值，默认 `false`；`true` 时不发布 |
| `url` | 仅网址条目使用，必填完整 HTTP/HTTPS 网址，不包含账号密码 |
| `component` | 仅工具条目使用，必填组件注册标识 |

注意：

- ID 匹配 `^[a-z0-9]+(?:-[a-z0-9]+)*$`，全站唯一，草稿也参与重复检查。
- 修改标题保留 ID；改名或删除前搜索站内引用，当前没有自动重定向机制。
- `aliases` 只是搜索别名，不会额外生成页面或旧地址跳转。
- 发布的命令与笔记正文不能为空。草稿仍校验元信息；工具草稿可暂时没有实际组件，发布时必须补齐。
- 未知字段会报错。不要沿用旧的 `status`、`categoryId`、`path`，也不要在内容文件中手写派生字段 `type`、`href`、`searchText`、`commands`、`sourcePath`。
- `site.json` 的 `title`、`description`、`url`、`repositoryUrl`、`editBaseUrl` 全部必填；`url` 为根站点地址，不能带子路径、查询参数或片段。

### Markdown、链接与命令

- Markdown 必须以 `---` 包围的 YAML 元信息开头。YAML 重复键会报错，正文中的原始 HTML 会转义为文本。
- 命令正文的代码块自动提取到首页展开区；笔记代码块只在详情页提供复制。代码块语言填写实际 Shell，正文说明系统、前置条件及待替换参数。
- 新增命令时核对实际语义，新增网址时使用确认过的目标。示例应标注为示例，不编造用户收藏、服务器环境或操作结果。
- 相对 `.md` 链接会转换成生成路由，例如 `../commands/port-lookup.md`；被引用文件必须存在且已发布。
- 站内页面和公开资源可用根路径，例如 `/notes/maintain-this-site/`、`/favicon.svg`。资源文件放在 `public/`；一般相对资源路径不会按 Markdown 所在目录解析。
- 完整链接使用 HTTP/HTTPS；当前不支持 `mailto:`、`file:`、`javascript:`、协议相对网址或含反斜杠的链接。空格需正确编码。
- 构建检查本地目标，不在线探测第三方网址，也不验证 `#锚点` 是否存在。报告验证结果时保留这一边界。

### 生成流程

1. Vite 配置加载时调用 `loadContent()`，校验并获得 `site`、`entries`、`pages`。
2. `siteDocuments()` 生成 HTML 等文件内容，`writeSite()` 写入 `.generated/` 并清除过期生成文件。
3. Vite 使用 `.generated/` 为根目录，以生成的 HTML 为多个入口，打包到 `dist/`；公开资源来自根目录 `public/`。
4. 首页通过 `virtual:content` 获得内容目录和搜索数据。解析 Markdown 的依赖只在构建阶段使用。
5. `pnpm build` 最后运行产物校验，检查正文、HTML 路由、本地资源链接和 sitemap 一致性。

不要手改或提交 `.generated/`、`dist/`、`.qa/`、`node_modules/`、`.pnpm-store/`。根目录没有手写 `index.html`；页面模板改 `build/site.ts`，样式改源文件。不要在 `public/` 另放 sitemap、robots 或独立 HTML 页面；额外 HTML 会与产物校验的受控路由集合冲突。

`pnpm dev` 对内容增删改和工具注册表使用同一套生成逻辑；失败时显示错误，成功后失效首页虚拟模块并刷新。`pnpm preview` 只预览已有 `dist/`，修改源码或内容后需要重新构建。

## 常见任务步骤

### 新增或修改内容

1. 找到同类型样例，按 README 模板编辑内容；不为普通条目修改构建代码。
2. 检查 ID、标签、别名、常用排序与引用，代码示例使用占位参数，不写真实凭据。
3. 运行 `pnpm check:content`，再用 `pnpm build` 检查实际页面和链接。
4. 检查新增条目的搜索结果与页面；命令确认复制内容，网址确认目标地址。

### 新增 Vue 工具

1. 在 `src/tools/` 直接放置入口组件，例如 `TextCounter.vue`。当前加载模式为 `./tools/*.vue`，不递归发现子目录入口。
2. 注册表填写 `"text-counter": "TextCounter.vue"`。文件名必须匹配 `^[A-Za-z][A-Za-z0-9-]*\.vue$`；注册表只提供标识与文件名映射。
3. 新增工具 JSON，填写 `component: "text-counter"` 和公共字段。工具 JSON 不承担任意功能实现，也不支持 Markdown 正文字段。
4. 可独立验证的处理逻辑放在同目录 `.ts`，Vue 负责输入、输出和反馈；参考 [JSON 核心](../src/tools/json-format.ts) 与 [组件](../src/tools/JsonFormatter.vue)。
5. 工具在详情页的 `#tool-app` 中按需加载。不要在首页直接导入工具组件，不要接管静态标题与正文。
6. 提供正常、无效、空输入和规模边界的反馈；复制失败提示手动复制。若处理会改变数据含义，明确说明或拒绝，避免静默损失。

### 修改生成器、路由或搜索

- 改字段时同步共享类型、加载器、相关模板/搜索、测试及文档。新增内容类型还需检查首页类型标签、筛选计数与输出路由。
- 维持先校验、再生成、再交给 Vite 打包的顺序；开发与生产共享逻辑，删除内容时同时移除目录记录和旧页面。
- 命令和笔记的标题、正文保留在 HTML 中；首页可以增强为 Vue 界面，详情正文不依赖 Vue 渲染。
- 搜索按空白拆词、全角归一化、忽略大小写，并要求所有词匹配；标签筛选为精确匹配，筛选状态使用 `query`、`type`、`tag` URL 参数。
- 公共 CSS 与 UnoCSS 经 `src/base.ts` 引入；修改模板类名时确认样式进入打包，尤其避免无法提取的动态拼接类名。

## 验证与排障

先使用 README 的环境配置；依赖缺失或锁文件变更时执行 `pnpm install --frozen-lockfile`。不要在普通内容或文档任务中顺带升级依赖。

| 改动范围 | 验证要求 |
| --- | --- |
| 仅仓库文档：README、AGENTS、docs | 核对代码事实、文档链接、Markdown 与 `git diff --check`；不必重跑应用测试或构建 |
| `content/` 或内容使用的 `public/` 资源 | `pnpm check:content`、`pnpm build`，查看受影响页面 |
| 工具、搜索、模板、生成器、构建配置 | `pnpm test`、`pnpm build`；必要时补针对行为边界的测试，再做相关浏览器验收 |
| 部署工作流 | 检查 YAML、权限、事件条件和构建依赖；实际推送后查看对应提交的 Actions 结果 |

`pnpm test` 使用 Node 自带测试运行器，当前扫描 `tests/*.test.mjs` 和 `src/tools/*.test.mjs`。测试放入其他位置时，显式接入脚本，避免写了但未执行。纯排版或简单文案调整无需新增测试。

交互或生成机制变化时，按受影响范围验证：

- 首页：关键词/别名/命令搜索，类型与标签组合，无结果状态，后退恢复筛选。
- 命令：展开、复制后内容一致、失败反馈、长代码块可滚动。
- 页面：独立地址直接打开，禁用 JavaScript 仍能读标题正文。
- 工具：真实输入输出、无效输入和按需加载。
- 开发监听：临时内容的新增、修改、草稿切换、删除；测试后移除临时条目。
- 布局：桌面与 320px 宽度，页面无意外横向溢出，必要的代码区域可单独滚动。

常见定位方式：

| 现象 | 优先检查 |
| --- | --- |
| 条目未出现 | 文件目录与扩展名、`draft`、当前筛选、是否在查看旧 `dist/` |
| 内容校验失败 | 报错的源文件和字段；不要修改生成文件绕过校验 |
| 工具加载失败 | 注册标识、Vue 文件名大小写/位置、浏览器控制台 |
| 产物缺正文、资源或多出旧页 | 模板、生成入口、源资源及路由集合；保留产物校验步骤 |
| pnpm store 不匹配或依赖无法读取 | 实际 Node/pnpm 版本、依赖链接、store 位置和运行环境权限；区分环境错误与源码错误 |

## 提交与交付

根据当前任务授权执行提交和推送，只暂存本任务文件，保留其他已有改动。提交前检查暂存范围与 `git diff --cached --check`。

`main` 推送会触发公开站点更新；PR 只检查，手动触发也可部署。工作流先测试和构建，成功上传 `dist/` 后才进入带 Pages 写权限的部署任务。域名与根路径以当前配置为准，不把发布源改为另一个分支目录。

交付时简要说明修改内容、验证结果与未测边界。若执行了推送，提供提交号并核对远程 SHA；构建部署成功与线上页面可访问分开确认，不把“已推送”表述成“已上线”。

修改内容格式、组件注册、命令脚本或生成流程时，同步本指南与 README 的相关段落。`AGENTS.md` 只维护入口，不复制整套规则。
