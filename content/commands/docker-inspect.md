---
title: Docker 容器与空间查询
description: 查看容器、最近日志和磁盘占用，不执行清理操作。
tags: [Docker, Linux, PowerShell]
aliases: [docker ps, docker logs, docker system df, 容器, 日志, 磁盘]
order: 30
---

适用于已连接 Docker 引擎、具有访问权限的 PowerShell 或 Bash 终端。

## 容器列表

包括运行中和已停止的容器。

```bash
docker container ls --all
```

## 最近 100 行日志

将 `container-name` 换成容器名称或 ID。

```bash
docker container logs --tail 100 --timestamps container-name
```

日志内容取决于应用输出与日志驱动；输出前注意当前终端是否适合显示应用日志。

## 磁盘占用

```bash
docker system df
```

查看镜像、容器、本地卷等占用的汇总信息。这里不执行删除或回收。

参考：[容器列表](https://docs.docker.com/reference/cli/docker/container/ls/)、[容器日志](https://docs.docker.com/reference/cli/docker/container/logs/)、[磁盘占用](https://docs.docker.com/reference/cli/docker/system/df/)。
