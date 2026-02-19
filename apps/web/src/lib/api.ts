/**
 * 后端 API 客户端 — 与 tsuki-api Worker 通信
 *
 * 仅负责 Auth / Comments / Settings 等运行时 API
 */

import type {
  ApiResult,
  SettingsPublicDTO,
  CommentDTO,
  UserDTO,
  PaginatedResponse,
} from '@tsuki/shared/dto'
import { ApiException, ErrorCodes } from '@tsuki/shared/errors'
import { getCsrfToken } from './storage'

const API_BASE = import.meta.env.PUBLIC_TSUKI_API_BASE || 'http://localhost:8787/v1'
const DEFAULT_TIMEOUT = 10000

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

  // 写请求自动附加 CSRF token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  const method = options?.method?.toUpperCase()
  if (method && method !== 'GET' && method !== 'HEAD') {
    const csrf = getCsrfToken()
    if (csrf) {
      headers['X-CSRF-Token'] = csrf
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers,
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

export async function getCurrentUser(): Promise<UserDTO | null> {
  try {
    return await fetchApi<UserDTO | null>('/auth/me')
  } catch (error) {
    if (error instanceof ApiException && error.code === ErrorCodes.AUTH_REQUIRED) {
      return null
    }
    throw error
  }
}

export async function logout(): Promise<void> {
  await fetchApi<null>('/auth/logout', { method: 'POST' })
}

export async function getPublicSettings(): Promise<SettingsPublicDTO> {
  return fetchApi<SettingsPublicDTO>('/settings/public')
}

export async function getComments(
  targetType: 'post' | 'moment',
  targetId: string
): Promise<PaginatedResponse<CommentDTO>> {
  const searchParams = new URLSearchParams()
  searchParams.set('target_type', targetType)
  searchParams.set('target_id', targetId)
  return fetchApi<PaginatedResponse<CommentDTO>>(`/comments?${searchParams.toString()}`)
}
