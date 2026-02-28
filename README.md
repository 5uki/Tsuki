# Tsuki

[中文文档（README.zh-CN.md）](./README.zh-CN.md)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/5uki/Tsuki)

Tsuki is a Cloudflare-first blogging template built with Astro + Workers.
It is designed for real deployment, not demo-only usage.

## One-Click Deploy

1. Click the **Deploy to Cloudflare** button above
2. It will fork the repo and trigger the GitHub Actions deploy workflow
3. Set `CF_API_TOKEN` and `CF_ACCOUNT_ID` as repository secrets
4. The workflow creates a D1 database, runs migrations, and deploys Worker + Pages
5. Visit your Worker URL at `/setup` to complete first-time configuration (GitHub OAuth, Admin ID)
6. Done! Your blog is live

## What this template includes

- **Web app**: `apps/web` (Astro)
- **API service**: `services/tsuki-api` (Cloudflare Workers)
- **Content source**: `contents/` (posts, moments, assets)
- **Admin shell**: `apps/admin` (lightweight React shell page)

## Quick start

### 1) Install dependencies

```bash
pnpm install
```

### 2) Run development servers

```bash
pnpm dev
```

### 3) Build

```bash
pnpm build
```

## Cloudflare deployment overview

### Web (Pages)

Recommended build settings:

- Build command: `pnpm -C apps/web build`
- Build output directory: `dist`
- Root directory: repository root

### API (Workers)

Deploy `services/tsuki-api` with Wrangler and configure secrets in each environment.

## Environment variables

For web:

- `PUBLIC_TSUKI_API_BASE`: public API base URL (e.g. `https://api.example.com/v1`)

For API, use secrets (never commit):

- OAuth client secrets
- Session signing keys
- CSRF salt

## Content model

- Posts: `contents/posts/*.md`
- Moments: `contents/moments/*.md`
- About page: `contents/about.md`

Post filename works as slug. Use meaningful file names such as:

- `cloudflare-pages-deployment-playbook.md`
- `cloudflare-worker-api-configuration.md`

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## License

If you use this template publicly, keep attribution or add your own LICENSE file according to your project policy.
