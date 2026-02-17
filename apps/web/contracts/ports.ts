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
  PaginatedResponse,
  SettingsPublicDTO,
  UserDTO,
} from './dto'
import type { MomentContent, MomentEntry, PostContent, PostEntry } from './content'

export interface ApiPort {
  // Auth
  getCurrentUser(): Promise<UserDTO | null>

  // Settings
  getPublicSettings(): Promise<SettingsPublicDTO>

  // Comments
  getComments(
    targetType: 'post' | 'moment',
    targetId: string
  ): Promise<PaginatedResponse<CommentDTO>>
}

export interface StoragePort {
  // 主题偏好
  getTheme(): string | null
  setTheme(theme: string): void

  // CSRF Token
  getCsrfToken(): string | null
}

export interface ContentPort {
  getPostEntries(): Promise<PostEntry[]>
  getPostBySlug(slug: string): Promise<PostContent | null>
  getMomentEntries(): Promise<MomentEntry[]>
  getMomentById(id: string): Promise<MomentContent | null>
}

/**
 * API 响应包络（用于实现方内部）
 * - ports 里不强制暴露，但保留类型在 contracts 里便于复用
 */
export type { ApiResult }
