---
title: '从 0 到 1：如何使用 Tsuki 模板'
summary: '5 分钟完成本地启动、基础配置与首次发布。'
publishedAt: '2026-01-01'
category: '使用教程'
series: '模板入门'
tags: ['教程', '部署', '入门']
cover: './contents/banners/1.png'
pinned: true
---

这篇文章会带你快速上手模板：

## 1. 安装依赖

```bash
pnpm install
```

## 2. 启动开发环境

```bash
pnpm dev
```

## 3. 修改站点配置

编辑 `tsuki.config.ts`，完成站点名、简介、导航等信息的替换。

## 4. 写第一篇文章

在 `contents/posts` 下新增一个 markdown 文件即可自动被收录。

## 5. 构建与部署

```bash
pnpm build
```

将 `dist` 部署到你的静态托管平台。
