---
title: 关于 Tsuki
---

## 这是什么？

**Tsuki** 是一个面向 Cloudflare 平台的开源博客模板，基于 Astro + Hono + Cloudflare Workers 构建，目标是"可直接上线"，而不是仅用于演示。

你现在看到的，就是模板的演示站本身。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Astro | SSR，部署在 Cloudflare Pages |
| API | Hono | 运行在 Cloudflare Workers |
| 数据库 | Cloudflare D1 | 基于 SQLite 的边缘数据库 |
| 包管理 | Bun | 快速、统一的工具链 |
| 评论登录 | GitHub OAuth | 无需额外账号体系 |

## 主要功能

- 📝 **文章系统** — Markdown 写作，支持 KaTeX 数学公式、代码高亮
- 💬 **评论系统** — GitHub OAuth 登录，支持嵌套回复
- 🌙 **动态页** — 适合发布简短的想法和图片
- 🎨 **多主题** — 内置多套主题色，用户可自由切换
- 🔍 **全文搜索** — 基于 Pagefind 的静态搜索
- 🖼️ **图片优化** — 自动转换为 AVIF，支持灯箱预览
- 📱 **响应式** — 适配桌面与移动端
- 🔒 **安全** — CSRF 防护、幂等写操作、服务端 Session

## 快速开始

想用这个模板搭建自己的博客？

点击 [README](https://github.com/5uki/Tsuki) 中的 **Deploy to Cloudflare** 按钮，或者阅读[部署教程](/posts/getting-started-with-tsuki)了解完整流程。

---

*Tsuki 是开放的。如果你有改进意见，欢迎提 Issue 或 PR。*
