---
title: 计算文件 SHA-256
description: 对下载文件或本地文件计算散列值，用于和发布方提供的校验值对照。
tags: [Windows, PowerShell, Linux, 文件]
aliases: [hash, sha256, 散列, 哈希, 校验, 摘要]
order: 50
---

将示例路径替换为真实文件路径。这些命令读取文件内容，不修改文件。

## Windows · PowerShell

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\path\to\file.zip'
```

## Linux · Bash

需要 GNU Coreutils 提供的 `sha256sum`。

```bash
sha256sum -- '/path/to/file.zip'
```

将输出的完整散列与发布方通过可信渠道提供的 SHA-256 对照。散列相同用于确认内容一致，前提是参考校验值本身可信。

参考：[Get-FileHash](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash)、[GNU SHA-2 工具](https://www.gnu.org/software/coreutils/manual/html_node/sha2-utilities.html)。
