/**
 * Settings 路由
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'
import { getPublicSettings } from '@usecases/settings'
import { etagMiddleware } from './middleware/etag'

export function settingsRoutes() {
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()

  // 获取公开配置（公开）
  router.get('/public', etagMiddleware, async (c) => {
    const data = await getPublicSettings({
      settingsPort: c.get('ports').settings,
    })

    return c.json({
      ok: true,
      data,
    })
  })

  return router
}
