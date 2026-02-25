/**
 * Worker 环境变量类型
 */

import type {
  SettingsPort,
  UsersPort,
  SessionPort,
  GitHubOAuthPort,
  CommentsPort,
  IdempotencyPort,
  GitHubRepoPort,
  TurnstilePort,
  DraftsPort,
  NotificationsPort,
} from './ports'
import type { UserDTO } from './dto'

export interface Env {
  // D1 数据库绑定
  DB: D1Database

  // 环境变量（必填）
  TSUKI_PUBLIC_ORIGIN: string
  GITHUB_OAUTH_CLIENT_ID: string
  GITHUB_OAUTH_CLIENT_SECRET: string
  TSUKI_SESSION_SIGNING_SECRET: string
  TSUKI_CSRF_SALT: string
  TSUKI_ADMIN_GITHUB_IDS: string
  TSUKI_SESSION_TTL_MS: string

  // 环境变量（可选 - Admin 功能）
  GITHUB_TOKEN?: string
  GITHUB_REPO_OWNER?: string
  GITHUB_REPO_NAME?: string
  CF_TURNSTILE_SECRET_KEY?: string
}

/**
 * 应用上下文（通过 Hono c.set/c.get 传递）
 */
export interface AppContext {
  requestId: string
  ports: {
    settings: SettingsPort
    users: UsersPort
    sessions: SessionPort
    githubOAuth: GitHubOAuthPort
    comments: CommentsPort
    idempotency: IdempotencyPort
    githubRepo: GitHubRepoPort | null
    turnstile: TurnstilePort | null
    drafts: DraftsPort
    notifications: NotificationsPort
  }
  currentUser: UserDTO | null
}
