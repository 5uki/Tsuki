---
title: '发布教程：从本地构建到线上更新'
summary: '一套可复用的发布流程，适合模板二次开发。'
publishedAt: '2026-01-01'
category: '使用教程'
series: '模板进阶'
tags: ['发布', 'CI', '最佳实践']
cover: './contents/banners/1.png'
---

推荐发布流程：

1. 本地执行 `pnpm lint` / `pnpm typecheck` / `pnpm build`。
2. 推送到仓库并通过 CI 校验。
3. 平台自动部署 `dist`。

如需接入自定义域名，请在部署平台配置 SSL 与 DNS 记录。
