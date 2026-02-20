---
title: "三栏布局与侧边栏联动设计"
summary: "深入了解 Firefly 的布局系统，包括侧边栏布局、文章列表布局，以及移动端适配策略。"
publishedAt: "2026-02-03"
category: "博客指南"
series: "Firefly 建站教程"
tags: ["Firefly", "布局", "博客", "使用指南"]
cover: "../banners/3.png"
---

## 三列布局的核心

文章详情页的结构是三列：左侧为全局侧边栏，中间为文章卡片，右侧为目录卡片。这样能同时兼顾内容与导航。

## 切换动画

页面切换保持在卡片内部完成，避免白屏闪烁。

## 代码片段

```css
.tsuki-card-transition {
  transition: transform 130ms ease-out;
}
```
