/**
 * Auth 路由
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'
import { AppError } from '@contracts/errors'
import { startGithubOAuth, handleGithubCallback, logout } from '@usecases/auth'
import { parseCookie } from './middleware/session'

export function authRoutes() {
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()

  // 开始 GitHub OAuth
  router.get('/github/start', (c) => {
    const returnTo = c.req.query('return_to') || '/'
    const ports = c.get('ports')

    const result = startGithubOAuth({
      returnTo,
      oauthPort: ports.githubOAuth,
    })

    // 将 state 和 return_to 存入短时 Cookie（供 callback 校验）
    const stateCookie = JSON.stringify({
      state: result.state,
      returnTo: result.returnTo,
    })
    const encodedState = encodeURIComponent(stateCookie)

    c.header(
      'Set-Cookie',
      `tsuki_oauth_state=${encodedState}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    )

    return c.redirect(result.authorizationUrl, 302)
  })

  // GitHub OAuth 回调
  router.get('/github/callback', async (c) => {
    const code = c.req.query('code')
    const stateParam = c.req.query('state')

    if (!code || !stateParam) {
      throw new AppError('VALIDATION_FAILED', 'Missing code or state parameter', {
        field: 'code',
        reason: 'REQUIRED',
      })
    }

    // 从 Cookie 中读取预存的 state
    const cookieHeader = c.req.header('Cookie')
    const oauthStateCookie = parseCookie(cookieHeader, 'tsuki_oauth_state')

    if (!oauthStateCookie) {
      throw new AppError('FORBIDDEN', 'OAuth state cookie missing')
    }

    let storedData: { state: string; returnTo: string }
    try {
      storedData = JSON.parse(decodeURIComponent(oauthStateCookie))
    } catch {
      throw new AppError('FORBIDDEN', 'Invalid OAuth state cookie')
    }

    // 提取 IP 和 UA（由 usecase 层负责哈希）
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
    const ua = c.req.header('User-Agent') || 'unknown'

    const sessionTtlMs = parseInt(c.env.TSUKI_SESSION_TTL_MS, 10) || 1209600000
    const ports = c.get('ports')

    const result = await handleGithubCallback({
      code,
      state: stateParam,
      expectedState: storedData.state,
      returnTo: storedData.returnTo,
      ip,
      ua,
      hashSalt: c.env.TSUKI_CSRF_SALT,
      sessionTtlMs,
      oauthPort: ports.githubOAuth,
      usersPort: ports.users,
      sessionPort: ports.sessions,
    })

    // 设置 Cookie
    const maxAge = Math.floor((result.expiresAt - Date.now()) / 1000)
    const sessionCookie = `tsuki_session=${result.sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`
    const csrfCookie = `tsuki_csrf=${result.csrfToken}; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`
    // 清除 OAuth state cookie
    const clearOAuthCookie = 'tsuki_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'

    c.header('Set-Cookie', sessionCookie, { append: true })
    c.header('Set-Cookie', csrfCookie, { append: true })
    c.header('Set-Cookie', clearOAuthCookie, { append: true })

    // 重定向到前端域名（API 与前端跨域，return_to 是前端路径）
    const frontendOrigin = c.env.TSUKI_PUBLIC_ORIGIN
    return c.redirect(`${frontendOrigin}${result.returnTo}`, 302)
  })

  // 获取当前用户
  router.get('/me', async (c) => {
    const user = c.get('currentUser')
    return c.json({ ok: true, data: user })
  })

  // 退出登录
  router.post('/logout', async (c) => {
    const cookieHeader = c.req.header('Cookie')
    const sessionId = parseCookie(cookieHeader, 'tsuki_session')
    const ports = c.get('ports')

    await logout({ sessionId, sessionPort: ports.sessions })

    // 清除所有相关 Cookie
    c.header('Set-Cookie', 'tsuki_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0', {
      append: true,
    })
    c.header('Set-Cookie', 'tsuki_csrf=; Secure; SameSite=Lax; Path=/; Max-Age=0', {
      append: true,
    })

    return c.json({ ok: true, data: null })
  })

  return router
}
