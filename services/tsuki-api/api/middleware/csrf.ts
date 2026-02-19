/**
 * CSRF 中间件
 * 双提交 Cookie：Cookie tsuki_csrf 与 Header X-CSRF-Token 必须一致
 */

import { createMiddleware } from 'hono/factory'
import type { Env, AppContext } from '@contracts/env'
import { AppError } from '@contracts/errors'
import { parseCookie } from './session'

/**
 * CSRF 校验中间件 — 仅用于写接口（POST/PATCH/DELETE）
 */
export const csrfMiddleware = createMiddleware<{
  Bindings: Env
  Variables: AppContext
}>(async (c, next) => {
  const method = c.req.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    await next()
    return
  }

  const cookieHeader = c.req.header('Cookie')
  const csrfCookie = parseCookie(cookieHeader, 'tsuki_csrf')
  const csrfHeader = c.req.header('X-CSRF-Token')

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    throw new AppError('FORBIDDEN', 'CSRF token mismatch')
  }

  await next()
})
