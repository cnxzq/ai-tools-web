---
title: 查看端口占用
description: 查询 TCP 监听端口和对应进程，分别提供 PowerShell 与 Linux 命令。
tags: [Windows, PowerShell, Linux, 网络]
aliases: [端口, 占用, port, listen, ss, 进程]
pinned: true
order: 10
---

## Windows · PowerShell

将 `8080` 改为需要查询的 TCP 端口。结果中的 `OwningProcess` 是进程 ID；没有匹配项时可能显示查询错误。

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen |
  Select-Object LocalAddress, LocalPort, State, OwningProcess
```

再将 `1234` 改为上一步的进程 ID，查看进程名称。

```powershell
Get-Process -Id 1234
```

## Linux · Bash

需要系统提供 `ss`（通常来自 iproute2）。将 `8080` 改为目标 TCP 端口。

```bash
ss -lntp 'sport = :8080'
```

`-l` 只看监听，`-n` 显示数字地址，`-t` 查询 TCP，`-p` 显示进程。普通用户可能看不到其他用户进程的完整信息。

这些命令只查询，不会停止进程；UDP 端口需要另外查询。

参考：[Get-NetTCPConnection](https://learn.microsoft.com/en-us/powershell/module/nettcpip/get-nettcpconnection)、[ss 手册](https://man7.org/linux/man-pages/man8/ss.8.html)。
