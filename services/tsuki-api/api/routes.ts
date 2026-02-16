/**
 * L2 API Layer - 路由聚合
 *
 * 职责：协议编解码、鉴权、参数校验、错误映射
 * 禁止：实现任何业务规则/领域判断
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'
import { authRoutes } from './auth'
import { postsRoutes } from './posts'
import { momentsRoutes } from './moments'
import { commentsRoutes } from './comments'
import { tagsRoutes } from './tags'
import { groupsRoutes } from './groups'
import { settingsRoutes } from './settings'

export function createRoutes() {
  const api = new Hono<{ Bindings: Env; Variables: AppContext }>()
  // 挂载各模块路由
  api.route('/auth', authRoutes())
  api.route('/posts', postsRoutes())
  api.route('/moments', momentsRoutes())
  api.route('/comments', commentsRoutes())
  api.route('/tags', tagsRoutes())
  api.route('/groups', groupsRoutes())
  api.route('/settings', settingsRoutes())

  // 健康检查
  api.get('/health', (c) => {
    return c.json({ ok: true, data: { status: 'healthy' } })
  })

  return api
}

export * from './auth'
export * from './posts'
export * from './moments'
export * from './comments'
export * from './tags'
export * from './groups'
export * from './settings'
