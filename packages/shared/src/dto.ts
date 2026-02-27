/**
 * 共享 DTO 类型定义
 * 前后端统一使用
 */

// 时间 DTO
export interface TimeDTO {
  ts: number
  iso: string
}

// 用户 DTO
export interface UserDTO {
  id: string
  github_id: number
  login: string
  avatar_url: string
  profile_url: string
  role: 'user' | 'admin'
  created_at: TimeDTO
}

// 标签 DTO
export interface TagDTO {
  id: string
  slug: string
  name: string
  description: string | null
}

// 分组 DTO
export interface GroupDTO {
  id: string
  slug: string
  name: string
  type: 'category' | 'series'
  description: string | null
}

// 媒体 DTO
export interface MediaDTO {
  id: string
  storage: 'static' | 'external' | 'r2'
  url: string
  mime_type: string
  size_bytes: number | null
  width: number | null
  height: number | null
  alt: string
}

// 文章摘要 DTO
export interface PostSummaryDTO {
  id: string
  slug: string
  title: string
  summary: string
  cover: MediaDTO | null
  tags: TagDTO[]
  groups: GroupDTO[]
  status: 'draft' | 'published' | 'unlisted'
  published_at: TimeDTO | null
  updated_at: TimeDTO
}

// 文章详情 DTO
export interface PostDetailDTO extends PostSummaryDTO {
  content_markdown: string
  content_html: string
  reading_time_minutes: number
}

// 动态 DTO
export interface MomentDTO {
  id: string
  body_markdown: string
  body_html: string
  media: MediaDTO[]
  tags: TagDTO[]
  status: 'published' | 'deleted'
  created_at: TimeDTO
  updated_at: TimeDTO
}

// 评论 DTO
export interface CommentDTO {
  id: string
  target_type: 'post' | 'moment'
  target_id: string
  parent_id: string | null
  depth: number
  author: UserDTO
  body_markdown: string
  body_html: string
  status: 'visible' | 'hidden' | 'deleted_by_user' | 'deleted_by_admin'
  pinned: boolean
  created_at: TimeDTO
  updated_at: TimeDTO
}

// 导航链接
export interface NavLink {
  label: string
  href: string
}

// 站点配置 DTO
export interface SettingsPublicDTO {
  site_title: string
  site_description: string
  default_theme: string
  nav_links: NavLink[]
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  next_cursor: string | null
}

// API 响应包络
export interface ApiResponse<T> {
  ok: true
  data: T
}

export interface ApiError {
  ok: false
  error: {
    code: string
    message: string
    request_id: string
    details: Record<string, unknown> | null
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// ─── Draft DTOs ───

// 管理后台草稿 DTO
export interface AdminDraftDTO {
  id: string
  slug: string
  title: string
  summary: string
  cover_url: string | null
  status: 'draft'
  scheduled_at: number | null
  updated_at: number
  created_at: number
  content_markdown: string
  reading_time_minutes: number
}

// 保存草稿请求
export interface SaveDraftRequest {
  id?: string
  slug: string
  title: string
  summary?: string
  cover_url?: string | null
  content_markdown: string
  scheduled_at?: number | null
  tags?: string[]
  categories?: string[]
}

// 发布草稿请求
export interface PublishDraftRequest {
  message?: string
}

// ─── Admin DTOs ───

// 管理后台文章 DTO
export interface AdminPostDTO {
  slug: string
  title: string
  summary: string
  date: string | null
  tags: string[]
  categories: string[]
  cover: string | null
  status: 'draft' | 'published' | 'unlisted'
  content_markdown: string
  sha: string
}

// 管理后台文件变更
export interface AdminFileChange {
  path: string
  action: 'create' | 'update' | 'delete'
  content?: string
  encoding?: 'utf-8' | 'base64'
}

// 批量提交请求
export interface AdminCommitRequest {
  message: string
  changes: AdminFileChange[]
}

// 批量提交响应
export interface AdminCommitResponse {
  sha: string
  url: string
}

// 通知 DTO
export interface NotificationDTO {
  id: string
  type: 'comment_reply' | 'comment_pinned' | 'comment_hidden' | 'comment_deleted'
  actor: { login: string; avatar_url: string } | null
  comment_id: string | null
  target_type: 'post' | 'moment'
  target_id: string
  is_read: boolean
  created_at: TimeDTO
}

// 首次启用向导配置
export interface SetupConfigDTO {
  public_origin: string
  admin_github_ids: string
  github_oauth_client_id: string
  github_oauth_client_secret: string
  github_repo_owner: string
  github_repo_name: string
  github_token: string
}

export interface SetupStatusDTO {
  ready: boolean
  mode: 'env' | 'd1' | 'mixed' | 'none'
  missing: string[]
  config: SetupConfigDTO
  guides: {
    oauth_callback_url: string
    oauth_note: string
    publish_note: string
  }
}
