/**
 * API 适配器 - 与后端 orin-api 通信
 */

import type {
  ApiResult,
  SettingsPublicDTO,
  PostSummaryDTO,
  PostDetailDTO,
  MomentDTO,
  CommentDTO,
  UserDTO,
  TagDTO,
  GroupDTO,
  PaginatedResponse,
} from '@contracts/dto'
import { ApiException, ErrorCodes } from '@contracts/errors'

/** 默认超时时间（毫秒） */
const DEFAULT_TIMEOUT = 10000

export interface ApiAdapter {
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

export interface ApiAdapterOptions {
  baseUrl: string
  timeout?: number
}

/**
 * 创建 API 适配器
 */
export function createApiAdapter(options: ApiAdapterOptions | string): ApiAdapter {
  const baseUrl = typeof options === 'string' ? options : options.baseUrl
  const timeout = typeof options === 'string' ? DEFAULT_TIMEOUT : (options.timeout ?? DEFAULT_TIMEOUT)

  async function fetchApi<T>(path: string, fetchOptions?: RequestInit): Promise<T> {
    const url = `${baseUrl}${path}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions?.headers,
        },
      })

      clearTimeout(timeoutId)

      // 处理网络层错误
      if (!response.ok && response.status >= 500) {
        throw new ApiException(ErrorCodes.INTERNAL_ERROR, `服务器错误 (${response.status})`)
      }

      let result: ApiResult<T>
      try {
        result = (await response.json()) as ApiResult<T>
      } catch {
        throw new ApiException(ErrorCodes.INTERNAL_ERROR, '响应解析失败')
      }

      // 处理业务错误
      if (!result.ok) {
        const code = result.error.code as keyof typeof ErrorCodes
        throw new ApiException(
          ErrorCodes[code] || ErrorCodes.INTERNAL_ERROR,
          result.error.message,
          result.error.details
        )
      }

      return result.data
    } catch (error) {
      clearTimeout(timeoutId)

      // 已经是 ApiException，直接抛出
      if (error instanceof ApiException) {
        throw error
      }

      // 超时错误
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiException(ErrorCodes.INTERNAL_ERROR, '请求超时')
      }

      // 网络错误
      if (error instanceof TypeError) {
        throw new ApiException(ErrorCodes.INTERNAL_ERROR, '网络连接失败')
      }

      // 其他错误
      throw new ApiException(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error ? error.message : '未知错误'
      )
    }
  }

  return {
    async getCurrentUser() {
      try {
        return await fetchApi<UserDTO>('/auth/me')
      } catch (error) {
        // 未登录返回 null，其他错误继续抛出
        if (error instanceof ApiException && error.code === ErrorCodes.AUTH_REQUIRED) {
          return null
        }
        throw error
      }
    },

    async getPublicSettings() {
      return fetchApi<SettingsPublicDTO>('/settings/public')
    },

    async getPosts(params) {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.cursor) searchParams.set('cursor', params.cursor)
      if (params?.tag) searchParams.set('tag', params.tag)
      if (params?.group) searchParams.set('group', params.group)
      if (params?.q) searchParams.set('q', params.q)
      const query = searchParams.toString()
      return fetchApi<PaginatedResponse<PostSummaryDTO>>(`/posts${query ? `?${query}` : ''}`)
    },

    async getPostBySlug(slug) {
      return fetchApi<PostDetailDTO>(`/posts/${encodeURIComponent(slug)}`)
    },

    async getMoments(params) {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set('limit', String(params.limit))
      if (params?.cursor) searchParams.set('cursor', params.cursor)
      if (params?.tag) searchParams.set('tag', params.tag)
      const query = searchParams.toString()
      return fetchApi<PaginatedResponse<MomentDTO>>(`/moments${query ? `?${query}` : ''}`)
    },

    async getMomentById(id) {
      return fetchApi<MomentDTO>(`/moments/${encodeURIComponent(id)}`)
    },

    async getComments(targetType, targetId) {
      const searchParams = new URLSearchParams()
      searchParams.set('target_type', targetType)
      searchParams.set('target_id', targetId)
      return fetchApi<PaginatedResponse<CommentDTO>>(`/comments?${searchParams.toString()}`)
    },

    async getTags() {
      return fetchApi<
        PaginatedResponse<{ tag: TagDTO; post_count: number; moment_count: number }>
      >('/tags')
    },

    async getTagBySlug(slug) {
      return fetchApi<TagDTO>(`/tags/${encodeURIComponent(slug)}`)
    },

    async getGroups(type) {
      const query = type ? `?type=${type}` : ''
      return fetchApi<PaginatedResponse<{ group: GroupDTO; post_count: number }>>(
        `/groups${query}`
      )
    },

    async getGroupBySlug(slug) {
      return fetchApi<GroupDTO>(`/groups/${encodeURIComponent(slug)}`)
    },
  }
}
