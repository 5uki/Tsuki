/**
 * L1 Entry Layer - Worker 入口
 *
 * 职责：启动配置、依赖装配(DI)、全局异常捕获
 * 禁止：实现任何业务逻辑
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import { createRoutes } from '@api/routes'
import type { Env, AppContext } from '@contracts/env'
import { AppError } from '@contracts/errors'
import { createSettingsAdapter } from '@adapters/settings'
import { createUsersAdapter } from '@adapters/users'
import { createSessionsAdapter } from '@adapters/sessions'
import { createGitHubOAuthAdapter } from '@adapters/github-oauth'
import { createCommentsAdapter } from '@adapters/comments'
import { createIdempotencyAdapter } from '@adapters/idempotency'
import { sessionMiddleware } from '@api/middleware/session'

const app = new Hono<{ Bindings: Env; Variables: AppContext }>()

// ── 结构化日志中间件 ──
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

// 全局中间件：CORS
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowedOrigin = c.env.TSUKI_PUBLIC_ORIGIN
      if (origin === allowedOrigin) {
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

// 上下文装配：requestId + ports
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID())

  const adminGithubIds = (c.env.TSUKI_ADMIN_GITHUB_IDS || '')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))

  c.set('ports', {
    settings: createSettingsAdapter(c.env.DB),
    users: createUsersAdapter(c.env.DB, adminGithubIds),
    sessions: createSessionsAdapter(c.env.DB),
    githubOAuth: createGitHubOAuthAdapter(
      c.env.GITHUB_OAUTH_CLIENT_ID,
      c.env.GITHUB_OAUTH_CLIENT_SECRET
    ),
    comments: createCommentsAdapter(c.env.DB),
    idempotency: createIdempotencyAdapter(c.env.DB),
  })

  await next()
})

// 全局 session 解析（可选，不强制登录）
app.use('*', sessionMiddleware)

// 挂载路由
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

export default app
