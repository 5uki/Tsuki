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
