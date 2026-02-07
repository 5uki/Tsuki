/**
 * L2 API Layer - HTTP 路由与协议适配
 *
 * 功能概述:
 * 负责所有 HTTP 路由的定义和挂载,是 API 层的统一入口。
 *
 * 职责:
 * - 协议编解码
 * - 鉴权/门禁
 * - 参数校验
 * - 错误映射
 *
 * 禁止:
 * - 实现任何业务规则/领域判断
 * - 直接编排原子
 *
 * 路由模块:
 * - /auth: 认证相关路由
 * - /posts: 文章相关路由
 * - /moments: 动态相关路由
 * - /comments: 评论相关路由
 * - /tags: 标签相关路由
 * - /groups: 分组相关路由
 * - /settings: 设置相关路由
 *
 * 设计模式:
 * - 模块化路由: 每个功能模块独立管理路由
 * - 路由聚合: 统一挂载到 /v1 前缀
 * - 健康检查: 提供 /health 端点用于监控
 *
 * 性能优化点:
 * - 路由按模块分离,减少单文件复杂度
 * - 使用 Hono 的路由缓存机制
 * - 健康检查端点轻量化,快速响应
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
