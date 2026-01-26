/**
 * Settings 路由
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'

export function settingsRoutes() {
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()

  // 获取公开配置（公开）
  router.get('/public', (c) => {
    // 返回默认配置
    return c.json({
      ok: true,
      data: {
        site_title: 'Tsuki',
        site_description: '一个认真写字的地方',
        default_theme: 'paper',
        nav_links: [
          { label: '文章', href: '/posts' },
          { label: '动态', href: '/moments' },
          { label: '标签', href: '/tags' },
          { label: '分组', href: '/groups' },
        ],
      },
    })
  })

  return router
}
