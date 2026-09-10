# ZQZYZ 在线工具箱

用于收录文件处理、AI API 测试、开发调试和数据处理等 Web 静态应用。

## 本地开发

```powershell
pnpm install
pnpm dev
```

## GitHub Pages

推送到 `main` 分支后，GitHub Actions 会自动构建 `dist` 并发布到 GitHub Pages。

首次发布前，需要在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中将 **Source** 设置为 **GitHub Actions**。

线上访问地址：

```text
https://tool.zqzyz.com/
```

GitHub Pages 仓库设置绑定了该自定义域名，项目使用根路径 `/` 构建静态资源。

## 添加工具

工具必须拥有可访问的独立页面后，才能登记到 `src/data/catalog.ts`。首页只为 `status: 'available'` 的工具显示已上线状态，避免产生失效链接。

新增或调整公开页面时，同时更新 `public/sitemap.xml`。站点级 SEO 元数据和结构化数据位于 `index.html`。
