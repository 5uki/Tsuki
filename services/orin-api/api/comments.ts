/**
 * Comments 路由
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'

export function commentsRoutes() {
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()

  // 获取评论列表（公开）
  router.get('/', (c) => {
    // TODO: M4 实现评论列表
    return c.json({
      ok: true,
      data: { items: [], next_cursor: null },
    })
  })

  // 发表评论（需要登录）
  router.post('/', (c) => {
    // TODO: M4 实现发表评论
    return c.json({
      ok: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Login required',
        request_id: c.get('requestId'),
        details: null,
      },
    }, 401)
  })

  // 编辑评论（需要登录）
  router.patch('/:id', (c) => {
    // TODO: M4 实现编辑评论
    return c.json({
      ok: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Login required',
        request_id: c.get('requestId'),
        details: null,
      },
    }, 401)
  })

  // 删除评论（需要登录）
  router.delete('/:id', (c) => {
    // TODO: M4 实现删除评论
    return c.json({
      ok: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Login required',
        request_id: c.get('requestId'),
        details: null,
      },
    }, 401)
  })

  return router
}
