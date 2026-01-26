/**
 * Worker 环境变量类型
 */

export interface Env {
  // D1 数据库绑定
  DB: D1Database

  // 环境变量
  GITHUB_OAUTH_CLIENT_ID?: string
  GITHUB_OAUTH_CLIENT_SECRET?: string
  TSUKI_SESSION_SIGNING_SECRET?: string
  TSUKI_CSRF_SALT?: string
  TSUKI_PUBLIC_ORIGIN: string
  TSUKI_ADMIN_GITHUB_IDS?: string
  TSUKI_SESSION_TTL_MS?: string
}

/**
 * 应用上下文（通过 Hono c.set/c.get 传递）
 */
export interface AppContext {
  requestId: string
}
