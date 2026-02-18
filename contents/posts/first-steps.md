---
title: "站点内容系统接入实战"
summary: "如何使用 Firefly 博客模板，快速完成主题配置、内容发布与基础样式调整。"
publishedAt: "2026-02-01"
category: "博客指南"
series: "Firefly 建站教程"
tags: ["Firefly", "博客", "Markdown", "使用指南"]
words: 667
pinned: true
cover: "/background.png"
---

## 快速开始

先从最基本的目录结构开始：文章放到 `contents/posts`，动态放到 `contents/moments`。下面是一个最简单的代码片段：

```ts
export function hello(name: string) {
  return `你好，${name}`
}
```

## 插图与引用

你可以直接在文章里引用图片：

![站点横幅](/background.png)

> 轻量但有章法，才是可维护的体验。

## 数学公式

行内公式示例：$a^2 + b^2 = c^2$。

块级公式示例：

$$
E = mc^2
$$
