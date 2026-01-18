# Orin 任务清单 / 里程碑（前端优先）

> 原则：先把“用户看得到、用得顺”的东西做出来，再补齐后台与运维硬化。每个里程碑都必须可演示、可验收。

## M0：工程与骨架（半天~1天）

- 初始化单仓库目录（按 `REQUIREMENTS.md` 的 12.9：分区 + 六层）
- 前端：`/apps/web`（Astro + TypeScript + SSR on Pages；后台用 React Islands）
- 后端：`/services/orin-api`（Workers + D1 绑定占位）
- 约束门禁：`lint`、`typecheck`、`test` 脚手架（先空测试也行，但 pipeline 必须跑通）

## M1：前台 UI 基线（1~2天）

- 全站 Layout：导航/页脚/主题切换入口（读 `GET /settings/public`，无则用默认值）
- 主题系统：实现 ≥ 6 套主题 token，`localStorage` 持久化（`orin.theme`）
- 路由骨架全部可访问：
  - `/`、`/posts`、`/posts/:slug`、`/moments`、`/moments/:id`、`/tags`、`/groups`、`/search`
- 文章/动态详情必须 SSR（无 JS 可阅读正文）

验收：
- 关闭浏览器 JS，文章页/动态页正文仍可读
- 主题切换无刷新生效，且刷新后保留

## M2：动态时间线（含图片展示）（1~2天）

- 前台接入：
  - `GET /moments`（分页加载更多、骨架屏、失败重试）
  - `GET /moments/:id`（SSR 正文 + CSR 评论区占位）
- 动态图片展示（v1 固定）：
  - 仅通过 `MomentDTO.media` 展示图片
  - 时间线卡片展示首图缩略图；详情页网格展示全部图片
  - 图片点击放大预览（可键盘关闭）

验收：
- 动态支持 0..4 张图展示，且不会把 Markdown 图片语法放开

## M3：文章浏览（标签/分组/搜索）（2~4天）

- 接入公开读接口：
  - `GET /posts`、`GET /posts/:slug`
  - `GET /tags`、`GET /tags/:slug`
  - `GET /groups`、`GET /groups/:slug`
- `/posts` 支持分页与筛选（tag/group）
- `/search`：文章搜索（按 `REQUIREMENTS.md` 11.5）

验收：
- unlisted 不出现在列表/聚合页；published_at 未到不对外可见（404）

## M4：登录与评论（前台）（2~4天）

- 登录：
  - `/login` → `GET /auth/github/start`
  - 登录回跳必须回到原页面 `#comments`
  - 顶栏显示头像/退出
- 评论区：
  - `GET /comments` 展示（deleted 占位、hidden 不展示）
  - `POST /comments` 发表（含 CSRF、限速提示、错误码友好展示）
  - `PATCH/DELETE /comments/:id`（按 FR-COMMENT-005）

验收：
- 未登录可看评论但不能发；登录后能发/编辑（15 分钟窗）/软删除

## M5：SEO & 订阅（1~2天）

- 输出：`/rss.xml`、`/sitemap.xml`、`/robots.txt`
- 详情页：OG + JSON-LD（BlogPosting）
- `/search`：必须 `noindex`

验收：
- RSS/Sitemap 内容筛选符合 published/published_at 规则

## M6：后台（优先“能用”）（3~6天）

- 后台鉴权与 403 页面
- 文章管理（草稿/发布/计划发布/unlisted）
- 动态管理（创建/编辑/软删除），动态图片通过 URL 引用（`/media/` 或 `https://`）
- 评论治理（筛选、隐藏/恢复）
- 站点配置（标题、描述、默认主题、导航、页脚）

验收：
- 管理员能从后台完成：发文章、发动态（含图）、治理评论、改站点配置

## M7：硬化与性能（持续）

- ETag/304、公共读接口缓存策略
- 幂等键（写接口）
- 安全：URL 校验、HTML 净化、Origin/CSRF 全覆盖
- 可观测性：结构化日志 + request_id
