/**
 * Auth 路由
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'

export function authRoutes() {
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()

  // 开始 GitHub OAuth
  router.get('/github/start', (c) => {
    const returnTo = c.req.query('return_to') || '/'
    // TODO: M4 实现完整 OAuth 流程
    return c.json({
      ok: true,
      data: { message: 'OAuth not implemented yet', return_to: returnTo },
    })
  })

  // GitHub OAuth 回调
  router.get('/github/callback', (c) => {
    // TODO: M4 实现完整 OAuth 流程
    return c.json({
      ok: true,
      data: { message: 'OAuth callback not implemented yet' },
    })
  })

  // 获取当前用户
  router.get('/me', (c) => {
    // TODO: M4 实现会话验证
    return c.json({ ok: true, data: null })
  })

  // 退出登录
  router.post('/logout', (c) => {
    // TODO: M4 实现退出登录
    return c.json({ ok: true, data: { message: 'Logged out' } })
  })

  return router
}
