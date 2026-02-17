/**
 * API 适配器 - 与后端 tsuki-api 通信
 * 后端仅提供 Auth + Comments + Settings
 */

import type {
  ApiResult,
  SettingsPublicDTO,
  CommentDTO,
  UserDTO,
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

  // Comments
  getComments(
    targetType: 'post' | 'moment',
    targetId: string
  ): Promise<PaginatedResponse<CommentDTO>>
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

      if (!response.ok && response.status >= 500) {
        throw new ApiException(ErrorCodes.INTERNAL_ERROR, `服务器错误 (${response.status})`)
      }

      let result: ApiResult<T>
      try {
        result = (await response.json()) as ApiResult<T>
      } catch {
        throw new ApiException(ErrorCodes.INTERNAL_ERROR, '响应解析失败')
      }

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
      if (error instanceof ApiException) throw error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiException(ErrorCodes.INTERNAL_ERROR, '请求超时')
      }
      if (error instanceof TypeError) {
        throw new ApiException(ErrorCodes.INTERNAL_ERROR, '网络连接失败')
      }
      throw new ApiException(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error ? error.message : '未知错误'
      )
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return {
    async getCurrentUser() {
      try {
        return await fetchApi<UserDTO>('/auth/me')
      } catch (error) {
        if (error instanceof ApiException && error.code === ErrorCodes.AUTH_REQUIRED) {
          return null
        }
        throw error
      }
    },

    async getPublicSettings() {
      return fetchApi<SettingsPublicDTO>('/settings/public')
    },

    async getComments(targetType, targetId) {
      const searchParams = new URLSearchParams()
      searchParams.set('target_type', targetType)
      searchParams.set('target_id', targetId)
      return fetchApi<PaginatedResponse<CommentDTO>>(`/comments?${searchParams.toString()}`)
    },
  }
}
