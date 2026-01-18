# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

Always reply in Chinese (简体中文). Code identifiers, commands, logs, and error messages should remain in their original language.

## Project Overview

Orin is a full-stack blogging framework built on Cloudflare Free Plan (Pages, Workers, D1) and GitHub (OAuth, code hosting). The project is currently in the architecture/requirements phase with no implementation code yet.

**Key Documents (Single Source of Truth):**
- `REQUIREMENTS.md` - Complete feature spec, API design, database schema
- `AGENTS.md` - 6-layer architecture rules (must read before writing any code)
- `MILESTONES.md` - Phased delivery plan (M0-M7)

## Technology Stack

- **Frontend (Public)**: Astro (TypeScript), Cloudflare Pages (SSR), zero JS by default
- **Frontend (Admin)**: React (TypeScript) via Astro Islands (`client:load`)
- **Backend**: Cloudflare Workers (TypeScript), D1 (SQLite)
- **Auth**: GitHub OAuth v2 (read:user scope only)
- **Styling**: CSS Variables (design tokens with `--orin-*` prefix) + Scoped CSS

## Repository Structure

```
Orin/
├── apps/web/                    # Frontend (Astro SSR on Pages)
│   ├── entry/                   # L1: SSR entry, DI root
│   ├── api/                     # L2: Route handlers, validation
│   ├── usecases/                # L3: Page logic orchestration
│   ├── atoms/                   # L4: Pure utilities (no I/O)
│   ├── contracts/               # X1: Types, DTOs, constants
│   ├── adapters/                # X2: fetch, localStorage, cookies
│   └── src/
│       ├── pages/               # Astro pages (public routes)
│       ├── pages/admin/         # Admin routes (React Islands)
│       ├── components/          # Astro + React components
│       └── layouts/             # Astro layouts
├── services/orin-api/           # Backend (Cloudflare Workers)
│   ├── entry/                   # L1: Worker entry, DI root
│   ├── api/                     # L2: HTTP route handlers
│   ├── usecases/                # L3: Business logic
│   ├── atoms/                   # L4: Pure logic
│   ├── contracts/               # X1: DTOs, error codes
│   └── adapters/                # X2: D1, GitHub OAuth
├── migrations/d1/               # D1 migrations (0001_init.sql, ...)
└── packages/ui/                 # Optional shared theme tokens
```

## 6-Layer Architecture (Critical)

Must follow these rules from `AGENTS.md`:

| Layer | Path | Purpose | I/O Allowed |
|-------|------|---------|-------------|
| L1 Entry | `/entry` | Startup, DI assembly, lifecycle | No business logic |
| L2 API | `/api` | Protocol adaptation, auth, validation | No business rules |
| L3 Usecases | `/usecases` | Business flow orchestration | Via injected ports only |
| L4 Atoms | `/atoms` | Pure functions, ≤80 lines each | **Never** |
| X1 Contracts | `/contracts` | DTOs, types, constants | Declaration only |
| X2 Adapters | `/adapters` | **Only place with I/O** | Yes (DB, HTTP, FS) |

**Dependency Direction**: `api → usecases → atoms` (unidirectional)

**Key Prohibitions:**
- No I/O outside `/adapters`
- No business logic in `api/` or `entry/`
- No skipping layers (e.g., `api/` directly calling `atoms/`)
- Usecases must not call other usecases (extract to `atoms/` or `_shared/`)

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Frontend development
cd apps/web && pnpm dev          # Astro dev server on localhost:4321

# Backend development
cd services/orin-api && wrangler dev  # Worker on localhost:8787

# Local D1 database
wrangler d1 execute orin_db --local --file migrations/d1/0001_init.sql
wrangler d1 migrations apply orin_db --local

# Quality checks
pnpm lint
pnpm typecheck
pnpm test

# Build & Deploy
cd apps/web && pnpm build
cd services/orin-api && wrangler publish
wrangler d1 migrations apply orin_db --remote
```

## API Design Essentials

- Base URL: `https://api.<site-domain>/v1`
- Response envelope: `{ "ok": true, "data": ... }` or `{ "ok": false, "error": { "code": "...", "message": "..." } }`
- Pagination: Cursor-based (`?limit=20&cursor=<opaque>`)
- Auth: Cookie `orin_session` (HttpOnly, Secure, SameSite=Lax)
- CSRF: Double-submit cookie `orin_csrf` + header `X-CSRF-Token`

**Error Codes**: `AUTH_REQUIRED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION_FAILED` (400), `RATE_LIMITED` (429), `COMMENT_DEPTH_EXCEEDED` (400), `INTERNAL_ERROR` (500)

## Data Conventions

- All IDs: `UUIDv4` (TEXT)
- All times: Unix milliseconds (INTEGER), return both `ts` and `iso` in API
- Slugs: `a-z`, `0-9`, `-` only; no `--`, no leading/trailing `-`; length 1-64
- Booleans in DB: `INTEGER` with `CHECK (x IN (0,1))`

## Security Requirements

- All writes: Validate `Origin` against `ORIN_PUBLIC_ORIGIN`
- CSRF on all mutations: Check `X-CSRF-Token` matches `orin_csrf` cookie
- Markdown: CommonMark + tables + code blocks; no raw HTML
- Links: Only `http:`, `https:`, `mailto:` (reject `javascript:`, `data:`)
- Images: Only `https://` or `/media/` paths
- HTML output: Sanitize via allowlist, strip all `on*` attributes

## Testing Requirements

- `atoms/`: Unit tests (pure logic)
- `usecases/`: Scenario tests with mocked ports
- `api/`: Contract/route tests
- Coverage target: 70%+ branch coverage for critical flows

## Frontend Constraints

- Articles/moments must be SSR (readable without JavaScript)
- Front pages default to zero JS; use `client:visible` or `client:load` for interactive components
- 6 built-in themes: `paper`, `ink`, `nord`, `rose`, `aurora`, `mono`
- Theme preference: `localStorage` key `orin.theme`
- All colors via CSS variables, never hardcoded
- Admin pages use React components via Astro Islands

## Current Phase

Check `MILESTONES.md` for current milestone. The project follows this sequence:
- M0: Engineering skeleton and directory initialization
- M1: Frontend UI baseline (layout, themes, routing)
- M2: Moments timeline with images
- M3: Article browsing (tags, groups, search)
- M4: Login and comments
- M5: SEO (RSS, sitemap, robots.txt)
- M6: Admin backend
- M7: Hardening and performance