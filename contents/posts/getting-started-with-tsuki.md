---
title: '从零开始：5 分钟部署你的 Tsuki 博客'
summary: '一篇面向新用户的完整部署教程，从 Fork 仓库到站点上线，手把手带你走完全流程。'
publishedAt: '2026-01-01'
category: '教程'
series: 'Tsuki 上手指南'
tags: ['Cloudflare', '部署', '入门']
cover: './contents/banners/1.png'
pinned: true
---

如果你正在寻找一个开箱即用、真正面向生产环境的博客方案，Tsuki 就是为你准备的。这篇文章将从零开始，带你完成从 Fork 仓库到站点上线的全过程。

## 一、你会得到什么

部署完成后，你将拥有：

- 一个基于 **Astro** 构建的静态博客前端（托管在 Cloudflare Pages）
- 一个基于 **Hono** 的 API 服务（运行在 Cloudflare Workers）
- 一个 **D1** 数据库，存储评论、用户、配置等动态数据
- 内置的 **GitHub OAuth** 登录与评论系统
- 一个轻量级的后台管理面板

整套架构完全运行在 Cloudflare 的免费套餐范围内。

## 二、获取项目代码

### 方式一：一键部署（推荐新手）

全程在浏览器内完成，**不需要任何本地环境**。

点击仓库 README 中的 **Deploy to Cloudflare** 按钮，Cloudflare 会自动 Fork 仓库到你的 GitHub 账户并启动部署流程。你只需要在控制台中授权 Cloudflare 访问你的 GitHub 仓库即可。

### 方式二：手动 Fork + 本地部署

本地部署需要先准备好以下环境：

| 依赖 | 最低版本 | 检查命令 |
|------|---------|----------|
| Node.js | 20.0.0 | `node -v` |
| Bun | 1.0.0 | `bun -v` |
| Git | 任意 | `git -v` |

如果你还没有安装 Bun，可以通过以下命令一键安装：

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

准备好后，执行：

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/你的用户名/Tsuki.git
cd Tsuki

# 2. 安装依赖
bun install

# 3. 一键部署
bun run setup
```

`bun run setup` 会自动完成以下步骤：

1. 🔑 登录 Cloudflare（如果尚未登录）
2. 🗄️ 创建 D1 数据库并执行迁移
3. 📝 自动更新 `wrangler.toml` 中的数据库 ID
4. 🚀 部署 Worker API
5. 🏗️ 构建并部署前端到 Pages
6. 📋 输出 `/setup` 页面地址

## 三、首次初始化

部署完成后，终端会输出一个形如 `https://tsuki.xxx.workers.dev/setup` 的 URL。

打开这个页面，你需要配置以下信息：

### 1. GitHub OAuth App

前往 [GitHub Developer Settings](https://github.com/settings/developers) 创建一个新的 OAuth App：

- **Application name**：随意填写，比如 `My Tsuki Blog`
- **Homepage URL**：你的博客域名（暂时可以填 Worker URL）
- **Authorization callback URL**：`https://你的Worker域名/v1/auth/github/callback`

创建完成后，将 Client ID 和 Client Secret 填入 Setup 页面。

### 2. 管理员配置

在 Setup 页面中输入你的 GitHub ID（数字 ID），系统会将你标记为管理员。

> 💡 获取你的 GitHub ID：访问 `https://api.github.com/users/你的用户名`，`id` 字段就是你的数字 ID。

## 四、本地开发

日常写作和开发时，使用以下命令启动本地环境：

```bash
# 启动所有服务的开发模式
bun dev

# 只构建一次
bun run build

# 代码检查
bun run lint
bun run typecheck
```

## 五、项目结构速览

```
Tsuki/
├── apps/
│   ├── web/          # Astro 前端（博客主站）
│   └── admin/        # React 后台管理面板
├── services/
│   └── tsuki-api/    # Hono API（Cloudflare Workers）
├── packages/
│   ├── shared/       # 共享类型与工具函数
│   ├── config/       # 站点配置解析
│   └── i18n/         # 国际化
├── contents/         # 内容目录
│   ├── posts/        # 文章（Markdown）
│   ├── moments/      # 动态
│   ├── banners/      # 横幅图片
│   ├── about.md      # 关于页
│   └── avatar.webp   # 头像
├── migrations/       # D1 数据库迁移
└── tsuki.config.json # 站点全局配置
```

## 六、下一步

- 📖 阅读[《自定义你的 Tsuki 博客》](/posts/customizing-your-tsuki-blog)了解配置与主题定制
- 🔧 阅读[《Tsuki 架构深度解析》](/posts/tsuki-architecture-deep-dive)了解技术实现细节
- ✍️ 阅读[《Markdown 写作指南》](/posts/markdown-writing-guide)掌握 Tsuki 支持的所有 Markdown 扩展语法

部署遇到问题？在 [GitHub Issues](https://github.com/5uki/Tsuki/issues) 中告诉我们。
