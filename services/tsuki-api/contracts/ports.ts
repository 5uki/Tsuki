/**
 * 端口接口定义
 * adapters 必须实现这些接口
 */

import type {
  SettingsPublicDTO,
  CommentDTO,
  UserDTO,
  PaginatedResponse,
} from './dto'

/**
 * 设置端口
 */
export interface SettingsPort {
  getPublicSettings(): Promise<SettingsPublicDTO>
}

/**
 * 评论端口
 */
export interface CommentsPort {
  listPublicComments(
    targetType: 'post' | 'moment',
    targetId: string
  ): Promise<PaginatedResponse<CommentDTO>>
}

/**
 * 用户端口
 */
export interface UsersPort {
  getUserById(id: string): Promise<UserDTO | null>
  getUserByGithubId(githubId: number): Promise<UserDTO | null>
}
