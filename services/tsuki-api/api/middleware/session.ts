/**
 * Session 中间件
 * 解析 tsuki_session Cookie，验证 session，将 currentUser 注入 AppContext
 * 可选中间件：不强制登录，只在有 cookie 时填充 user
 */

import { createMiddleware } from 'hono/factory'
import type { Env, AppContext } from '@contracts/env'
import { getCurrentUser } from '@usecases/auth'

/**
 * 从 Cookie 头中解析指定 cookie 值
 */
function parseCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match?.[1] ?? null
}

/**
 * 可选 session 中间件：有 cookie 则解析用户，无 cookie 则 currentUser = null
 */
export const sessionMiddleware = createMiddleware<{
  Bindings: Env
  Variables: AppContext
}>(async (c, next) => {
  const cookieHeader = c.req.header('Cookie')
  const sessionId = parseCookie(cookieHeader, 'tsuki_session')

  const user = await getCurrentUser({
    sessionId,
    sessionPort: c.get('ports').sessions,
    usersPort: c.get('ports').users,
  })

  c.set('currentUser', user)
  await next()
})

export { parseCookie }
