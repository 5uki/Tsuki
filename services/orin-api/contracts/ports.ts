/**
 * 端口接口定义
 * adapters 必须实现这些接口
 */

import type {
  SettingsPublicDTO,
  PostSummaryDTO,
  PostDetailDTO,
  MomentDTO,
  CommentDTO,
  UserDTO,
  TagDTO,
  GroupDTO,
  PaginatedResponse,
} from './dto'

/**
 * 设置端口
 */
export interface SettingsPort {
  getPublicSettings(): Promise<SettingsPublicDTO>
}

/**
 * 文章端口
 */
export interface PostsPort {
  listPublicPosts(params: {
    limit: number
    cursor: string | null
    tag?: string
    group?: string
    q?: string
  }): Promise<PaginatedResponse<PostSummaryDTO>>

  getPublicPostBySlug(slug: string): Promise<PostDetailDTO | null>
}

/**
 * 动态端口
 */
export interface MomentsPort {
  listPublicMoments(params: {
    limit: number
    cursor: string | null
    tag?: string
  }): Promise<PaginatedResponse<MomentDTO>>

  getPublicMomentById(id: string): Promise<MomentDTO | null>
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

/**
 * 标签端口
 */
export interface TagsPort {
  listTags(): Promise<PaginatedResponse<{ tag: TagDTO; post_count: number; moment_count: number }>>
  getTagBySlug(slug: string): Promise<TagDTO | null>
}

/**
 * 分组端口
 */
export interface GroupsPort {
  listGroups(type?: 'category' | 'series'): Promise<
    PaginatedResponse<{
      group: GroupDTO
      post_count: number
    }>
  >
  getGroupBySlug(slug: string): Promise<GroupDTO | null>
}
