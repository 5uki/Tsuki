/**
 * L1 Entry Layer - Worker 入口
 *
 * 职责：启动配置、依赖装配(DI)、全局异常捕获
 * 禁止：实现任何业务逻辑
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createRoutes } from '@api/routes'
import type { Env, AppContext } from '@contracts/env'
import { createSettingsAdapter } from '@adapters/settings'

const app = new Hono<{ Bindings: Env; Variables: AppContext }>()

// 全局中间件：日志
app.use('*', logger())

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

// 上下文装配
app.use('*', async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  c.set('ports', {
    settings: createSettingsAdapter(c.env.DB),
  })
  await next()
})

// 挂载路由
app.route('/v1', createRoutes())

// 全局错误处理
app.onError((err, c) => {
  const requestId = c.get('requestId') || 'unknown'
  console.error(`[${requestId}] Error:`, err)

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
