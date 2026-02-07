/**
 * L1 Entry Layer - Worker 入口
 *
 * 功能概述:
 * Cloudflare Worker 的启动入口,负责全局配置和依赖装配。
 *
 * 职责:
 * - 唯一启动入口与装配根
 * - 配置加载、依赖装配(DI)
 * - 生命周期管理
 * - 全局异常捕获
 *
 * 禁止:
 * - 实现任何业务逻辑
 *
 * 核心组件:
 * 1. Hono 应用实例 - Web 框架
 * 2. 中间件链 - 日志、CORS、上下文装配
 * 3. 路由挂载 - API 路由
 * 4. 错误处理 - 全局异常捕获
 *
 * 设计模式:
 * - 依赖注入模式: 通过上下文装配依赖
 * - 中间件模式: 使用 Hono 中间件链
 * - 单例模式: 应用实例全局唯一
 *
 * 性能优化点:
 * - 使用 crypto.randomUUID() 生成请求 ID,性能优于 Math.random()
 * - CORS 配置缓存,避免重复计算
 * - 错误处理统一,避免重复代码
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
