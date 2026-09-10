# AI-TOOLS-WEB

基于 Vue 和 Vite 的前端项目。

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
