---
title: 'Cloudflare Worker API 配置详解：认证、CORS 与安全边界'
summary: '从接口暴露、鉴权流程、跨域策略到密钥管理，系统梳理 Tsuki API 的生产级配置要点。'
publishedAt: '2026-01-01'
category: '后端'
series: 'Cloudflare 上线指南'
tags: ['Cloudflare Workers', 'Auth', 'CORS', '安全']
cover: './contents/banners/2.png'
---

这篇教程专门解决“前端能打开、接口却不稳定”的问题。

## 一、先明确 API 的生产目标

一个可上线的博客 API 最低要满足：

- 登录态可持续（含刷新页面与多标签页）；
- 评论写入具备防重放与最小防刷；
- 错误有可观测性（日志可追踪）。

## 二、环境分层建议

至少分三套：

- `dev`：本地调试；
- `preview`：PR 验证；
- `production`：正式流量。

不同环境要使用不同 OAuth 回调地址与 Secret，不要共用一套凭据。

## 三、CORS 与 Cookie 的实践规则

如果你的前端域名和 API 域名不同：

1. API 必须返回明确的 `Access-Control-Allow-Origin`（不能和凭据模式冲突）；
2. 需要凭据时，前端请求要带 `credentials: 'include'`；
3. Cookie 必须 `Secure`，并按需要设置 `SameSite=None`。

在 Cloudflare 上，很多“偶发登录失效”其实是 CORS + Cookie 组合不完整导致的。

## 四、认证与会话建议

- 登录后仅存必要会话字段（用户 id、角色、过期时间）；
- 会话存储层建议可替换（如 D1 / KV）；
- 对关键写接口统一走 CSRF 校验。

这样做的好处是：未来你把评论或管理后台拆分成独立服务时，认证边界仍然清晰。

## 五、幂等与写操作可靠性

对于评论创建这类写操作，建议支持 `Idempotency-Key`：

- 用户/客户端重试时不会重复写入；
- 网关抖动后重放请求也能返回一致结果；
- 便于后续接入队列化写入。

## 六、上线前安全检查

- [ ] 所有 Secret 都通过 `wrangler secret` 注入
- [ ] 未把私钥写进仓库或前端 `PUBLIC_` 变量
- [ ] 管理员路由具备角色校验
- [ ] 评论相关接口限制单次 body 长度
- [ ] 错误响应不泄漏内部栈信息

## 七、推荐的调试顺序

1. 本地先用最简请求验证 `/auth/me`；
2. 再测评论列表读接口；
3. 最后测评论写入（含 CSRF 与幂等键）。

每步都通过后再发布，能显著降低“上线后一起炸”的风险。
