---
title: 'Cloudflare Pages 部署实战手册：从本地到生产'
summary: '完整讲解 Tsuki 模板在 Cloudflare Pages + Workers 环境的部署流程、构建设置、变量配置与回滚策略。'
publishedAt: '2026-01-01'
category: '部署'
series: 'Cloudflare 上线指南'
tags: ['Cloudflare Pages', 'Workers', 'CI/CD', '部署']
cover: './contents/banners/1.png'
pinned: true
---

这篇文章面向真正要上线博客的人，不是演示文本。你可以按步骤直接操作。

## 一、部署架构与职责划分

Tsuki 默认是一个前后端分离但同平台可托管的结构：

- `apps/web`：Astro 站点，产出页面与静态资源；
- `services/tsuki-api`：Cloudflare Worker API，承载登录、评论等接口；
- `contents/`：统一内容源，包含文章、动态、站点素材。

推荐部署方式：

1. `apps/web` 走 Cloudflare Pages；
2. API 走 Worker（可由 wrangler 部署）；
3. 前端通过 `PUBLIC_TSUKI_API_BASE` 访问 API。

## 二、Pages 项目创建与构建参数

在 Cloudflare Dashboard 新建 Pages 项目，关联 Git 仓库后配置：

- **Build command**：`pnpm -C apps/web build`
- **Build output directory**：`dist`
- **Root directory**：仓库根目录
- **Node 版本**：建议 `20+`

如果你的仓库是 monorepo，这样配置能保证只构建博客前端，而不是误触发整个 workspace 的耗时任务。

## 三、环境变量最小集

在 Pages 的环境变量里至少配置：

- `PUBLIC_TSUKI_API_BASE`：例如 `https://api.your-domain.com/v1`
- （可选）主题/实验功能开关变量

在 Worker 侧再配置敏感变量（通过 `wrangler secret put`）：

- GitHub OAuth Client Secret
- Session/Cookie 签名相关密钥
- CSRF salt

请注意：凡是 `PUBLIC_` 前缀的变量，都会被前端打包到客户端代码中，不能放私密信息。

## 四、首发前检查清单（可直接复制）

- [ ] `pnpm -C apps/web lint` 通过
- [ ] `pnpm -C apps/web typecheck` 通过
- [ ] `pnpm -C apps/web build` 通过
- [ ] 文章封面与头像都能命中 AVIF 产物
- [ ] `robots.txt` 与 `sitemap.xml` 可访问
- [ ] API 跨域、Cookie、CSRF 行为在生产域名下验证通过

## 五、上线后运维建议

1. **版本标记**：每次部署前打 tag（如 `web-v2026.01.01`）；
2. **灰度验证**：先在 preview 分支确认视觉与接口行为；
3. **回滚策略**：Pages 可直接回滚到上个成功部署，Worker 保留上一个稳定版本；
4. **监控**：至少配置 5xx 告警与登录失败告警。

## 六、常见故障排查

### 1. 页面正常，但评论接口 401/403

优先检查：

- API 域名是否与前端配置一致；
- Cookie 的 domain / sameSite / secure 设置；
- CSRF token 是否正确透传。

### 2. 图片没有走优化格式

检查构建日志中是否执行了图片准备脚本，并确认页面输出链接指向 `/.tsuki-avif/*.avif`。

### 3. 预览环境正常，生产异常

大概率是环境变量在生产环境没配齐，或值仍指向旧 API 地址。

---

建议把这篇文章作为你的内部部署 SOP，后续每次迁移环境都按这份清单执行。
