/**
 * Auth 守卫中间件
 * 要求用户已登录
 */

import { createMiddleware } from 'hono/factory'
import type { Env, AppContext } from '@contracts/env'
import { AppError } from '@contracts/errors'

/**
 * 要求已登录
 */
export const requireAuth = createMiddleware<{
  Bindings: Env
  Variables: AppContext
}>(async (c, next) => {
  const user = c.get('currentUser')
  if (!user) {
    throw new AppError('AUTH_REQUIRED', 'Login required')
  }
  await next()
})

/**
 * 要求管理员角色
 */
export const requireAdmin = createMiddleware<{
  Bindings: Env
  Variables: AppContext
}>(async (c, next) => {
  const user = c.get('currentUser')
  if (!user) {
    throw new AppError('AUTH_REQUIRED', 'Login required')
  }
  if (user.role !== 'admin') {
    throw new AppError('FORBIDDEN', 'Admin access required')
  }
  await next()
})
