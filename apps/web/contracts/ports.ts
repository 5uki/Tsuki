/**
 * 端口接口定义（前端）
 *
 * 说明：
 * - contracts 只能声明不实现
 * - adapters 必须实现这些接口（结构类型即可）
 */

import type {
  ApiResult,
  CommentDTO,
  GroupDTO,
  MomentDTO,
  PaginatedResponse,
  PostDetailDTO,
  PostSummaryDTO,
  SettingsPublicDTO,
  TagDTO,
  UserDTO,
} from './dto'

export interface ApiPort {
  // Auth
  getCurrentUser(): Promise<UserDTO | null>

  // Settings
  getPublicSettings(): Promise<SettingsPublicDTO>

  // Posts
  getPosts(params?: {
    limit?: number
    cursor?: string
    tag?: string
    group?: string
    q?: string
  }): Promise<PaginatedResponse<PostSummaryDTO>>
  getPostBySlug(slug: string): Promise<PostDetailDTO>

  // Moments
  getMoments(params?: {
    limit?: number
    cursor?: string
    tag?: string
  }): Promise<PaginatedResponse<MomentDTO>>
  getMomentById(id: string): Promise<MomentDTO>

  // Comments
  getComments(
    targetType: 'post' | 'moment',
    targetId: string
  ): Promise<PaginatedResponse<CommentDTO>>

  // Tags & Groups
  getTags(): Promise<PaginatedResponse<{ tag: TagDTO; post_count: number; moment_count: number }>>
  getTagBySlug(slug: string): Promise<TagDTO>
  getGroups(type?: 'category' | 'series'): Promise<
    PaginatedResponse<{
      group: GroupDTO
      post_count: number
    }>
  >
  getGroupBySlug(slug: string): Promise<GroupDTO>
}

export interface StoragePort {
  // 主题偏好
  getTheme(): string | null
  setTheme(theme: string): void

  // CSRF Token
  getCsrfToken(): string | null
}

/**
 * API 响应包络（用于实现方内部）
 * - ports 里不强制暴露，但保留类型在 contracts 里便于复用
 */
export type { ApiResult }

