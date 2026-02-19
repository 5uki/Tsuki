/**
 * 端口接口定义
 * adapters 必须实现这些接口
 */

import type {
  SettingsPublicDTO,
  PaginatedResponse,
} from './dto'

/**
 * 设置端口
 */
export interface SettingsPort {
  getPublicSettings(): Promise<SettingsPublicDTO>
}

/**
 * 评论数据库记录（内部使用，不对外暴露）
 */
export interface CommentRecord {
  id: string
  target_type: 'post' | 'moment'
  target_id: string
  parent_id: string | null
  depth: number
  author_user_id: string
  body_markdown: string
  body_html: string
  status: 'visible' | 'hidden' | 'deleted_by_user' | 'deleted_by_admin'
  created_at: number
  updated_at: number
  deleted_at: number | null
  ip_hash: string
  user_agent_hash: string
}

/**
 * 评论 + 作者信息的联合查询记录
 */
export interface CommentWithAuthorRecord extends CommentRecord {
  author_id: string
  author_github_id: number
  author_login: string
  author_avatar_url: string
  author_profile_url: string
  author_role: 'user' | 'admin'
  author_created_at: number
}

/**
 * 评论端口
 */
export interface CommentsPort {
  /** 按目标分页查询评论（公开：排除 hidden） */
  listByTarget(
    targetType: 'post' | 'moment',
    targetId: string,
    limit: number,
    cursor: string | null,
    includeHidden: boolean
  ): Promise<PaginatedResponse<CommentWithAuthorRecord>>

  /** 按 ID 查询单条评论 */
  getById(id: string): Promise<CommentRecord | null>

  /** 插入评论 */
  create(input: {
    id: string
    target_type: 'post' | 'moment'
    target_id: string
    parent_id: string | null
    depth: number
    author_user_id: string
    body_markdown: string
    body_html: string
    ip_hash: string
    user_agent_hash: string
  }): Promise<CommentRecord>

  /** 更新评论内容 */
  update(id: string, bodyMarkdown: string, bodyHtml: string): Promise<void>

  /** 软删除评论 */
  softDelete(id: string, deletedBy: 'user' | 'admin'): Promise<void>

  /** 管理员隐藏评论 */
  hide(id: string): Promise<void>

  /** 管理员恢复评论 */
  unhide(id: string): Promise<void>

  /** 限速：统计用户在时间窗口内的评论数 */
  countRecentByUser(userId: string, windowMs: number): Promise<number>

  /** 限速：统计 IP 在时间窗口内的评论数 */
  countRecentByIpHash(ipHash: string, windowMs: number): Promise<number>

  /** 验证评论目标是否存在（D1-COMMENT-001） */
  targetExists(targetType: 'post' | 'moment', targetId: string): Promise<boolean>

  /** 管理员：分页查询所有评论（含筛选） */
  listAdmin(
    limit: number,
    cursor: string | null,
    filters: {
      target_type?: 'post' | 'moment'
      target_id?: string
      status?: 'visible' | 'hidden' | 'deleted_by_user' | 'deleted_by_admin'
    }
  ): Promise<PaginatedResponse<CommentWithAuthorRecord>>
}

/**
 * 用户数据库记录（内部使用，不对外暴露）
 */
export interface UserRecord {
  id: string
  github_id: number
  login: string
  avatar_url: string
  profile_url: string
  role: 'user' | 'admin'
  is_banned: number
  theme_pref: string | null
  created_at: number
  updated_at: number
  last_login_at: number
}

/**
 * 用户端口
 */
export interface UsersPort {
  getUserById(id: string): Promise<UserRecord | null>
  getUserByGithubId(githubId: number): Promise<UserRecord | null>
  upsertByGithubId(input: {
    github_id: number
    login: string
    avatar_url: string
    profile_url: string
    role: 'user' | 'admin'
  }): Promise<UserRecord>
}

/**
 * 会话端口
 */
export interface SessionPort {
  createSession(input: {
    userId: string
    ipHash: string
    uaHash: string
    ttlMs: number
  }): Promise<{ sessionId: string; csrfToken: string; expiresAt: number }>
  getValidSession(sessionId: string): Promise<{ userId: string; expiresAt: number } | null>
  revokeSession(sessionId: string): Promise<void>
}

/**
 * GitHub OAuth 端口
 */
export interface GitHubOAuthPort {
  getAuthorizationUrl(state: string): string
  exchangeCodeForToken(code: string): Promise<string>
  getGitHubUser(accessToken: string): Promise<{
    github_id: number
    login: string
    avatar_url: string
    profile_url: string
  }>
}
