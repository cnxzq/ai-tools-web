---
title: Git 状态与撤销暂存
description: 查看工作区、暂存区差异，并撤销单个文件的暂存。
tags: [Git, PowerShell, Linux]
aliases: [git status, git diff, unstage, 撤销, 暂存区, 工作区]
pinned: true
order: 20
---

## 查看状态

适用于已安装 Git 的 PowerShell 或 Bash；先进入目标仓库目录。

```bash
git status --short --branch
```

查看尚未暂存的改动：

```bash
git diff
```

查看已经暂存、准备提交的改动：

```bash
git diff --staged
```

## 撤销单个文件的暂存

先确认仓库已有提交。将 `path/to/file` 换成仓库内文件路径；带空格的路径保留引号。

```bash
git restore --staged -- "path/to/file"
```

这条命令修改暂存区，并保留工作区文件的内容。不要省略 `--staged`，省略后的 `git restore` 会改变工作区文件。

参考：[git status](https://git-scm.com/docs/git-status)、[git restore](https://git-scm.com/docs/git-restore)。
