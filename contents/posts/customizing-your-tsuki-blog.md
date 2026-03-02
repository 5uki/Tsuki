---
title: '自定义你的 Tsuki 博客：配置、主题与个性化'
summary: '详解 tsuki.config.json 的每一个配置项，以及如何通过主题、公告、友链等功能让博客真正属于你。'
publishedAt: '2026-01-01'
category: '教程'
series: 'Tsuki 上手指南'
tags: ['配置', '主题', '自定义']
cover: './contents/banners/2.png'
pinned: false
---

部署完成只是开始，真正让博客属于你的是个性化配置。Tsuki 的所有站点级配置都集中在根目录的 `tsuki.config.json` 文件中，无需修改任何代码就能完成大部分定制。

## 一、配置文件结构总览

`tsuki.config.json` 分为以下几个区块：

```json
{
  "site": { ... },          // 站点基础信息
  "hero": { ... },          // 首页横幅
  "nav": [ ... ],           // 导航栏链接
  "profile": { ... },       // 侧边栏个人信息
  "announcement": { ... },  // 公告栏
  "stats": { ... },         // 统计信息
  "friends": [ ... ]        // 友链列表
}
```

下面逐一讲解。

## 二、站点基础信息（site）

```json
{
  "site": {
    "title": "Tsuki",
    "url": "https://your-domain.com",
    "description": "在这里记录你的思考与创作。",
    "defaultTheme": "mauve",
    "faviconHref": "./contents/favicon.png",
    "locale": "zh"
  }
}
```

| 字段 | 说明 | 示例 |
|------|------|------|
| `title` | 站点标题，显示在浏览器标签页和页头 | `"我的博客"` |
| `url` | 站点正式 URL，用于 SEO 和 sitemap 生成 | `"https://blog.example.com"` |
| `description` | 站点描述，显示在搜索引擎结果中 | `"记录技术与生活"` |
| `defaultTheme` | 默认主题色 | `"mauve"` |
| `faviconHref` | 站点图标路径，支持 SVG 和 PNG | `"./contents/favicon.png"` |
| `locale` | 界面语言，支持 `"zh"` 和 `"en"` | `"zh"` |

### 主题色选择

Tsuki 内置了多个精心调配的主题色，你可以在 `defaultTheme` 中使用以下值：

- `mauve` — 柔和紫调（默认）
- `rose` — 玫瑰暖色
- `blue` — 清冷蓝调
- `green` — 自然绿意
- `paper` — 素纸白

> 💡 用户登录后可以在页面上自主切换主题，`defaultTheme` 只影响未登录用户的首次体验。

## 三、首页横幅（hero）

```json
{
  "hero": {
    "title": "欢迎来到我的博客",
    "subtitle": "这是一个可快速定制的博客模板。",
    "backgroundImages": [
      { "href": "./contents/banners/1.png", "positionX": 32, "positionY": 25 },
      { "href": "./contents/banners/2.png", "positionX": 32, "positionY": 25 },
      { "href": "./contents/banners/3.png", "positionX": 32, "positionY": 25 }
    ]
  }
}
```

横幅支持配置多张背景图，系统会在每次访问时随机展示。`positionX` 和 `positionY` 控制图片焦点位置（百分比），确保在不同屏幕尺寸下显示最重要的画面区域。

**更换横幅图片**：
1. 将你的图片放入 `contents/banners/` 目录
2. 更新 `backgroundImages` 中的路径
3. 构建时，图片会自动转换为 AVIF 格式以优化加载速度

> 推荐使用宽度 ≥ 1920px、高宽比约 3:1 的图片作为横幅。

## 四、导航栏（nav）

```json
{
  "nav": [
    { "label": "首页", "href": "/" },
    { "label": "归档", "href": "/archives" },
    { "label": "动态", "href": "/moments" },
    { "label": "关于", "href": "/about" },
    { "label": "友链", "href": "/friends" }
  ]
}
```

导航链接支持内部路径和外部 URL。顺序即为页面上的显示顺序。

可用的内置页面路径：

| 路径 | 说明 |
|------|------|
| `/` | 首页（文章列表） |
| `/archives` | 归档页（按时间分组） |
| `/moments` | 动态页 |
| `/about` | 关于页 |
| `/friends` | 友链页 |

如果你添加了外部链接（如 `https://github.com/xxx`），它会自动在新标签页打开。

## 五、侧边栏个人信息（profile）

```json
{
  "profile": {
    "avatar": "./contents/avatar.png",
    "avatarLink": "/about",
    "name": "Suki",
    "bio": "一句简短的自我介绍。",
    "links": [
      {
        "name": "GitHub",
        "icon": "fa6-brands:github",
        "url": "https://github.com/5uki"
      }
    ]
  }
}
```

### 社交链接图标

`icon` 字段使用 [Iconify](https://icon-sets.iconify.design/) 的图标标识符。Tsuki 默认安装了以下图标集：

- `fa6-brands` — Font Awesome 品牌图标
- `fa6-solid` — Font Awesome 实心图标
- `material-symbols` — Google Material 图标

常用图标示例：

```json
{ "name": "GitHub",   "icon": "fa6-brands:github",   "url": "..." },
{ "name": "Twitter",  "icon": "fa6-brands:x-twitter", "url": "..." },
{ "name": "Telegram", "icon": "fa6-brands:telegram",  "url": "..." },
{ "name": "Email",    "icon": "fa6-solid:envelope",    "url": "mailto:..." },
{ "name": "RSS",      "icon": "fa6-solid:rss",         "url": "/rss.xml" }
```

## 六、公告栏（announcement）

```json
{
  "announcement": {
    "enable": true,
    "title": "模板公告",
    "content": "你可以在 tsuki.config.json 中修改这里的文案与链接。",
    "link": {
      "enable": true,
      "text": "查看详情",
      "url": "/about"
    }
  }
}
```

公告栏显示在侧边栏顶部，适合展示重要通知。设置 `enable: false` 可以隐藏。

## 七、友链（friends）

```json
{
  "friends": [
    {
      "name": "友人的博客",
      "url": "https://friend.example.com",
      "avatar": "https://friend.example.com/avatar.png",
      "description": "一位有趣的朋友"
    }
  ]
}
```

友链会展示在 `/friends` 页面。每个友链可以配置名称、链接、头像和描述。

## 八、关于页

关于页的内容在 `contents/about.md` 中编辑，支持完整的 Markdown 语法：

```markdown
---
title: 关于我
---

## 你好 👋

我是一个喜欢折腾技术的人...

## 这个博客

使用 Tsuki 模板搭建，部署在 Cloudflare 上。
```

## 九、环境变量

对于需要保密的配置（如 OAuth 密钥），请使用环境变量而非写在配置文件中：

### 前端环境变量

| 变量名 | 说明 |
|--------|------|
| `PUBLIC_TSUKI_API_BASE` | API 基础地址，如 `https://api.example.com/v1` |

### 后端密钥（通过 `wrangler secret put` 设置）

| 密钥名 | 说明 |
|--------|------|
| `GITHUB_OAUTH_CLIENT_SECRET` | GitHub OAuth Client Secret |
| `TSUKI_SESSION_SECRET` | 会话签名密钥 |
| `TSUKI_CSRF_SALT` | CSRF 盐值 |
| `CF_TURNSTILE_SECRET_KEY` | Cloudflare Turnstile 密钥（可选，用于评论反垃圾） |

> ⚠️ 以 `PUBLIC_` 开头的变量会被打包到前端代码中，**绝对不要在其中放敏感信息**。

## 十、配置生效

修改 `tsuki.config.json` 后：

- **本地开发**：保存文件后自动热重载
- **生产环境**：需要重新部署（推送到 GitHub 触发自动构建，或手动执行 `bun run build`）

下一步可以阅读[《Markdown 写作指南》](/posts/markdown-writing-guide)，了解 Tsuki 支持的所有富文本功能。
