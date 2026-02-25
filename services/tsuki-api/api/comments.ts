/**
 * Comments 路由
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'
import { AppError } from '@contracts/errors'
import { requireAuth } from './middleware/guards'
import { csrfMiddleware } from './middleware/csrf'
import { etagMiddleware } from './middleware/etag'
import { createIdempotencyMiddleware } from './middleware/idempotency'
import {
  listPublicComments,
  listAdminComments,
  createComment,
  editComment,
  deleteComment,
  hideComment,
  unhideComment,
  pinComment,
  unpinComment,
  adminDeleteComment,
} from '@usecases/comments'
import { createNotification } from '@usecases/notifications'

export function commentsRoutes() {
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()
  const idempotencyMiddleware = createIdempotencyMiddleware(
    (c) =>
      (c as { get: <K extends keyof AppContext>(key: K) => AppContext[K] }).get('ports').idempotency
  )

  // 获取评论列表（公开）
  router.get('/', etagMiddleware, async (c) => {
    const targetType = c.req.query('target_type')
    const targetId = c.req.query('target_id')

    if (!targetType || !targetId) {
      throw new AppError('VALIDATION_FAILED', 'target_type and target_id are required', {
        field: 'target_type',
        reason: 'REQUIRED',
      })
    }

    if (targetType !== 'post' && targetType !== 'moment') {
      throw new AppError('VALIDATION_FAILED', 'target_type must be "post" or "moment"', {
        field: 'target_type',
        reason: 'INVALID',
      })
    }

    const limitParam = c.req.query('limit')
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 50) : 20
    const cursor = c.req.query('cursor') || null

    const ports = c.get('ports')

    const data = await listPublicComments({
      targetType,
      targetId,
      limit,
      cursor,
      commentsPort: ports.comments,
    })

    c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    return c.json({ ok: true, data })
  })

  // 发表评论（需要登录 + CSRF + 可选幂等）
  router.post('/', requireAuth, csrfMiddleware, idempotencyMiddleware, async (c) => {
    const body = await c.req.json<{
      target_type?: string
      target_id?: string
      parent_id?: string | null
      body_markdown?: string
      turnstile_token?: string
    }>()

    if (!body.target_type || !body.target_id || !body.body_markdown) {
      throw new AppError(
        'VALIDATION_FAILED',
        'target_type, target_id, and body_markdown are required',
        {
          field: 'body',
          reason: 'REQUIRED',
        }
      )
    }

    if (body.target_type !== 'post' && body.target_type !== 'moment') {
      throw new AppError('VALIDATION_FAILED', 'target_type must be "post" or "moment"', {
        field: 'target_type',
        reason: 'INVALID',
      })
    }

    // Turnstile verification (if configured)
    const turnstilePort = c.get('ports').turnstile
    if (turnstilePort) {
      if (!body.turnstile_token) {
        throw new AppError('TURNSTILE_FAILED', 'Turnstile token is required')
      }
      const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
      const ok = await turnstilePort.verify(body.turnstile_token, ip)
      if (!ok) {
        throw new AppError('TURNSTILE_FAILED', 'Turnstile verification failed')
      }
    }

    const currentUser = c.get('currentUser')
    if (!currentUser) throw new AppError('AUTH_REQUIRED', 'Login required')
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
    const ua = c.req.header('User-Agent') || 'unknown'
    const ports = c.get('ports')

    const data = await createComment({
      targetType: body.target_type,
      targetId: body.target_id,
      parentId: body.parent_id ?? null,
      bodyMarkdown: body.body_markdown,
      currentUser,
      ip,
      ua,
      hashSalt: c.env.TSUKI_CSRF_SALT,
      commentsPort: ports.comments,
      notificationsPort: ports.notifications,
    })

    return c.json({ ok: true, data }, 201)
  })

  // 编辑评论（需要登录 + CSRF）
  router.patch('/:id', requireAuth, csrfMiddleware, async (c) => {
    const commentId = c.req.param('id')
    const body = await c.req.json<{ body_markdown?: string }>()

    if (!body.body_markdown) {
      throw new AppError('VALIDATION_FAILED', 'body_markdown is required', {
        field: 'body_markdown',
        reason: 'REQUIRED',
      })
    }

    const currentUser = c.get('currentUser')
    if (!currentUser) throw new AppError('AUTH_REQUIRED', 'Login required')
    const ports = c.get('ports')

    const data = await editComment({
      commentId,
      bodyMarkdown: body.body_markdown,
      currentUser,
      commentsPort: ports.comments,
    })

    return c.json({ ok: true, data })
  })

  // 删除评论（需要登录 + CSRF）
  router.delete('/:id', requireAuth, csrfMiddleware, async (c) => {
    const commentId = c.req.param('id')
    const currentUser = c.get('currentUser')
    if (!currentUser) throw new AppError('AUTH_REQUIRED', 'Login required')
    const ports = c.get('ports')

    await deleteComment({
      commentId,
      currentUser,
      commentsPort: ports.comments,
    })

    return c.json({ ok: true, data: null })
  })

  return router
}

export function adminCommentsRoutes() {
  return _adminCommentsRoutes()
}

/**
 * 管理员评论路由（单独导出，由 routes.ts 挂载到 /admin/comments）
 */
function _adminCommentsRoutes() {
  // Note: requireAdmin guard is applied at route-group level in routes.ts
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()

  // 管理员评论列表
  router.get('/', async (c) => {
    const limitParam = c.req.query('limit')
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 50) : 20
    const cursor = c.req.query('cursor') || null
    const targetType = c.req.query('target_type') as 'post' | 'moment' | undefined
    const targetId = c.req.query('target_id')
    const status = c.req.query('status') as
      | 'visible'
      | 'hidden'
      | 'deleted_by_user'
      | 'deleted_by_admin'
      | undefined

    const ports = c.get('ports')

    const data = await listAdminComments({
      limit,
      cursor,
      targetType: targetType || undefined,
      targetId: targetId || undefined,
      status: status || undefined,
      commentsPort: ports.comments,
    })

    return c.json({ ok: true, data })
  })

  // 隐藏评论
  router.post('/:id/hide', csrfMiddleware, async (c) => {
    const commentId = c.req.param('id')
    const ports = c.get('ports')
    const comment = await ports.comments.getById(commentId)

    await hideComment({
      commentId,
      commentsPort: ports.comments,
    })

    if (comment) {
      await createNotification({
        userId: comment.author_user_id,
        type: 'comment_hidden',
        actorId: c.get('currentUser')?.id ?? null,
        commentId,
        targetType: comment.target_type,
        targetId: comment.target_id,
        notificationsPort: ports.notifications,
      }).catch(() => {})
    }

    return c.json({ ok: true, data: null })
  })

  // 恢复评论
  router.post('/:id/unhide', csrfMiddleware, async (c) => {
    const commentId = c.req.param('id')
    const ports = c.get('ports')

    await unhideComment({
      commentId,
      commentsPort: ports.comments,
    })

    return c.json({ ok: true, data: null })
  })

  // 置顶评论
  router.post('/:id/pin', csrfMiddleware, async (c) => {
    const commentId = c.req.param('id')
    const ports = c.get('ports')
    const comment = await ports.comments.getById(commentId)

    await pinComment({
      commentId,
      commentsPort: ports.comments,
    })

    if (comment) {
      await createNotification({
        userId: comment.author_user_id,
        type: 'comment_pinned',
        actorId: c.get('currentUser')?.id ?? null,
        commentId,
        targetType: comment.target_type,
        targetId: comment.target_id,
        notificationsPort: ports.notifications,
      }).catch(() => {})
    }

    return c.json({ ok: true, data: null })
  })

  // 取消置顶
  router.post('/:id/unpin', csrfMiddleware, async (c) => {
    const commentId = c.req.param('id')
    const ports = c.get('ports')

    await unpinComment({
      commentId,
      commentsPort: ports.comments,
    })

    return c.json({ ok: true, data: null })
  })

  // 管理员删除评论
  router.delete('/:id', csrfMiddleware, async (c) => {
    const commentId = c.req.param('id')
    const ports = c.get('ports')
    const comment = await ports.comments.getById(commentId)

    await adminDeleteComment({
      commentId,
      commentsPort: ports.comments,
    })

    if (comment) {
      await createNotification({
        userId: comment.author_user_id,
        type: 'comment_deleted',
        actorId: c.get('currentUser')?.id ?? null,
        commentId,
        targetType: comment.target_type,
        targetId: comment.target_id,
        notificationsPort: ports.notifications,
      }).catch(() => {})
    }

    return c.json({ ok: true, data: null })
  })

  return router
}
