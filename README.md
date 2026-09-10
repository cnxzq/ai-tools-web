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

普通项目仓库的访问地址为：

```text
https://<GitHub 用户名或组织名>.github.io/<仓库名>/
```

工作流会根据 GitHub 仓库名自动设置 Vite 的 `base` 路径，本地开发仍使用 `/`。
