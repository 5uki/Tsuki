# Orin：基于 Cloudflare + GitHub 的全栈博客框架（需求与设计文档）

> 本文档是 Orin 的“需求与设计”唯一事实来源（Single Source of Truth）。  
> 文中出现“必须 / 禁止 / 不得 / 仅 / 只能 / 一律”等措辞均为强约束；除非修订本文档，否则实现不得偏离。

## 目录

- 1. 概述
- 2. 约束与术语
- 3. 角色与权限
- 4. 用户侧信息架构（前端路由）
- 5. 功能需求（FR）
- 6. 非功能需求（NFR）
- 7. 系统架构（高层）
- 8. API 设计（v1）
- 9. 前端设计（主题与交互）
- 10. 后端设计（分层与安全）
- 11. 数据设计（D1）
- 12. 部署与运维
- 附录：错误码

---

## 1. 概述

### 1.1 项目定位

Orin 是一个面向个人/小团队的全栈博客框架，基于 Cloudflare Free 计划可用能力（Pages、Workers、D1、基础安全能力）和 GitHub（代码托管 + OAuth 登录），提供：

- 长文内容：文章（Post）
- 短内容：动态（Moment，类似 Twitter/X 时间线）
- 社交互动：评论（Comment，必须 GitHub 登录；不使用 GitHub Discussions）
- 结构化组织：标签（Tag）与分组（Group）
- 站点外观：多套内置主题（现代；朴素中带华丽，华丽中带朴素）
- 后台能力：发布/编辑文章、发布动态、评论管理、站点配置

### 1.2 目标（必须）

- G1：可在 Cloudflare Free 计划下完成“端到端部署”（首次部署不依赖人工在服务器上操作）。
- G2：前后端齐备：用户可访问前台完整浏览；管理员可在后台完成文章发布、动态发布、评论管理。
- G3：评论必须 GitHub 登录；评论数据落地在 D1；严禁使用 GitHub Discussions/Issues 作为评论存储。
- G4：前台具备标签、分组、动态、评论；文章与动态正文支持图片展示。
- G5：提供 ≥ 6 套预设主题；用户可切换并持久化偏好。

### 1.3 非目标（明确不做，除非未来版本另行纳入）

- NG1：多租户（一个部署承载多个独立站点/域名/作者体系）。
- NG2：对外开放注册成为“作者”；Orin 的作者（管理员）由部署者在配置中显式指定。
- NG3：邮件订阅、推送通知、短信、站内信等外部通知通道。
- NG4：富文本所见即所得编辑器（WYSIWYG）；后台编辑器以 Markdown 为主。

---

## 2. 约束与术语

### 2.1 平台约束（必须）

- C1：部署平台仅依赖 Cloudflare（Pages、Workers、D1、基础安全能力）与 GitHub。
- C2：不依赖付费能力作为“必须项”；任何付费能力只能作为“可选增强”，且必须有免费替代路径或功能降级策略。
- C3：后端仅允许在 `adapters/` 出现 I/O（HTTP/DB/FS/第三方 SDK）。分层约束见 10.1。

### 2.2 术语表（定义即约束）

| 术语 | 英文/标识 | 定义 |
|---|---|---|
| 站点 | Site | 一个 Orin 部署实例，对应一个域名与一套数据。单部署仅允许一个站点。 |
| 文章 | Post | 长文内容，支持 Markdown、标签、分组、封面、摘要。 |
| 动态 | Moment | 短内容时间线条目，类似 Twitter/X；支持 Markdown（受限子集）与图片。 |
| 标签 | Tag | 文章/动态的轻量主题标记，多对多关系。 |
| 分组 | Group | 用于组织文章的结构化集合，分为两类：`category`（分类）与 `series`（系列）。 |
| 评论 | Comment | 对 Post 或 Moment 的回复；必须登录后发表；支持楼中楼（有限层级）。 |
| 管理员 | Admin | 具备后台权限的用户；由配置显式指定 GitHub 用户 ID 白名单。 |
| 访客 | Visitor | 未登录的访问者；仅可浏览公开内容。 |

### 2.3 全局数据与协议约定（必须）

#### 2.3.1 时间与时区

- T1：所有对外 API 时间字段一律返回：
  - `ts`：Unix 毫秒时间戳（`number`）
  - `iso`：ISO 8601 UTC 字符串（`string`，示例：`2026-01-18T12:34:56.789Z`）
- T2：数据库一律存储 Unix 毫秒（`INTEGER`）。
- T3：前端展示时区默认使用访问者本地时区；后台编辑/计划发布界面必须显示“站点时区 = UTC”。

#### 2.3.2 ID 与 Slug

- ID1：所有资源主键 `id` 使用 `UUIDv4`（`TEXT`），由运行时 `crypto.randomUUID()` 生成。
- SLUG1：`slug` 规则（用于 URL 与唯一标识）：
  - 仅允许：`a-z`、`0-9`、`-`
  - 不允许连续 `--`
  - 不允许以 `-` 开头/结尾
  - 长度：`1..64`
  - 全站同一资源类型内必须唯一（例如：`post.slug` 全局唯一）

#### 2.3.3 Markdown 子集（安全约束）

- MD1：文章 `Post` 支持 CommonMark 基础语法 + 表格 + 代码块高亮；禁止原始 HTML（`html: false`）。
- MD2：评论 `Comment` 与动态 `Moment` 默认禁用图片语法（`![]()`）以降低垃圾与外链风险；若开启图片，则仅允许 `https://` 或 `/media/` 且必须经过 URL 白名单/黑名单校验（见 10.4）。
- MD3：所有链接 URL 仅允许：`http:`、`https:`、`mailto:`；严禁 `javascript:`、`data:`。
- MD4：渲染后的 HTML 必须进行二次净化（allowlist），以防 Markdown 渲染器绕过。

---

## 3. 角色与权限

### 3.1 角色定义

- `visitor`：未登录
- `user`：已通过 GitHub OAuth 登录
- `admin`：已登录 + GitHub 用户 ID 在 `ORIN_ADMIN_GITHUB_IDS` 白名单内

### 3.2 权限矩阵（必须）

| 功能 | visitor | user | admin |
|---|---:|---:|---:|
| 浏览公开文章/标签/分组/动态 | ✅ | ✅ | ✅ |
| 搜索公开内容 | ✅ | ✅ | ✅ |
| 发表评论/回复 | ❌ | ✅ | ✅ |
| 编辑/删除自己的评论 | ❌ | ✅（受限） | ✅ |
| 发布/编辑/下线文章 | ❌ | ❌ | ✅ |
| 发布/编辑/删除动态 | ❌ | ❌ | ✅ |
| 评论审核（隐藏/恢复/封禁） | ❌ | ❌ | ✅ |
| 站点配置（主题默认值、导航、友链等） | ❌ | ❌ | ✅ |

> “编辑/删除自己的评论（受限）”定义：仅允许在评论发表后 `15` 分钟内编辑；删除为“软删除”，前台展示“该评论已删除”占位。

---

## 4. 用户侧信息架构（前端路由）

> 下面路由是 Orin v1 的固定信息架构；除非修订本文档，否则不得随意更改（避免 SEO 与外链断裂）。

- `/`：首页（文章列表 + 最新动态摘要 + 置顶内容）
- `/posts`：文章列表（支持筛选/分页）
- `/posts/:slug`：文章详情页
- `/tags`：标签总览
- `/tags/:slug`：标签详情（该标签下文章与动态）
- `/groups`：分组总览（分类与系列分开展示）
- `/groups/:slug`：分组详情（该分组下文章列表，系列需展示目录顺序）
- `/moments`：动态时间线
- `/moments/:id`：动态详情（含评论）
- `/search`：搜索页
- `/rss.xml`：RSS（文章 + 动态，见 FR-SEO-003）
- `/sitemap.xml`：站点地图（见 FR-SEO-004）
- `/robots.txt`：爬虫规则（默认允许；见 FR-SEO-005）
- `/login`：登录入口（引导 GitHub OAuth）
- `/logout`：退出登录
- `/admin`：后台首页（仅 admin）
- `/admin/posts`：文章管理
- `/admin/posts/new`：新建文章
- `/admin/posts/:id`：编辑文章
- `/admin/moments`：动态管理
- `/admin/comments`：评论管理
- `/admin/settings`：站点配置

---

## 5. 功能需求（FR）

> 每条需求以 `FR-模块-序号` 标识。实现必须满足验收标准；验收标准中的“必须”与“禁止”同样具有约束力。

### 5.1 文章（Post）

#### FR-POST-001 文章基本信息

- 系统必须支持创建文章，文章包含字段：
  - `title`（必填，长度 `1..120`）
  - `slug`（必填，满足 SLUG1）
  - `summary`（可选，长度 `0..280`；为空时由系统自动生成：取正文前 140 字并去除 Markdown 标记）
  - `content_markdown`（必填，长度 `1..200000`）
  - `cover`（可选，图片 URL 或媒体 ID，见 5.6）
  - `tags`（可选，0..20）
  - `groups`（可选，分类 0..1；系列 0..5）
  - `status`（必填，枚举：`draft`、`published`、`unlisted`）
  - `published_at`（`status=published` 时必填；`status=draft` 时必须为空）
- 验收标准：
  - Given 管理员在后台保存文章草稿
  - When `status=draft`
  - Then 文章不可被 `visitor/user` 通过列表接口获取；仅 admin 可通过后台接口读取

#### FR-POST-002 文章展示

- 文章详情页 `/posts/:slug` 的可见性规则（对 `visitor/user`）：
  - 允许访问：`status=published` 且 `published_at <= now`
  - 允许访问：`status=unlisted` 且 `published_at <= now`
  - 其余情况必须返回 404（不得泄露“存在但未发布”）
- 前台文章详情页必须展示：
  - 标题、发布时间、更新时间（若有）、阅读时长（按 `400 字/分钟` 估算并向上取整）
  - 标签列表（可点击）
  - 分组入口（分类与系列）
  - 正文（Markdown 渲染后的安全 HTML）
  - 目录（TOC）：当正文包含 ≥ 2 个 `h2` 时必须显示；否则不显示
- 验收标准：
  - Given 任意公开文章包含至少两个二级标题
  - When 访客访问文章页
  - Then 页面必须出现 TOC，且 TOC 点击可滚动定位到对应标题

#### FR-POST-003 文章列表与筛选

- `/posts` 页面必须支持：
  - 按发布时间倒序
  - 按标签筛选（单标签）
  - 按分组筛选（分类或系列）
  - 分页：每页固定 `20` 条，URL 使用 query 参数 `?page=1`（从 1 开始）
- 列表与聚合页（首页、文章列表、标签页、分组页、RSS、Sitemap）必须仅展示满足以下条件的文章：
  - `status=published`
  - `published_at <= now`
- 验收标准：
  - Given 站点存在 ≥ 40 篇公开文章
  - When 访客访问 `/posts?page=2`
  - Then 页面展示第 21..40 篇文章，且每篇文章链接可正确打开

#### FR-POST-004 Slug 变更规则（必须）

- 当文章满足以下任一条件后，`slug` 必须不可变：
  - `status` 曾经变为 `published` 或 `unlisted`
- 对于不可变文章，任何尝试修改 `slug` 的后台请求必须返回 `VALIDATION_FAILED`。
- 理由（设计约束）：评论 `target_id` 依赖 `post.slug`（见 FR-COMMENT-002 / D1-COMMENT-001）。

#### FR-POST-005 Unlisted 语义（必须）

- `status=unlisted` 的文章必须满足：
  - 当 `published_at <= now`：可通过 `/posts/:slug` 访问
  - 不得出现在：首页、文章列表、标签页、分组页、RSS、Sitemap
  - 页面必须输出：`<meta name="robots" content="noindex, nofollow">`

### 5.2 标签（Tag）

#### FR-TAG-001 标签定义与规范化

- 标签 `tag.slug` 必须满足 SLUG1。
- 标签展示名 `tag.name`：
  - 必填，长度 `1..32`
  - 允许中文与空格
- 系统必须在创建/更新时进行规范化：
  - `slug` 全小写
  - `name` 去除首尾空白

#### FR-TAG-002 标签页

- `/tags/:slug` 必须展示：
  - 标签名与描述（若有）
  - 该标签下的文章列表
  - 该标签下的动态列表（若动态支持标签）

### 5.3 分组（Group：category / series）

#### FR-GROUP-001 分组类型

- 分组分为两类：
  - `category`：分类，每篇文章最多属于 `1` 个分类
  - `series`：系列，每篇文章最多属于 `5` 个系列
- 分组 `group.slug` 必须满足 SLUG1。
- 分组 `group.name` 必填，长度 `1..32`。

#### FR-GROUP-002 系列目录顺序

- 当分组类型为 `series` 时，必须支持文章在系列内的顺序 `position`（整数，范围 `1..100000`）。
- 前台系列页必须按 `position` 升序展示目录；若缺失 `position`，则按 `published_at` 升序。

### 5.4 动态（Moment）

#### FR-MOMENT-001 动态模型

- 动态必须支持字段：
  - `id`（UUIDv4）
  - `body_markdown`（必填，长度 `1..4000`）
  - `media`（可选，0..4，见 5.6）
  - `tags`（可选，0..10）
  - `status`（必填，枚举：`published`、`deleted`）
  - `created_at`、`updated_at`
- 仅 `admin` 可创建/编辑/删除动态。

#### FR-MOMENT-002 时间线

- `/moments` 必须展示按 `created_at` 倒序的时间线。
- 时间线必须支持“向下加载更多”（分页或无限滚动），每次加载 `20` 条。
- 动态条目必须展示：
  - 发布时间（相对时间 + 精确时间 hover/点击可见）
  - 正文（Markdown 渲染，受 MD2 约束）
  - 图片（若有）
  - 评论入口（显示评论数）

#### FR-MOMENT-003 动态图片（v1 固定做法）

- 动态“支持图片”在 v1 必须通过 `MomentDTO.media` 实现（而不是在 `body_markdown` 里允许 `![]()`）：
  - `body_markdown` 中的图片语法默认一律拒绝（见 MD2 / 10.4）
  - 动态展示的图片只能来自 `media[]`
- 管理员创建/更新动态时，`media` 入参必须支持两种形态（二选一）：
  - 传 `media[].id`：引用已存在 `media` 记录
  - 传 `media[].url`：由后端创建 `media` 记录并绑定到该动态
- 当使用 `media[].url` 创建时，后端必须推导 `media.storage`：
  - `url` 以 `/media/` 开头 → `storage=static`
  - `url` 以 `https://` 开头 → `storage=external`
  - 其余情况必须返回 `VALIDATION_FAILED`
- 展示规则：
  - 时间线卡片最多展示 1 张缩略图（取 `position=1`），其余在详情页以网格/轮播展示
  - 图片必须支持点击放大（轻量预览层），并且可键盘关闭（Esc）

### 5.5 评论（Comment）

#### FR-COMMENT-001 登录要求

- 未登录用户在任何页面（文章/动态）看到评论区时：
  - 必须可浏览公开评论
  - 发表评论按钮必须引导 GitHub 登录
- 已登录用户必须可发表评论（除非被封禁）。

#### FR-COMMENT-002 评论目标

- 评论必须支持两种目标：
  - `target_type=post` + `target_id=post.slug`
  - `target_type=moment` + `target_id=moment.id`

#### FR-COMMENT-003 楼中楼（有限层级）

- 评论必须支持 `parent_id` 形成楼中楼。
- 楼中楼最大层级固定为 `3` 层（根评论为第 1 层）。
- 超过 3 层时，系统必须拒绝并返回错误码 `COMMENT_DEPTH_EXCEEDED`。

#### FR-COMMENT-004 内容限制

- `body_markdown` 长度 `1..2000`。
- 禁止图片（见 MD2），禁止原始 HTML（见 MD1）。
- 必须进行敏感字段脱敏记录：存储 `ip_hash` 与 `user_agent_hash`（不可逆哈希），不得存储原始 IP 或 UA（隐私约束）。

#### FR-COMMENT-005 编辑与删除

- 编辑：
  - 仅评论作者本人或 admin 可编辑
  - 作者本人仅在 `15` 分钟窗口内可编辑；admin 不受窗口限制
- 删除：
  - 作者本人或 admin 可删除
  - 删除为软删除：保留记录但将 `status` 置为 `deleted_by_user` 或 `deleted_by_admin`
  - 前台必须展示占位文案“该评论已删除”

#### FR-COMMENT-006 审核与反垃圾

- 系统必须具备基础反垃圾策略：
  - 登录用户按 `user_id` 维度限速：`10` 条评论 / `10` 分钟
  - IP 按 `ip_hash` 维度限速：`20` 条评论 / `10` 分钟
  - 超限必须返回 `RATE_LIMITED`
- 管理员必须可对评论执行：
  - 隐藏（`status=hidden`）：前台不可见
  - 恢复（`status=visible`）

### 5.6 媒体（图片）

#### FR-MEDIA-001 图片展示（必须）

- 文章正文必须支持 Markdown 图片展示（`![](url)` 或 `![alt](url)`）。
- 动态必须支持附带图片（0..4）展示。
- 图片引用必须满足：
  - 允许绝对 URL：以 `https://` 开头
  - 允许站内路径：以 `/media/` 开头
  - 禁止：`http://`、`//`（scheme-relative）、`data:`、`blob:`（防止 XSS/注入）

#### FR-MEDIA-002 图片来源策略（必须提供免费路径）

Orin v1 必须提供以下两种来源策略，且默认启用 A：

- A（默认，零额外费用）：`static` 静态资源策略
  - 图片文件随前端工程一起发布（由 GitHub 管理，Cloudflare Pages 托管）
  - 后台仅提供“引用已存在图片 URL”的能力，不提供上传
- B（可选增强）：`r2` 对象存储策略
  - 若启用 Cloudflare R2，则后台必须提供图片上传与管理
  - 启用 B 后，A 仍必须可用（允许混用）

> 说明：B 是否启用由部署者自行决定；Orin 实现必须以“仅启用 A”也能完整运行作为底线。

### 5.7 主题与外观

#### FR-THEME-001 预设主题数量与切换

- 系统必须内置 ≥ 6 套主题（例如：`paper`、`ink`、`nord`、`rose`、`aurora`、`mono`）。
- 必须提供主题切换入口（全站任意页面可达）。
- 主题偏好必须持久化：
  - 未登录：`localStorage`（key：`orin.theme`）
  - 已登录：同步到服务端用户偏好（D1），并在多设备生效

#### FR-THEME-002 “朴素与华丽”的视觉约束

- 朴素：排版清晰、留白充足、对比度合规、交互不喧宾夺主。
- 华丽：允许出现低饱和渐变、轻微玻璃拟态（blur）、柔和阴影、精致分割线与微动效。
- 必须禁止：
  - 大面积高饱和渐变背景导致正文可读性下降
  - 过度动画（页面加载动画不得超过 `300ms`）

### 5.8 管理后台（发布与治理）

#### FR-ADMIN-001 登录与权限

- 后台入口 `/admin` 必须在未登录时跳转到 `/login`。
- 登录后若非 admin，必须返回 403 页面（不可仅隐藏入口）。

#### FR-ADMIN-002 文章发布流程

- 后台必须支持文章全流程：
  - 新建草稿 → 预览 → 发布（立即发布或计划发布）→ 更新 → 下线（转为 draft 或 unlisted）
- “计划发布”必须支持设定 `published_at`（UTC）。
- 验收标准：
  - Given 管理员设置 `published_at` 为未来时间
  - When 当前时间早于 `published_at`
  - Then 文章对外不可见
  - And 当时间到达/超过 `published_at`
  - Then 文章对外可见（无需人工干预）

#### FR-ADMIN-003 动态发布

- 后台必须支持创建/编辑/删除动态。
- 删除为软删除，时间线默认不展示已删除动态。

#### FR-ADMIN-004 评论管理

- 后台必须支持：
  - 按目标（文章/动态）筛选评论
  - 按状态（visible/hidden/deleted）筛选
  - 快速隐藏/恢复
  - 查看评论作者的 GitHub 基本信息（用户名、头像、主页链接）

#### FR-ADMIN-005 站点配置

- 后台 `/admin/settings` 必须支持配置并持久化到 D1（`settings` 表）：
  - 站点标题（`site_title`，长度 `1..32`）
  - 站点描述（`site_description`，长度 `0..160`）
  - 默认主题（`default_theme`，必须为内置主题名之一）
  - 导航栏链接（`nav_links`，0..10；每项包含 `label` 与 `href`）
  - 页脚信息（`footer_text`，长度 `0..200`，允许 Markdown 受限子集）
- 前台必须从后端读取并应用上述配置（不得仅靠前端静态常量）。

### 5.9 搜索、订阅与 SEO

#### FR-SEARCH-001 站内搜索

- 系统必须提供搜索页 `/search?q=<keyword>`：
  - 当 `q` 为空或仅空白时，必须展示空态提示，不得触发后端搜索
  - 当 `q` 非空时，必须展示文章搜索结果列表（匹配规则见 11.5）
  - 每次展示最多 `20` 条，可分页
- 搜索结果条目必须包含：标题、摘要、发布时间、标签、分组（若有）。

#### FR-SEO-001 元信息与规范链接

- 每个页面必须输出：
  - `<title>`（不超过 60 字符）
  - `<meta name="description">`（不超过 160 字符）
  - `<link rel="canonical">`（指向自身的规范 URL）
- 搜索结果页 `/search` 必须额外输出：`<meta name="robots" content="noindex, nofollow">`
- 文章与动态详情页必须输出 Open Graph 元信息：
  - `og:title`、`og:description`、`og:url`、`og:type`
  - 若存在封面图，必须输出 `og:image`（图片规则见 5.6）

#### FR-SEO-002 结构化数据（JSON-LD）

- 文章详情页必须输出 JSON-LD（schema.org `BlogPosting`），字段至少包含：
  - `headline`、`datePublished`、`dateModified`、`author`、`mainEntityOfPage`

#### FR-SEO-003 RSS

- 系统必须提供 `GET /rss.xml`：
  - Content-Type：`application/rss+xml; charset=utf-8`
  - 包含最新的 `20` 条内容（文章与动态混排），按发布时间倒序
  - 内容筛选必须满足：
    - 文章：`status=published` 且 `published_at <= now`
    - 动态：`status=published`
  - 每条 item 必须包含：`title`、`link`、`guid`、`pubDate`、`description`

#### FR-SEO-004 Sitemap

- 系统必须提供 `GET /sitemap.xml`：
  - Content-Type：`application/xml; charset=utf-8`
  - 必须包含：
    - 首页、文章列表、动态列表、标签列表、分组列表
    - 所有已发布文章详情页（`status=published` 且 `published_at <= now`）
    - 所有已发布动态详情页（`status=published`）
    - 所有标签详情页、分组详情页

#### FR-SEO-005 Robots

- 系统必须提供 `GET /robots.txt`：
  - 默认允许抓取全站
  - 必须声明 sitemap：`Sitemap: https://<site-domain>/sitemap.xml`

---

## 6. 非功能需求（NFR）

### 6.1 性能

- NFR-PERF-001：首屏（含 HTML、CSS、关键 JS）在良好网络下应在 `2s` 内可交互（TTI）。
- NFR-PERF-002：文章详情页必须在无 JS 情况下可完整阅读正文（渐进增强）。
- NFR-PERF-003：API 的 P95 响应时间目标：
  - 公共读接口：`< 300ms`（不含网络 RTT）
  - 写接口（评论/发布）：`< 800ms`

### 6.2 可靠性

- NFR-REL-001：写操作必须返回可重试语义：
  - 对于创建评论/动态等写入，必须提供幂等键 `Idempotency-Key`（可选 header）；相同键在 `10` 分钟内重复提交必须返回同一结果。

### 6.3 安全

- NFR-SEC-001：所有写接口必须要求 `Content-Type: application/json`（上传接口除外）并进行严格校验。
- NFR-SEC-002：所有渲染到 HTML 的用户输入必须经过 Markdown 逃逸与 HTML 净化（见 MD4）。
- NFR-SEC-003：会话 Cookie 必须 `HttpOnly`、`Secure`、`SameSite=Lax`；不得在前端 JS 中读取访问令牌。

### 6.4 可观测性

- NFR-OBS-001：后端必须输出结构化日志（JSON），至少包含：`request_id`、`route`、`status`、`latency_ms`、`user_id?(可选)`。
- NFR-OBS-002：对外错误必须映射为稳定错误码（见附录），不得直接暴露内部堆栈或 SQL。

---

## 7. 系统架构（高层）

### 7.1 组件与职责（必须）

- Cloudflare Pages：承载前端（静态资源 + 页面渲染产物）
- Cloudflare Pages：承载前端（SSR 页面 + 静态资源 + RSS/Sitemap/Robots 输出）
- Cloudflare Workers：承载后端 API（鉴权、业务用例、D1 读写、Markdown 渲染）
- Cloudflare D1：承载动态数据（用户、会话、动态、评论、站点配置、主题偏好等）
- GitHub：
  - 代码仓库
  - OAuth 登录（GitHub OAuth App）

### 7.2 域名与路由（默认方案）

- 前台：`https://<site-domain>/`
- API：`https://api.<site-domain>/v1/*`
- 静态图片（策略 A）：`https://<site-domain>/media/*`（由 Pages 托管）

> 若部署者不希望使用 `api.` 子域名，则可以改为同域 `/api/*` 路由；但 v1 默认以 `api.` 为准。

### 7.3 关键业务流程（概览）

#### 7.3.1 GitHub 登录（OAuth）

1. 前端跳转到 `GET /v1/auth/github/start?return_to=<url>`
2. 后端重定向到 GitHub 授权页
3. GitHub 回调 `GET /v1/auth/github/callback?code=...&state=...`
4. 后端换取 token → 拉取 GitHub 用户信息 → upsert 用户 → 创建会话 → 写入 Cookie → 重定向回 `return_to`

#### 7.3.2 发表评论

1. 前端 `POST /v1/comments`（携带会话 Cookie）
2. 后端校验权限、限速、内容 → 写入 D1
3. 返回 `CommentDTO`，前端追加到列表

### 7.4 渲染策略与数据流（必须）

- R1：文章详情页必须 SSR（满足 NFR-PERF-002：无 JS 可阅读）。
- R2：动态详情页必须 SSR（正文可阅读）；评论区允许 CSR 加载，但必须提供明确加载态与失败态。
- R3：所有 SSR 渲染数据一律来自 `orin-api`（HTTP 调用），前端不得直连 D1。
- R4：`/rss.xml`、`/sitemap.xml`、`/robots.txt` 必须由前端服务在 `<site-domain>` 侧输出（可通过 SSR route 生成），并以 `orin-api` 为数据来源。

---

## 8. API 设计（v1）

> API 采用 HTTP/JSON。除特殊说明外，请求与响应均使用 `application/json; charset=utf-8`。

### 8.1 通用约定

#### 8.1.1 Base URL 与版本

- Base URL：`https://api.<site-domain>/v1`
- 版本：`v1` 为稳定版本；破坏性变更必须引入新版本路径（如 `/v2`）。

#### 8.1.2 响应包络（必须）

- 成功：
  - HTTP 2xx
  - Body：`{ "ok": true, "data": <payload> }`
- 失败：
  - HTTP 4xx/5xx
  - Body：`{ "ok": false, "error": { "code": "<ERROR_CODE>", "message": "<human_readable>", "request_id": "<id>", "details": <object|null> } }`

#### 8.1.3 分页（必须）

- 列表接口一律采用 cursor 分页：
  - Query：`?limit=20&cursor=<opaque>`
  - `limit` 默认 `20`，最大 `50`
  - 响应：`{ items: [...], next_cursor: "<opaque|null>" }`

#### 8.1.4 身份与会话（必须）

- 会话通过 Cookie 传递：
  - Cookie 名：`orin_session`
  - Cookie 域：Host-only（不设置 `Domain`，仅对 `api.<site-domain>` 生效）
  - Cookie 属性：`HttpOnly; Secure; SameSite=Lax; Path=/`
  - 过期策略：`Max-Age` 必须等于 `ORIN_SESSION_TTL_MS / 1000`（向下取整）
- CSRF 双提交 Cookie：
  - Cookie 名：`orin_csrf`
  - Cookie 域：Host-only（同上）
  - Cookie 属性：`Secure; SameSite=Lax; Path=/`（必须允许前端 JS 读取；不得设置 HttpOnly）
  - 写接口要求：请求头 `X-CSRF-Token` 必须与 Cookie `orin_csrf` 完全一致，否则返回 `FORBIDDEN`
- 前端跨域调用（`<site-domain>` → `api.<site-domain>`）必须使用 `fetch(..., { credentials: "include" })`。

#### 8.1.5 错误码

- 错误码列表见附录；API 实现必须严格使用附录中的错误码，不得自造字符串。

#### 8.1.6 CORS（必须）

- 因前台与 API 跨域（`<site-domain>` → `api.<site-domain>`），CORS 必须按 12.3 的规则实现。
- 所有写接口必须正确响应预检请求（OPTIONS），不得在预检阶段执行鉴权/写入。

### 8.2 DTO 定义（核心）

#### 8.2.1 TimeDTO

```json
{
  "ts": 1737203696789,
  "iso": "2026-01-18T12:34:56.789Z"
}
```

#### 8.2.2 UserDTO

```json
{
  "id": "uuid",
  "github_id": 123456,
  "login": "octocat",
  "avatar_url": "https://avatars.githubusercontent.com/u/123456?v=4",
  "profile_url": "https://github.com/octocat",
  "role": "user",
  "created_at": { "ts": 0, "iso": "..." }
}
```

#### 8.2.3 CommentDTO

```json
{
  "id": "uuid",
  "target_type": "post",
  "target_id": "some-post-slug",
  "parent_id": null,
  "depth": 1,
  "author": { "id": "uuid", "github_id": 1, "login": "x", "avatar_url": "...", "profile_url": "...", "role": "user", "created_at": { "ts": 0, "iso": "..." } },
  "body_markdown": "hello",
  "body_html": "<p>hello</p>",
  "status": "visible",
  "created_at": { "ts": 0, "iso": "..." },
  "updated_at": { "ts": 0, "iso": "..." }
}
```

#### 8.2.4 TagDTO

```json
{
  "id": "uuid",
  "slug": "cloudflare",
  "name": "Cloudflare",
  "description": null
}
```

#### 8.2.5 GroupDTO

```json
{
  "id": "uuid",
  "slug": "backend",
  "name": "后端",
  "type": "category",
  "description": null
}
```

#### 8.2.6 MediaDTO

```json
{
  "id": "uuid",
  "storage": "static",
  "url": "https://<site-domain>/media/2026/01/example.webp",
  "mime_type": "image/webp",
  "size_bytes": 12345,
  "width": 1200,
  "height": 630,
  "alt": ""
}
```

#### 8.2.7 PostSummaryDTO

```json
{
  "id": "uuid",
  "slug": "some-post",
  "title": "一篇文章",
  "summary": "摘要…",
  "cover": null,
  "tags": [{ "id": "uuid", "slug": "cloudflare", "name": "Cloudflare", "description": null }],
  "groups": [{ "id": "uuid", "slug": "backend", "name": "后端", "type": "category", "description": null }],
  "status": "published",
  "published_at": { "ts": 0, "iso": "..." },
  "updated_at": { "ts": 0, "iso": "..." }
}
```

说明（必须）：

- `cover` 类型：`MediaDTO | null`
- 当 `status=draft` 时：`published_at` 必须为 `null`
- 当 `status=published|unlisted` 时：`published_at` 必须为 `TimeDTO`

#### 8.2.8 PostDetailDTO

```json
{
  "id": "uuid",
  "slug": "some-post",
  "title": "一篇文章",
  "summary": "摘要…",
  "cover": null,
  "tags": [],
  "groups": [],
  "status": "published",
  "published_at": { "ts": 0, "iso": "..." },
  "updated_at": { "ts": 0, "iso": "..." },
  "content_markdown": "# hello",
  "content_html": "<h1>hello</h1>",
  "reading_time_minutes": 3
}
```

说明（必须）：

- `cover` 类型：`MediaDTO | null`
- 当 `status=draft` 时：`published_at` 必须为 `null`

#### 8.2.9 MomentDTO

```json
{
  "id": "uuid",
  "body_markdown": "今天修了个 bug",
  "body_html": "<p>今天修了个 bug</p>",
  "media": [],
  "tags": [],
  "status": "published",
  "created_at": { "ts": 0, "iso": "..." },
  "updated_at": { "ts": 0, "iso": "..." }
}
```

说明（必须）：

- `media` 类型：`MediaDTO[]`（最多 4）

#### 8.2.10 SettingsPublicDTO

```json
{
  "site_title": "Orin",
  "site_description": "一个认真写字的地方",
  "default_theme": "paper",
  "nav_links": [{ "label": "关于", "href": "/about" }],
  "footer_text_html": "<p>© 2026 Orin</p>"
}
```

说明（必须）：

- `footer_text_html` 必须为净化后的 HTML（见 10.4），不得直接回传未净化的 Markdown 渲染结果

### 8.3 Auth

#### 8.3.1 开始登录

- `GET /auth/github/start?return_to=<url>`
- 行为：302 重定向到 GitHub OAuth 授权页
- 约束：
  - `return_to` 仅允许站内路径（以 `/` 开头）；否则必须重置为 `/`

#### 8.3.2 登录回调

- `GET /auth/github/callback?code=<code>&state=<state>`
- 行为：
  - 校验 state
  - 换取 access token
  - 拉取 GitHub 用户信息
  - upsert 用户
  - 创建会话，写入 `orin_session` Cookie
  - 302 重定向回 `return_to`

#### 8.3.3 获取当前用户

- `GET /auth/me`
- 响应：`UserDTO | null`

#### 8.3.4 退出登录

- `POST /auth/logout`
- 行为：撤销会话并清空 Cookie

### 8.4 Posts

> 公开读接口不要求登录；写接口仅 admin。

#### 8.4.1 获取文章列表（公开）

- `GET /posts?limit=&cursor=&tag=&group=&q=`
- 约束（必须）：
  - 仅返回：`status=published` 且 `published_at <= now`
  - 必须排除：`status=unlisted`
- Query：
  - `tag`：可选，`tag.slug`
  - `group`：可选，`group.slug`
  - `q`：可选，搜索关键字（见 11.5）
- 响应：
  - `items`：`PostSummaryDTO[]`
  - `next_cursor`

#### 8.4.2 获取文章详情（公开）

- `GET /posts/:slug`
- 约束（必须）：可见性规则见 FR-POST-002 / FR-POST-005
- 响应：`PostDetailDTO`

#### 8.4.3 管理员：创建草稿

- `POST /admin/posts`
- Body：
```json
{
  "title": "一篇文章",
  "slug": "some-post",
  "summary": null,
  "content_markdown": "",
  "cover_url": null,
  "tags": ["cloudflare"],
  "category": "backend",
  "series": [{ "slug": "workers", "position": 10 }]
}
```
- 约束（必须）：
  - `summary` 为 `null` 时由服务端按 FR-POST-001 规则生成
  - `tags` 为 `tag.slug[]`；不存在的 tag 必须自动创建（`name=slug`，`description=null`）
  - `category` 为 `group.slug|null`；不存在的 group 必须返回 `NOT_FOUND`（必须先用 `PUT /admin/groups/:slug` 创建）
  - `series` 为 `[{ slug, position }]`，最多 5 个；`position` 范围见 FR-GROUP-002
- 响应：`PostDetailDTO`

#### 8.4.4 管理员：更新文章

- `PATCH /admin/posts/:id`
- Body（允许部分更新）：
```json
{
  "title": "一篇文章（改）",
  "summary": "摘要（可选）",
  "content_markdown": "# hello",
  "cover_url": "/media/2026/01/cover.webp",
  "tags": ["cloudflare"],
  "category": "backend",
  "series": [{ "slug": "workers", "position": 10 }],
  "status": "published",
  "published_at": 1737203696789
}
```
- 约束（必须）：
  - `status/published_at` 规则见 FR-POST-001/FR-ADMIN-002
  - `slug` 变更规则见 FR-POST-004

#### 8.4.5 获取标签列表（公开）

- `GET /tags?limit=&cursor=`
- 约束（必须）：按 `name` 升序分页
- 响应：
```json
{
  "items": [
    {
      "tag": { "id": "uuid", "slug": "cloudflare", "name": "Cloudflare", "description": null },
      "post_count": 12,
      "moment_count": 3
    }
  ],
  "next_cursor": null
}
```

#### 8.4.6 获取标签详情（公开）

- `GET /tags/:slug`
- 响应：`TagDTO`

#### 8.4.7 获取分组列表（公开）

- `GET /groups?limit=&cursor=&type=`
- Query：
  - `type`：可选，`category|series`
- 约束（必须）：默认按 `type`（category 在前）+ `name` 升序分页
- 响应：
```json
{
  "items": [
    {
      "group": { "id": "uuid", "slug": "backend", "name": "后端", "type": "category", "description": null },
      "post_count": 12
    }
  ],
  "next_cursor": null
}
```

#### 8.4.8 获取分组详情（公开）

- `GET /groups/:slug`
- 响应：`GroupDTO`

#### 8.4.9 获取站点配置（公开）

- `GET /settings/public`
- 响应：`SettingsPublicDTO`

### 8.5 Moments

#### 8.5.1 获取时间线（公开）

- `GET /moments?limit=&cursor=&tag=`
- 约束（必须）：仅返回 `status=published`
- 响应：`{ items: MomentDTO[], next_cursor: string|null }`

#### 8.5.2 获取动态详情（公开）

- `GET /moments/:id`
- 约束（必须）：若 `status=deleted` 必须返回 404

#### 8.5.3 管理员：创建动态

- `POST /admin/moments`
- Body：
```json
{
  "body_markdown": "今天修了个 bug",
  "media": [{ "url": "/media/2026/01/example.webp", "alt": "" }],
  "tags": ["cloudflare"]
}
```
- 约束（必须）：
  - `media` 最多 4
  - `media[].url` 必须满足 FR-MEDIA-001
  - `media[].alt` 长度 `0..120`
  - `tags` 为 `tag.slug[]`；不存在的 tag 必须自动创建（`name=slug`）

#### 8.5.4 管理员：更新动态

- `PATCH /admin/moments/:id`
- Body（允许部分更新）：
```json
{
  "body_markdown": "更新后的内容",
  "media": [{ "url": "https://example.com/a.webp", "alt": "图" }],
  "tags": ["cloudflare"]
}
```

#### 8.5.5 管理员：删除动态（软删除）

- `DELETE /admin/moments/:id`

### 8.6 Comments

#### 8.6.1 获取评论列表（公开）

- `GET /comments?target_type=post&target_id=<id>`
- 响应：`{ items: CommentDTO[], next_cursor: string|null }`
- 约束：
  - 默认返回按 `created_at` 正序
  - 必须包含 `depth` 字段
  - 对 `visitor/user`：
    - 必须排除 `status=hidden`
    - 必须保留“已删除”评论（`deleted_by_user/deleted_by_admin`），但 `body_markdown/body_html` 必须返回空字符串

#### 8.6.2 发表新评论（需要登录）

- `POST /comments`
- Body：
```json
{
  "target_type": "post",
  "target_id": "some-post-slug",
  "parent_id": null,
  "body_markdown": "hello"
}
```
- 约束（必须）：
  - 必须通过 CSRF 校验（见 8.1.4 / 10.2）
  - 触发限速必须返回 `RATE_LIMITED`
- 响应：`CommentDTO`

#### 8.6.3 编辑评论（需要登录）

- `PATCH /comments/:id`
- Body：`{ "body_markdown": "..." }`
- 约束：权限与时间窗口见 FR-COMMENT-005

#### 8.6.4 删除评论（需要登录）

- `DELETE /comments/:id`

### 8.7 Admin（治理与配置）

- `GET /admin/comments?limit=&cursor=&target_type=&target_id=&status=`
- `POST /admin/comments/:id/hide`
- `POST /admin/comments/:id/unhide`
- `GET /admin/settings`
- `PATCH /admin/settings`
- `GET /admin/posts?limit=&cursor=&status=`
- `GET /admin/posts/:id`
- `GET /admin/moments?limit=&cursor=&status=`
- `PUT /admin/tags/:slug`
- `PUT /admin/groups/:slug`

#### 8.7.1 管理员：更新站点配置

- `PATCH /admin/settings`
- Body（允许部分更新）：
```json
{
  "site_title": "Orin",
  "site_description": "一个认真写字的地方",
  "default_theme": "paper",
  "nav_links": [{ "label": "关于", "href": "/about" }],
  "footer_text_markdown": "© 2026 Orin"
}
```
- 响应：`SettingsPublicDTO`

#### 8.7.2 管理员：创建/更新标签元数据

- `PUT /admin/tags/:slug`
- Body：
```json
{ "name": "Cloudflare", "description": "..." }
```
- 约束：`:slug` 必须满足 SLUG1
- 行为：
  - 若不存在则创建；若存在则更新
  - 返回 `TagDTO`

#### 8.7.3 管理员：创建/更新分组元数据

- `PUT /admin/groups/:slug`
- Body：
```json
{ "name": "后端", "type": "category", "description": "..." }
```
- 约束：
  - `type` 必须为 `category|series`
  - `category` 与 `series` 同名/同 slug 视为同一个 group（由 slug 唯一）
- 行为：若不存在则创建；若存在则更新；返回 `GroupDTO`

#### 8.7.4 管理员：读取站点配置（含 Markdown）

- `GET /admin/settings`
- 响应：
```json
{
  "site_title": "Orin",
  "site_description": "一个认真写字的地方",
  "default_theme": "paper",
  "nav_links": [{ "label": "关于", "href": "/about" }],
  "footer_text_markdown": "© 2026 Orin"
}
```

#### 8.7.5 管理员：文章列表（含草稿）

- `GET /admin/posts?limit=&cursor=&status=`
- Query：
  - `status`：可选，`draft|published|unlisted`
- 响应：`{ items: PostSummaryDTO[], next_cursor: string|null }`

#### 8.7.6 管理员：读取文章（按 id）

- `GET /admin/posts/:id`
- 响应：`PostDetailDTO`

#### 8.7.7 管理员：动态列表（含已删除）

- `GET /admin/moments?limit=&cursor=&status=`
- Query：
  - `status`：可选，`published|deleted`
- 响应：`{ items: MomentDTO[], next_cursor: string|null }`

---

## 9. 前端设计（主题与交互）

### 9.1 UI 基线（必须）

- 全站必须满足 WCAG 2.1 AA 对比度要求。
- 所有交互控件必须可键盘操作，焦点态可见。
- Markdown 文章排版必须使用稳定字号阶梯与行高（建议：正文 `16..18px`，行高 `1.7..1.9`）。

### 9.2 主题系统（实现约束）

- 主题必须以 CSS 变量实现（Design Tokens），变量名固定前缀 `--orin-`。
- 至少包含以下 token：
  - `--orin-bg`、`--orin-fg`、`--orin-muted`、`--orin-border`
  - `--orin-primary`、`--orin-accent`
  - `--orin-card-bg`、`--orin-card-shadow`
  - `--orin-code-bg`、`--orin-code-fg`
- 主题切换必须无刷新生效；切换动画时长固定 `150ms`，仅允许对 `color/background-color/border-color` 做 transition。

### 9.3 前端技术栈与渲染（必须）

- Orin v1 前端必须采用 SSR 框架，以满足"无 JS 可阅读文章/动态正文"（见 NFR-PERF-002、7.4）。
- 默认技术选型（v1 固定）：
  - **前台**：Astro（TypeScript），内容驱动，默认零 JS 输出
  - **后台**：React（TypeScript），可通过 Astro Islands 或独立 SPA 实现
  - 部署：Cloudflare Pages（SSR 通过 Pages Functions / Astro Adapter）
  - 样式：CSS Variables（主题 token）+ CSS Modules / Scoped CSS；禁止把颜色硬编码在组件里
- 数据获取：
  - SSR 时通过 `PUBLIC_ORIN_API_BASE` 调用 `orin-api`
  - 浏览器端交互（评论发表、主题同步等）通过 `fetch` 调用 `orin-api`（`credentials: "include"`）
  - 后台可使用 React 组件配合 Astro Islands（`client:load` / `client:only`）实现交互

### 9.4 全局布局（必须）

- 顶部导航栏必须包含：
  - 站点标题（可点击回首页）
  - 主导航（来自 `SettingsPublicDTO.nav_links`）
  - 搜索入口
  - 主题切换入口
  - 登录/头像入口（未登录显示“GitHub 登录”，已登录显示头像下拉）
- 页脚必须包含：
  - `SettingsPublicDTO.footer_text_html` 渲染结果（必须净化）
  - RSS 链接：`/rss.xml`

### 9.5 预设主题清单（v1 固定，≥ 6）

> 每套主题必须提供完整 token；下表给出 v1 的默认配色（实现不得随意更名主题 ID）。

| theme | `--orin-bg` | `--orin-fg` | `--orin-primary` | `--orin-accent` | 风格说明 |
|---|---|---|---|---|---|
| `paper` | `#fbf7ef` | `#1f2328` | `#0b5fff` | `#d97706` | 暖白纸张感，朴素为主 |
| `ink` | `#0b0f19` | `#e6edf3` | `#7aa2f7` | `#f7768e` | 深色墨水感，冷静但不死黑 |
| `nord` | `#eceff4` | `#2e3440` | `#5e81ac` | `#a3be8c` | 北欧冷淡风，适合技术内容 |
| `rose` | `#fff7fb` | `#2a1b22` | `#db2777` | `#f59e0b` | 轻玫瑰点缀，带一点华丽 |
| `aurora` | `#f8fafc` | `#0f172a` | `#06b6d4` | `#a78bfa` | 极低饱和渐变点缀（朴素中带华丽） |
| `mono` | `#ffffff` | `#111827` | `#111827` | `#6b7280` | 纯黑白极简（华丽归零） |

### 9.6 动态时间线交互（必须）

- 时间线必须支持：
  - 骨架屏加载态（首次进入与加载更多）
  - “加载失败”提示与重试按钮
  - 无限滚动触发阈值：距离底部 `< 800px` 时触发下一页
- 动态正文渲染必须支持：
  - 自动识别 URL 并渲染为链接（同 10.4 规则）
  - 代码片段（行内 code + fenced code）

### 9.7 评论交互（必须）

- 未登录时：
  - 评论输入框置灰，显示“登录后发表评论”
  - 点击登录按钮跳转到 `/login`（登录成功后必须回到当前页面锚点 `#comments`）
- 已登录时：
  - 支持发布根评论与回复（楼中楼不超过 3 层）
  - 支持“编辑/删除”（规则见 FR-COMMENT-005）
  - 发表成功后必须原地更新 UI（无需整页刷新）

### 9.8 后台交互（必须）

- 所有后台页面必须明确展示当前环境（例如：`prod`/`staging`），避免误操作。
- 文章编辑页必须提供：
  - Markdown 编辑区
  - 实时预览（同服务端渲染规则，避免线上/预览不一致）
  - 状态切换（draft/published/unlisted）与计划发布时间选择器（UTC）

---

## 10. 后端设计（分层与安全）

### 10.1 分层与目录约束（必须）

> 代码分层必须遵循仓库 `AGENTS.md` 的 L1~L4/X1/X2 约束；这里给出落地解释（与 AGENTS.md 冲突时以 AGENTS.md 为准）。

- `/entry`：唯一启动入口与装配根；不允许业务逻辑
- `/api`：HTTP 路由、鉴权、参数校验、错误映射；不得出现业务规则
- `/usecases`：业务流程编排（发布文章、发评论、发动态、审核评论等）
- `/atoms`：纯函数/纯逻辑原子；无 I/O
- `/contracts`：DTO、错误码、端口接口；只声明不实现
- `/adapters`：I/O 实现（D1、GitHub OAuth、可选 R2 等）

### 10.2 安全策略（必须）

- 所有写接口必须进行：
  - `Origin` 校验（仅允许 `ORIN_PUBLIC_ORIGIN`）
  - CSRF 防护：采用双提交 Cookie（`orin_csrf`）+ Header（`X-CSRF-Token`）；两者不一致直接拒绝
  - 限速：见 5.5.6
- OAuth：
  - 必须使用 `state` 防 CSRF
  - 必须校验 `return_to` 防开放重定向（见 8.3.1）

### 10.3 输入校验与错误映射（必须）

- 所有 API 入参必须做严格校验：
  - JSON body 必须拒绝“未知字段”（避免悄悄吞参数）
  - 字符串必须 `trim` 后再判空
  - 所有 `slug` 必须校验 SLUG1
- 校验失败必须：
  - 返回 `VALIDATION_FAILED`
  - `error.details` 必须包含字段级错误信息（例如：`{ "field": "slug", "reason": "INVALID_SLUG" }`）

### 10.4 URL 校验与渲染安全（必须）

> 本节是 MD2/MD3/MD4 的落地细则，目的是把“支持图片/链接”做成可上线的安全实现。

- 链接（`[text](url)`）：
  - 只允许 `http:`、`https:`、`mailto:`
  - 渲染到 HTML 时必须补齐：`rel="noopener noreferrer"`；当 `target="_blank"` 时必须包含 `noopener`
- 图片：
  - 文章正文允许：
    - `https://...`
    - `/media/...`（站内静态资源）
  - 评论与动态正文（Markdown）默认禁止图片语法（见 MD2），只能通过 `MomentDTO.media` 展示图片
  - 一切图片引用必须拒绝：`http://`、`//`、`data:`、`blob:`
- HTML 净化（allowlist）：
  - 必须对 Markdown 渲染结果进行二次净化，只允许常见排版标签（`p`、`a`、`strong`、`em`、`ul/ol/li`、`pre/code`、`blockquote`、`h1..h4`、`img`(仅 Post) 等）
  - 必须剔除一切事件属性（`on*`）与内联脚本

### 10.5 缓存与一致性（必须）

- 公共读接口（例如：`GET /posts`、`GET /posts/:slug`、`GET /moments`）必须返回：
  - `Cache-Control: public, max-age=60`
  - `ETag`（内容哈希）
  - 支持 `If-None-Match`，命中时返回 304
- 含鉴权的接口与写接口（例如：`/admin/*`、`POST /comments`）必须返回：
  - `Cache-Control: no-store`

### 10.6 用例（Usecases）清单（v1 固定）

> 这里不是“实现建议”，而是对 `usecases/` 必须包含哪些业务流程的枚举，避免把业务判断写进 `api/` 或 `adapters/`。

- Auth：
  - `StartGithubOAuth`
  - `HandleGithubOAuthCallback`
  - `GetCurrentUser`
  - `Logout`
- Posts：
  - `CreatePostDraft`
  - `UpdatePost`
  - `GetPublicPostBySlug`
  - `ListPublicPosts`
- Taxonomy：
  - `ListTags`
  - `GetTagBySlug`
  - `UpsertTag`（admin）
  - `ListGroups`
  - `GetGroupBySlug`
  - `UpsertGroup`（admin）
- Moments：
  - `CreateMoment`（admin）
  - `UpdateMoment`（admin）
  - `DeleteMoment`（admin）
  - `GetPublicMomentById`
  - `ListPublicMoments`
- Comments：
  - `ListPublicComments`
  - `CreateComment`
  - `EditComment`
  - `DeleteComment`
  - `HideComment`（admin）
  - `UnhideComment`（admin）
- Settings：
  - `GetPublicSettings`
  - `PatchSettings`（admin）

---

## 11. 数据设计（D1）

### 11.1 命名与约定（必须）

- 表名：小写复数 `snake_case`（例如：`users`、`post_tags`）。
- 主键：一律 `id TEXT PRIMARY KEY`（UUIDv4 字符串）。
- 时间：一律 `INTEGER` Unix 毫秒（UTC）。
- 布尔：一律 `INTEGER`（`0/1`）并加 `CHECK (x IN (0,1))`。
- 枚举：一律 `TEXT` + `CHECK (x IN (...))`。

### 11.2 DDL（初始迁移：`0001_init.sql`）

> 说明：下面 DDL 是 Orin v1 的“规范数据库结构”。迁移脚本必须与之保持一致，且必须开启 `PRAGMA foreign_keys = ON;`。

```sql
PRAGMA foreign_keys = ON;

-- 用户（来自 GitHub OAuth）
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  github_id INTEGER NOT NULL UNIQUE,
  login TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  is_banned INTEGER NOT NULL DEFAULT 0 CHECK (is_banned IN (0, 1)),
  theme_pref TEXT NULL, -- 例如：paper/ink/nord...
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER NOT NULL
);

-- 会话（服务端会话，Cookie 只存 session_id）
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER NULL,
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

-- 站点级配置（单站点；key-value）
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 媒体（图片）
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  storage TEXT NOT NULL CHECK (storage IN ('static', 'external', 'r2')),
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NULL,
  width INTEGER NULL,
  height INTEGER NULL,
  alt TEXT NOT NULL DEFAULT '',
  sha256 TEXT NULL,
  created_by_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX media_sha256_idx ON media(sha256);

-- 标签
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 分组（分类/系列）
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('category', 'series')),
  description TEXT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 文章
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  cover_media_id TEXT NULL REFERENCES media(id) ON DELETE SET NULL,
  cover_url TEXT NULL, -- 当 cover_media_id 为空时使用
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'unlisted')),
  published_at INTEGER NULL,
  updated_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  content_markdown TEXT NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT NOT NULL, -- 用于搜索的纯文本（去 Markdown）
  reading_time_minutes INTEGER NOT NULL
);
CREATE INDEX posts_status_published_at_idx ON posts(status, published_at DESC);
CREATE INDEX posts_updated_at_idx ON posts(updated_at DESC);

-- 文章-标签
CREATE TABLE post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX post_tags_tag_id_idx ON post_tags(tag_id, post_id);

-- 文章-分组（含系列 position）
CREATE TABLE post_groups (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  position INTEGER NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, group_id)
);
CREATE INDEX post_groups_group_id_pos_idx ON post_groups(group_id, position, post_id);

-- 动态
CREATE TABLE moments (
  id TEXT PRIMARY KEY,
  body_markdown TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('published', 'deleted')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX moments_status_created_at_idx ON moments(status, created_at DESC);

-- 动态-标签
CREATE TABLE moment_tags (
  moment_id TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (moment_id, tag_id)
);
CREATE INDEX moment_tags_tag_id_idx ON moment_tags(tag_id, moment_id);

-- 动态-媒体（最多 4 张）
CREATE TABLE moment_media (
  moment_id TEXT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 4),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (moment_id, media_id)
);
CREATE INDEX moment_media_moment_pos_idx ON moment_media(moment_id, position);

-- 评论（目标为 post.slug 或 moment.id）
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'moment')),
  target_id TEXT NOT NULL,
  parent_id TEXT NULL REFERENCES comments(id) ON DELETE SET NULL,
  depth INTEGER NOT NULL CHECK (depth >= 1 AND depth <= 3),
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body_markdown TEXT NOT NULL,
  body_html TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('visible', 'hidden', 'deleted_by_user', 'deleted_by_admin')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER NULL,
  ip_hash TEXT NOT NULL,
  user_agent_hash TEXT NOT NULL
);
CREATE INDEX comments_target_idx ON comments(target_type, target_id, created_at);
CREATE INDEX comments_author_idx ON comments(author_user_id, created_at);
CREATE INDEX comments_parent_idx ON comments(parent_id, created_at);
CREATE INDEX comments_status_idx ON comments(status, created_at);

-- 幂等键（写接口可选）
CREATE TABLE idempotency_keys (
  id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
  idem_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  UNIQUE (route, user_id, idem_key)
);
CREATE INDEX idempotency_expires_at_idx ON idempotency_keys(expires_at);
```

### 11.3 关键约束的落地说明（必须）

- D1-POST-001：`posts.summary` 必须非空；当后台未填写时由服务端生成并写入。
- D1-POST-002：`posts.reading_time_minutes` 必须由服务端计算并写入（前端不得自行估算）。
- D1-COMMENT-001：评论 `target_id`：
  - `target_type=post` 时必须为 `posts.slug`
  - `target_type=moment` 时必须为 `moments.id`
  - 写入时必须验证目标存在，否则返回 `NOT_FOUND`
- D1-SETTINGS-001：`settings` 表的 key 约束（v1 固定）：
  - `site_title`：`{ "value": "<string>" }`
  - `site_description`：`{ "value": "<string>" }`
  - `default_theme`：`{ "value": "<theme_name>" }`
  - `nav_links`：`{ "value": [{ "label": "<string>", "href": "<string>" }] }`
  - `footer_text_markdown`：`{ "value": "<markdown>" }`
  - `footer_text_html`：`{ "value": "<sanitized_html>" }`

### 11.4 索引与查询模式（必须匹配）

- Q1：文章列表页：`posts` 按 `published_at DESC` 分页（只取 `status IN ('published','unlisted')` 中的公开部分，`unlisted` 不出现在列表）。
- Q2：标签页：通过 `tags.slug` → `tags.id` → `post_tags` → `posts`。
- Q3：系列页：通过 `groups.slug` → `groups.id` → `post_groups` 按 `position ASC` → `posts`。
- Q4：时间线：`moments` 按 `created_at DESC` 分页，仅取 `status='published'`。
- Q5：评论：按 `(target_type, target_id)` 查询后，组装 3 层树。

### 11.5 搜索（实现与限制）

> v1 搜索以“可用、可预测”为第一目标，采用 `LIKE`（不依赖 FTS 扩展），以保证在 D1/SQLite 兼容范围内必然可运行。

- 搜索入口：
  - 前端：`/search?q=...`
  - API：`GET /posts?q=...`、`GET /moments?tag=...`（动态全文搜索作为 v2 可选）
- 文章搜索范围：
  - `posts.title`、`posts.summary`、`posts.content_text`
- 规则：
  - `q` 长度 `1..50`
  - 以空格分词：`q = "a b"` → 必须同时命中 `a` 与 `b`（AND 语义）
  - 每个词使用 `LIKE '%term%'`（term 需要做转义）
- 限制（必须明确告知用户）：
  - 不支持模糊纠错、同义词、排序学习；默认按 `published_at DESC` 排序

### 11.6 数据保留与隐私（必须）

- P1：`ip_hash` 与 `user_agent_hash` 必须为不可逆哈希（推荐 `sha256(salt + value)`），salt 必须为服务端密钥（环境变量）。
- P2：不得存储 GitHub access token 明文；若未来需要调用 GitHub API，必须采用短期 token 或加密存储（v1 默认不存）。
- P3：用户可在 UI 中发起“删除我的评论”操作（软删除）；v1 不提供“删除账号”自动流程（需要管理员手工处理数据库）。

---

## 12. 部署与运维

### 12.1 Cloudflare 资源清单（必须）

- Pages：
  - 项目名：`orin-web`
  - 绑定域名：`<site-domain>`（apex 或 `www` 由部署者选择；本文默认 apex）
  - 必须启用 SSR（用于文章/动态详情与 `/rss.xml`、`/sitemap.xml`、`/robots.txt` 输出）
- Workers：
  - 服务名：`orin-api`
  - 绑定域名：`api.<site-domain>`
- D1：
  - 数据库名：`orin_db`
  - 仅绑定到 `orin-api`（禁止在前端直接连库）

### 12.2 DNS 与 HTTPS（必须）

- 前台与 API 子域名均必须开启 HTTPS，并强制 HTTP→HTTPS 跳转。

### 12.3 CORS（必须，因 API 与前台跨域）

后端 `orin-api` 必须设置：

- `Access-Control-Allow-Origin`：精确匹配 `https://<site-domain>`（不得使用 `*`）
- `Access-Control-Allow-Origin`：精确匹配 `ORIN_PUBLIC_ORIGIN`（不得使用 `*`）
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET,POST,PATCH,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type,X-CSRF-Token,Idempotency-Key`
- 预检请求（OPTIONS）必须返回 204/200 且不进行鉴权业务逻辑

### 12.4 环境变量与密钥（必须）

> 所有密钥通过 `wrangler secret put` 写入；不得提交到 GitHub。

后端 `orin-api` 运行所需：

- `GITHUB_OAUTH_CLIENT_ID`（必填）
- `GITHUB_OAUTH_CLIENT_SECRET`（必填，secret）
- `ORIN_SESSION_SIGNING_SECRET`（必填，secret；用于签名/校验 session token 或加密 session id）
- `ORIN_CSRF_SALT`（必填，secret；用于哈希 ip/ua）
- `ORIN_PUBLIC_ORIGIN`（必填，例如：`https://<site-domain>`；用于 Origin 校验与重定向白名单）
- `ORIN_ADMIN_GITHUB_IDS`（必填，例如：`123,456`）
- `ORIN_SESSION_TTL_MS`（必填，例如：`1209600000`=14 天）

前端 `orin-web` 运行所需（公开）：

- `PUBLIC_ORIN_API_BASE`（必填，例如：`https://api.<site-domain>/v1`）

GitHub OAuth App 配置（必须）：

- 创建位置：GitHub → Settings → Developer settings → OAuth Apps
- Homepage URL：`https://<site-domain>/`
- Authorization callback URL：`https://api.<site-domain>/v1/auth/github/callback`
- OAuth scopes（v1 固定）：仅 `read:user`

### 12.5 CI/CD（GitHub Actions，必须）

> v1 必须支持“一键部署”：push 到 `main` 后自动发布前端与后端。

工作流要求：

- `pull_request`：
  - 安装依赖
  - 运行 `lint`、`typecheck`、`test`
  - 失败必须阻断合并
- `push` 到 `main`：
  - 运行同样的质量门禁
  - 部署 `orin-api`（wrangler）
  - 应用 D1 migrations（wrangler d1 migrations apply）
  - 部署 `orin-web`（Pages：通过 GitHub 集成自动构建；或通过 wrangler pages deploy）

### 12.6 数据迁移（必须）

- 迁移目录：`migrations/d1/`
- 命名：`0001_init.sql`、`0002_*.sql` 递增
- 发布流程：
  - 先 apply migration
  - 再发布 worker
  - 前端发布可独立进行

### 12.7 回滚策略（必须）

- Worker 回滚：保留最近 5 个版本；回滚时不得修改数据库（只能回滚代码）。
- 数据库变更：
  - 迁移脚本必须“可回滚或可前滚”（drop/rename 等破坏性操作必须提供替代策略：新表+回填+切换）。
- 若发生线上故障：
  1. 立即回滚 Worker 到上一个版本
  2. 若问题源于迁移，则必须通过新迁移修复（禁止手工改库作为常态）

### 12.8 站点安全（Cloudflare 盾，免费可用部分）

- 必须开启 Cloudflare 的基础 DDoS 防护（默认具备）。
- 对 `/v1/comments` 等写接口必须额外启用应用层防护（见 5.5.6 / 10.2），不得依赖付费 WAF 才能防住垃圾。

### 12.9 仓库结构（v1 固定：分区 + 六层）

> 你要的“分区”不是摆设：每个分区内部仍必须遵循六层（L1~L4/X1/X2）的依赖与 I/O 隔离规则（见仓库 `AGENTS.md` 与 10.1）。  
> 换句话说：不是把文件挪进子目录就完事了，分区里也得按层次放对位置。

#### 12.9.1 分区定义（必须）

- `apps/web`：前端（Cloudflare Pages，SSR）
- `services/orin-api`：后端（Cloudflare Workers）
- `migrations/d1`：数据库迁移（D1）
- `packages/*`：共享包（可选，但若引入必须有明确边界）

#### 12.9.2 分区内六层结构（必须）

推荐目录（可直接照搬）：

```
/apps/web/                      # 前端 Astro（SSR on Pages；含 public+admin 路由）
/apps/web/entry/                # L1：前端启动入口与装配根（SSR 入口、全局依赖装配）
/apps/web/api/                  # L2：前端"协议层"（路由入参解析、表单/查询校验、错误映射；禁止业务规则）
/apps/web/usecases/             # L3：前端用例（页面流程编排：加载文章、提交评论、主题同步等）
/apps/web/atoms/                # L4：纯逻辑/纯 UI 工具（无 I/O）
/apps/web/contracts/            # X1：DTO/类型/错误码声明（只声明不实现）
/apps/web/adapters/             # X2：I/O 适配（仅这里允许 fetch/localStorage/cookie 等 I/O）

/apps/web/src/pages/            # Astro 页面路由（仅做"路由装配"：调用 api/usecases；禁止直接写业务）
/apps/web/src/pages/            # 前台路由（public）
/apps/web/src/pages/admin/      # 后台路由（admin，React Islands）
/apps/web/src/components/       # Astro 组件 + React 组件（后台交互）
/apps/web/src/layouts/          # Astro 布局

/services/orin-api/             # 后端 Worker
/services/orin-api/entry/       # L1
/services/orin-api/api/         # L2
/services/orin-api/usecases/    # L3
/services/orin-api/atoms/       # L4
/services/orin-api/contracts/   # X1
/services/orin-api/adapters/    # X2（D1/GitHub OAuth/可选 R2）

/migrations/d1/                 # D1 migrations（0001_init.sql...）
/packages/ui/                   # 可选：共享 UI（主题 token/组件），纯前端包
```

前端六层的落地解释（避免扯皮，必须按这个理解）：

- `/apps/web/adapters` 是前端唯一允许 I/O 的地方（包括：`fetch`、`localStorage`、`document.cookie`、`Date.now()` 若用于业务判定也应封装到 adapter）。
- `/apps/web/api` 只做：
  - 入参解析（URL params、query、form）
  - 校验与标准化（trim、slug 校验等）
  - 错误映射（把后端错误码映射成 UI 可消费的错误）
  - 禁止：任何"是否允许/是否发布/是否可见"的业务判断（这属于用例层或后端）
- `/apps/web/usecases` 负责把页面流程串起来：
  - 例如：加载文章详情（含 settings）、提交评论后刷新列表、主题偏好同步到服务端等
- `/apps/web/contracts` 只能放类型/常量声明；不得出现 `fetch`、不得出现业务流程编排。

前台/后台的"最小区分要求"（必须）：

- 前台路由放在 `/apps/web/src/pages/`（根目录下的 `.astro` 文件）
- 后台路由放在 `/apps/web/src/pages/admin/`，使用 React Islands（`client:load`）实现交互
- 共享组件放在 `/apps/web/src/components/` 或 `/packages/ui/`，不得复制粘贴两份
- 前台页面默认零 JS；需要交互的组件（如评论区、主题切换）使用 `client:visible` 或 `client:load`


---

## 附录：错误码（v1 固定）

| code | HTTP | 场景 |
|---|---:|---|
| `AUTH_REQUIRED` | 401 | 未登录访问需要登录的接口 |
| `FORBIDDEN` | 403 | 权限不足（非 admin 或非资源所有者） |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_FAILED` | 400 | 参数校验失败 |
| `RATE_LIMITED` | 429 | 触发限速 |
| `COMMENT_DEPTH_EXCEEDED` | 400 | 评论层级超过上限 |
| `INTERNAL_ERROR` | 500 | 未分类内部错误（必须记录 request_id） |
