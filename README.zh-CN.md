# Tsuki

[English README](./README.md)

Tsuki 是一个面向 Cloudflare 部署的博客模板（Astro + Workers），目标是“可直接上线”，而不是仅用于演示。

## 模板包含内容

- **前端站点**：`apps/web`（Astro）
- **API 服务**：`services/tsuki-api`（Cloudflare Workers）
- **内容目录**：`contents/`（文章、动态、图片素材）
- **后台壳**：`apps/admin`（轻量 React 页面）

## 快速开始

### 1）安装依赖

```bash
pnpm install
```

### 2）启动开发环境

```bash
pnpm dev
```

### 3）构建

```bash
pnpm build
```

## Cloudflare 部署概览

### Web（Pages）

建议构建配置：

- Build command：`pnpm -C apps/web build`
- Build output directory：`dist`
- Root directory：仓库根目录

### API（Workers）

使用 Wrangler 部署 `services/tsuki-api`，并按环境注入密钥。

## 环境变量说明

前端常用：

- `PUBLIC_TSUKI_API_BASE`：API 基础地址（如 `https://api.example.com/v1`）

后端请使用 secret（不要提交到仓库）：

- OAuth Client Secret
- Session 签名密钥
- CSRF Salt

## 内容组织

- 文章：`contents/posts/*.md`
- 动态：`contents/moments/*.md`
- 关于页：`contents/about.md`

文章文件名即 slug，建议使用有语义的命名，例如：

- `cloudflare-pages-deployment-playbook.md`
- `cloudflare-worker-api-configuration.md`

## 质量校验命令

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## 许可说明

如果你将模板用于公开项目，建议保留来源说明，或根据团队规范补充独立 LICENSE 文件。
