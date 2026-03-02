---
title: 'Tsuki 架构深度解析：从请求到渲染的完整链路'
summary: '深入剖析 Tsuki 的 Monorepo 架构、API 中间件栈、D1 数据模型和 Astro 渲染管线，帮助你理解每个组件的职责与协作方式。'
publishedAt: '2026-01-01'
category: '技术'
series: 'Tsuki 上手指南'
tags: ['架构', 'Cloudflare Workers', 'Hono', 'Astro', 'D1']
cover: './contents/banners/2.png'
pinned: false
---

这篇文章面向有一定全栈开发经验、希望深入理解或二次开发 Tsuki 的读者。我们将从架构全貌讲到具体的请求处理流程。

## 一、整体架构

Tsuki 采用 **Monorepo** 结构，通过 Bun workspace 管理多个包：

```
┌─────────────────────────────────────────────────────┐
│                    Monorepo Root                     │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  apps/web   │  │ apps/admin  │  │  services/   │ │
│  │   (Astro)   │  │  (React)    │  │  tsuki-api   │ │
│  │             │  │             │  │   (Hono)     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │         │
│         └────────────────┼────────────────┘         │
│                          │                          │
│              ┌───────────┴───────────┐              │
│              │      packages/        │              │
│              │  shared │ config │ i18n│              │
│              └───────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

### 各模块职责

| 模块 | 技术栈 | 职责 |
|------|--------|------|
| `apps/web` | Astro + React | 博客前端，SSR 渲染 |
| `apps/admin` | React + Vite | 后台管理面板 |
| `services/tsuki-api` | Hono | REST API 服务 |
| `packages/shared` | TypeScript | 共享类型与工具函数 |

## 二、API 服务架构（Hono on Workers）

### 中间件栈

API 服务的核心是一个 Hono 应用，通过精心设计的中间件栈处理每个请求：

```
请求进入
  │
  ▼
┌─────────────────────────┐
│ 1. 结构化日志 (全局)      │  记录请求方法、路径、耗时
├─────────────────────────┤
│ 2. Setup 页面路由         │  GET /setup → 独立处理
├─────────────────────────┤
│ 3. Config 解析 /v1/*     │  从 D1 + env 合并配置
├─────────────────────────┤
│ 4. CORS /v1/*            │  基于 resolved config
├─────────────────────────┤
│ 5. Setup Guard /v1/*     │  未初始化 → 只放行 /v1/setup/*
├─────────────────────────┤
│ 6. 上下文装配 /v1/*       │  创建所有 adapter 实例
├─────────────────────────┤
│ 7. Session 解析 /v1/*    │  解析 Cookie，不强制登录
├─────────────────────────┤
│ 8. 业务路由 /v1          │  挂载具体的 API 路由
└─────────────────────────┘
```

### 设计理念：端口-适配器模式

API 层采用 **Ports & Adapters（六边形架构）** 模式：

- **Ports（端口）**：定义抽象接口
- **Adapters（适配器）**：实现具体逻辑
- **Use Cases（用例）**：纯业务逻辑

## 三、数据模型（D1）

Tsuki 使用 Cloudflare D1（基于 SQLite）作为持久化存储。

### 核心表说明

| 表名 | 说明 |
|------|------|
| `users` | 用户信息，来自 GitHub OAuth |
| `sessions` | 服务端会话 |
| `settings` | 站点级 key-value 配置 |
| `posts` | 文章，存储 Markdown 原文和渲染后的 HTML |
| `comments` | 评论，支持三级嵌套回复 |

## 四、前端渲染管线（Astro）

### 构建流程

```
Markdown 文章 (contents/posts/*.md)
       │
       ▼
┌──────────────────────────────────────┐
│         Astro 构建管线                │
│                                      │
│  1. remark-math     → 解析数学公式    │
│  2. remarkOptimize  → 图片路径优化    │
│  3. rehype-katex    → 渲染 KaTeX      │
│  4. Expressive Code → 代码块渲染      │
│  5. Astro SSR       → 页面生成        │
└──────────────────────────────────────┘
```

---

理解了 Tsuki 的架构，你就可以自信地进行深度定制。清晰的分层都会让这一切变得简单。
