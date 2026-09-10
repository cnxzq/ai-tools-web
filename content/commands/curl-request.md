---
title: curl 查看 HTTP 响应
description: 查看响应头、正文和请求错误，使用不带凭据的 GET / HEAD 示例。
tags: [网络, Linux, PowerShell, Web]
aliases: [curl, http, https, 请求, 响应头, 接口]
order: 40
---

将 `https://example.com` 替换为需要检查的网址。这些示例会向目标地址发起网络请求。

## Linux · Bash

发出 HEAD 请求，只查看响应头；部分服务不支持 HEAD。

```bash
curl --head --connect-timeout 10 --max-time 30 https://example.com
```

发出 GET 请求，显示响应头和正文；HTTP 400 及以上时返回失败状态。`--fail-with-body` 需要 curl 7.76.0 或更新版本。

```bash
curl --include --fail-with-body --connect-timeout 10 --max-time 30 https://example.com
```

## Windows · PowerShell

显式使用 `curl.exe`，避免旧版 Windows PowerShell 中 `curl` 别名指向其他命令。

```powershell
curl.exe --head --connect-timeout 10 --max-time 30 https://example.com
```

```powershell
curl.exe --include --fail-with-body --connect-timeout 10 --max-time 30 https://example.com
```

这些命令不会自动跟随重定向。需要跟随时再添加 `--location`，并确认目标地址。

参考：[curl 官方参数手册](https://curl.se/docs/manpage.html)。
