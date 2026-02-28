/**
 * Setup API 路由
 *
 * 提供首次配置的 API 端点，挂载到 /v1/setup。
 * 无需认证（鸡蛋问题：OAuth 还没配置时无法认证）。
 * Setup guard 保证只有未初始化时才能执行 initialize。
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'
import { createConfigStore } from '@adapters/config-store'

export function setupRoutes() {
  const app = new Hono<{ Bindings: Env; Variables: AppContext }>()

  // GET /v1/setup/status - 检查初始化状态
  app.get('/status', async (c) => {
    const config = c.get('resolvedConfig')
    return c.json({ ok: true, data: { initialized: config.isInitialized } })
  })

  // POST /v1/setup/initialize - 保存配置到 D1
  app.post('/initialize', async (c) => {
    const config = c.get('resolvedConfig')
    if (config.isInitialized) {
      return c.json(
        {
          ok: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Already initialized. Use wrangler secret to update config.',
          },
        },
        403
      )
    }

    const body = await c.req.json<{
      github_oauth_client_id?: string
      github_oauth_client_secret?: string
      admin_github_ids?: string
      public_origin?: string
      github_token?: string
      cf_turnstile_secret_key?: string
    }>()

    // 验证必填字段
    const required = {
      github_oauth_client_id: body.github_oauth_client_id?.trim(),
      github_oauth_client_secret: body.github_oauth_client_secret?.trim(),
      admin_github_ids: body.admin_github_ids?.trim(),
      public_origin: body.public_origin?.trim(),
    }

    const missing = Object.entries(required)
      .filter(([, v]) => !v)
      .map(([k]) => k)

    if (missing.length > 0) {
      return c.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: `Missing required fields: ${missing.join(', ')}`,
            details: { missing },
          },
        },
        400
      )
    }

    // 自动生成 session secret 和 csrf salt
    const sessionSecret = crypto.randomUUID() + crypto.randomUUID()
    const csrfSalt = crypto.randomUUID() + crypto.randomUUID()

    const store = createConfigStore(c.env.DB)
    const entries: Record<string, string> = {
      GITHUB_OAUTH_CLIENT_ID: required.github_oauth_client_id!,
      GITHUB_OAUTH_CLIENT_SECRET: required.github_oauth_client_secret!,
      TSUKI_ADMIN_GITHUB_IDS: required.admin_github_ids!,
      TSUKI_PUBLIC_ORIGIN: required.public_origin!,
      TSUKI_SESSION_SIGNING_SECRET: sessionSecret,
      TSUKI_CSRF_SALT: csrfSalt,
    }

    // 可选字段
    if (body.github_token?.trim()) {
      entries.GITHUB_TOKEN = body.github_token.trim()
    }
    if (body.cf_turnstile_secret_key?.trim()) {
      entries.CF_TURNSTILE_SECRET_KEY = body.cf_turnstile_secret_key.trim()
    }

    await store.setMulti(entries)

    return c.json({
      ok: true,
      data: { message: 'Setup complete. You can now use Tsuki.' },
    })
  })

  return app
}
