---
title: '样式与布局教程：如何调整三栏宽度'
summary: '讲解如何在不同屏幕下调整布局比例。'
publishedAt: '2026-01-01'
category: '使用教程'
series: '模板进阶'
tags: ['布局', '响应式', 'CSS Grid']
cover: './contents/banners/3.png'
---

主布局在 `apps/web/src/components/layout/MainLayout.astro` 中定义。

你可以通过媒体查询实现：

- 小屏：内容优先，侧栏下沉；
- 中屏：三栏铺满；
- 大屏：保留两侧留白。
