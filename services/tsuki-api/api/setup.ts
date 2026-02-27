import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'
import type { SetupConfigDTO } from '@contracts/dto'
import { AppError } from '@contracts/errors'
import { getSetupStatus, saveSetupConfig } from '@usecases/setup'

export function setupRoutes() {
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()

  router.get('/status', async (c) => {
    const host = c.req.header('Host') || 'localhost'
    const proto = c.req.header('X-Forwarded-Proto') || 'https'
    const requestOrigin = `${proto}://${host}`

    const data = await getSetupStatus({
      env: c.env,
      settingsPort: c.get('ports').settings,
      requestOrigin,
    })

    return c.json({ ok: true, data })
  })

  router.post('/save', async (c) => {
    const body = await c.req.json<Partial<SetupConfigDTO>>()
    const config: SetupConfigDTO = {
      public_origin: body.public_origin?.trim() || '',
      admin_github_ids: body.admin_github_ids?.trim() || '',
      github_oauth_client_id: body.github_oauth_client_id?.trim() || '',
      github_oauth_client_secret: body.github_oauth_client_secret?.trim() || '',
      github_repo_owner: body.github_repo_owner?.trim() || '',
      github_repo_name: body.github_repo_name?.trim() || '',
      github_token: body.github_token?.trim() || '',
    }

    if (!config.public_origin) {
      throw new AppError('VALIDATION_FAILED', 'public_origin is required')
    }

    await saveSetupConfig({ settingsPort: c.get('ports').settings, config })
    const host = c.req.header('Host') || 'localhost'
    const proto = c.req.header('X-Forwarded-Proto') || 'https'
    const requestOrigin = `${proto}://${host}`
    const data = await getSetupStatus({
      env: c.env,
      settingsPort: c.get('ports').settings,
      requestOrigin,
    })

    return c.json({ ok: true, data })
  })

  return router
}
