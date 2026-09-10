---
title: 复制命令前，先看 Shell 和占位参数
description: 区分 PowerShell 与 Bash，替换路径、端口和容器名后再执行。
tags: [PowerShell, Linux, 备忘]
aliases: [终端, shell, bash, 参数, 引号, 复制]
order: 10
---

## 先确定终端类型

Windows Terminal 是终端应用，其中可以运行 PowerShell、命令提示符或 WSL。命令是否可用取决于当前 Shell 和已安装的程序。

本站命令标明使用环境。Git、Docker 这类独立程序的简单命令通常可以共用；变量、管道、引号和换行方式需要按 Shell 区分。

## 再替换占位值

- `8080`：换成要查询的端口。
- `1234`：换成查询结果中的进程 ID。
- `path/to/file`：换成真实文件路径。
- `container-name`：换成 Docker 容器名或 ID。
- `https://example.com`：换成需要请求的网址。

复制按钮复制的是原始示例，不会自动识别或填入本机参数。

参考：[PowerShell 文档](https://learn.microsoft.com/zh-cn/powershell/)、[Bash 手册](https://www.gnu.org/software/bash/manual/bash.html)。
