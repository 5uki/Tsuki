/**
 * Groups 路由
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'

export function groupsRoutes() {
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()

  // 获取分组列表（公开）
  router.get('/', (c) => {
    // TODO: M3 实现分组列表
    return c.json({
      ok: true,
      data: { items: [], next_cursor: null },
    })
  })

  // 获取分组详情（公开）
  router.get('/:slug', (c) => {
    const slug = c.req.param('slug')
    // TODO: M3 实现分组详情
    return c.json({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: `Group "${slug}" not found`,
        request_id: c.get('requestId'),
        details: null,
      },
    }, 404)
  })

  return router
}
