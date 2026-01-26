/**
 * Moments 路由
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'

export function momentsRoutes() {
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()

  // 获取时间线（公开）
  router.get('/', (c) => {
    // TODO: M2 实现动态列表
    return c.json({
      ok: true,
      data: { items: [], next_cursor: null },
    })
  })

  // 获取动态详情（公开）
  router.get('/:id', (c) => {
    const id = c.req.param('id')
    // TODO: M2 实现动态详情
    return c.json({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: `Moment "${id}" not found`,
        request_id: c.get('requestId'),
        details: null,
      },
    }, 404)
  })

  return router
}
