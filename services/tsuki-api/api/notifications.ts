/**
 * Notifications 路由
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'
import { AppError } from '@contracts/errors'
import { requireAuth } from './middleware/guards'
import { csrfMiddleware } from './middleware/csrf'
import { listNotifications, getUnreadCount, markAsRead } from '@usecases/notifications'

export function notificationsRoutes() {
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()

  // 获取通知列表
  router.get('/', requireAuth, async (c) => {
    const currentUser = c.get('currentUser')
    if (!currentUser) throw new AppError('AUTH_REQUIRED', 'Login required')

    const limitParam = c.req.query('limit')
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 50) : 20
    const cursor = c.req.query('cursor') || null

    const ports = c.get('ports')
    const data = await listNotifications({
      userId: currentUser.id,
      limit,
      cursor,
      notificationsPort: ports.notifications,
      usersPort: ports.users,
    })

    return c.json({ ok: true, data })
  })

  // 获取未读数量
  router.get('/unread-count', requireAuth, async (c) => {
    const currentUser = c.get('currentUser')
    if (!currentUser) throw new AppError('AUTH_REQUIRED', 'Login required')

    const ports = c.get('ports')
    const count = await getUnreadCount({
      userId: currentUser.id,
      notificationsPort: ports.notifications,
    })

    return c.json({ ok: true, data: { count } })
  })

  // 标记已读
  router.post('/mark-read', requireAuth, csrfMiddleware, async (c) => {
    const currentUser = c.get('currentUser')
    if (!currentUser) throw new AppError('AUTH_REQUIRED', 'Login required')

    const body = await c.req.json<{ ids?: string[] }>().catch((): { ids?: string[] } => ({}))

    const ports = c.get('ports')
    await markAsRead({
      userId: currentUser.id,
      ids: body.ids,
      notificationsPort: ports.notifications,
    })

    return c.json({ ok: true, data: null })
  })

  return router
}
