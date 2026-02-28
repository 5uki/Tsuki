/**
 * L1 Entry Layer - Worker 入口
 *
 * 职责：启动配置、依赖装配(DI)、全局异常捕获
 * 禁止：实现任何业务逻辑
 *
 * 中间件执行顺序：
 * 1. 结构化日志     (全局)
 * 2. Setup 页面路由  GET /setup, GET /setup/* (独立，不经过 CORS/auth)
 * 3. Config 解析     /v1/* (从 env+D1 合并配置，存入 c.var)
 * 4. CORS           /v1/* (使用 resolved TSUKI_PUBLIC_ORIGIN)
 * 5. Setup Guard    /v1/* (未初始化时，只放行 /v1/setup/*，其余返回 503)
 * 6. 上下文装配      /v1/* (用 resolved config 创建所有 adapter)
 * 7. Session        /v1/* (解析 cookie)
 * 8. 业务路由        /v1
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import { createRoutes } from '@api/routes'
import { setupPageRoutes } from '@api/setup-page'
import type { Env, AppContext } from '@contracts/env'
import { AppError } from '@contracts/errors'
import { resolveConfig } from '@adapters/config-store'
import { createSettingsAdapter } from '@adapters/settings'
import { createUsersAdapter } from '@adapters/users'
import { createSessionsAdapter } from '@adapters/sessions'
import { createGitHubOAuthAdapter } from '@adapters/github-oauth'
import { createCommentsAdapter } from '@adapters/comments'
import { createIdempotencyAdapter } from '@adapters/idempotency'
import { createGitHubRepoAdapter } from '@adapters/github-repo'
import { createTurnstileAdapter } from '@adapters/turnstile'
import { createDraftsAdapter } from '@adapters/drafts'
import { createNotificationsAdapter } from '@adapters/notifications'
import { sessionMiddleware } from '@api/middleware/session'

const app = new Hono<{ Bindings: Env; Variables: AppContext }>()

// ── 1. 结构化日志中间件（全局） ──
const structuredLogger = createMiddleware<{ Bindings: Env; Variables: AppContext }>(
  async (c, next) => {
    const start = Date.now()
    await next()
    const duration = Date.now() - start
    const requestId = c.get('requestId') || '-'

    console.log(
      JSON.stringify({
        level: 'info',
        request_id: requestId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        duration_ms: duration,
        user_agent: c.req.header('User-Agent')?.slice(0, 128) || '-',
      })
    )
  }
)
app.use('*', structuredLogger)

// ── 2. Setup 页面路由（独立，不经过 CORS/auth 中间件栈） ──
app.route('/setup', setupPageRoutes())

// ── 3. Config 解析 /v1/* ──
app.use('/v1/*', async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  const config = await resolveConfig(c.env.DB, c.env)
  c.set('resolvedConfig', config)
  await next()
})

// ── 4. CORS /v1/*（使用 resolved config） ──
app.use(
  '/v1/*',
  cors({
    origin: (origin, c) => {
      const config = c.get('resolvedConfig')
      if (!config?.TSUKI_PUBLIC_ORIGIN) return origin // 未初始化时宽松处理
      const allowedOrigins = config.TSUKI_PUBLIC_ORIGIN.split(',')
        .map((s: string) => s.trim())
        .filter(Boolean)
      if (allowedOrigins.includes(origin)) {
        return origin
      }
      return null
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-CSRF-Token', 'Idempotency-Key'],
    credentials: true,
    maxAge: 86400,
  })
)

// ── 5. Setup Guard /v1/*（未初始化时只放行 /v1/setup/*） ──
app.use('/v1/*', async (c, next) => {
  const config = c.get('resolvedConfig')
  if (!config.isInitialized && !c.req.path.startsWith('/v1/setup')) {
    return c.json(
      {
        ok: false,
        error: {
          code: 'SETUP_REQUIRED',
          message: 'Complete setup at /setup',
        },
      },
      503
    )
  }
  await next()
})

// ── 6. 上下文装配 /v1/*（用 ResolvedConfig 创建 adapter） ──
app.use('/v1/*', async (c, next) => {
  const config = c.get('resolvedConfig')

  const adminGithubIds = (config.TSUKI_ADMIN_GITHUB_IDS || '')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))

  // GitHub Repo adapter (optional)
  const githubRepo =
    config.GITHUB_TOKEN && config.GITHUB_REPO_OWNER && config.GITHUB_REPO_NAME
      ? createGitHubRepoAdapter(
          config.GITHUB_TOKEN,
          config.GITHUB_REPO_OWNER,
          config.GITHUB_REPO_NAME
        )
      : null

  // Turnstile adapter (optional)
  const turnstile = config.CF_TURNSTILE_SECRET_KEY
    ? createTurnstileAdapter(config.CF_TURNSTILE_SECRET_KEY)
    : null

  c.set('ports', {
    settings: createSettingsAdapter(c.env.DB),
    users: createUsersAdapter(c.env.DB, adminGithubIds),
    sessions: createSessionsAdapter(c.env.DB),
    githubOAuth: createGitHubOAuthAdapter(
      config.GITHUB_OAUTH_CLIENT_ID,
      config.GITHUB_OAUTH_CLIENT_SECRET
    ),
    comments: createCommentsAdapter(c.env.DB),
    idempotency: createIdempotencyAdapter(c.env.DB),
    githubRepo,
    turnstile,
    drafts: createDraftsAdapter(c.env.DB),
    notifications: createNotificationsAdapter(c.env.DB),
  })

  await next()
})

// ── 7. Session 解析 /v1/*（可选，不强制登录） ──
app.use('/v1/*', sessionMiddleware)

// ── 8. 挂载业务路由 ──
app.route('/v1', createRoutes())

// 全局错误处理
app.onError((err, c) => {
  const requestId = c.get('requestId') || 'unknown'

  if (err instanceof AppError) {
    if (err.status >= 500) {
      console.error(
        JSON.stringify({
          level: 'error',
          request_id: requestId,
          code: err.code,
          message: err.message,
          stack: err.stack?.slice(0, 500),
        })
      )
    }
    return c.json(
      {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          request_id: requestId,
          details: err.details,
        },
      },
      err.status as 400 | 401 | 403 | 404 | 429 | 500
    )
  }

  console.error(
    JSON.stringify({
      level: 'error',
      request_id: requestId,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 500) : undefined,
    })
  )

  return c.json(
    {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        request_id: requestId,
        details: null,
      },
    },
    500
  )
})

// 404 处理
app.notFound((c) => {
  const requestId = c.get('requestId') || 'unknown'
  return c.json(
    {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        request_id: requestId,
        details: null,
      },
    },
    404
  )
})

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    // Scheduled handler 同样使用 resolveConfig()
    const resolved = await resolveConfig(env.DB, env)
    if (!resolved.isInitialized) return

    const draftsPort = createDraftsAdapter(env.DB)
    const githubRepoPort =
      resolved.GITHUB_TOKEN && resolved.GITHUB_REPO_OWNER && resolved.GITHUB_REPO_NAME
        ? createGitHubRepoAdapter(
            resolved.GITHUB_TOKEN,
            resolved.GITHUB_REPO_OWNER,
            resolved.GITHUB_REPO_NAME
          )
        : null

    if (!githubRepoPort) {
      console.log(
        JSON.stringify({
          level: 'warn',
          message: 'Scheduled: GitHub Repo not configured, skipping',
        })
      )
      return
    }

    const { publishScheduledDrafts } = await import('@usecases/admin-drafts')
    const count = await publishScheduledDrafts({ draftsPort, githubRepoPort })
    if (count > 0) {
      console.log(
        JSON.stringify({ level: 'info', message: `Scheduled: published ${count} draft(s)` })
      )
    }
  },
}
