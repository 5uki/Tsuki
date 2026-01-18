/**
 * 共享错误码定义
 */

export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  COMMENT_DEPTH_EXCEEDED: 'COMMENT_DEPTH_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

/**
 * 错误码对应的中文消息
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  AUTH_REQUIRED: '请先登录',
  FORBIDDEN: '没有权限执行此操作',
  NOT_FOUND: '资源不存在',
  VALIDATION_FAILED: '输入校验失败',
  RATE_LIMITED: '请求过于频繁，请稍后再试',
  COMMENT_DEPTH_EXCEEDED: '评论层级已达上限',
  INTERNAL_ERROR: '服务器内部错误',
}

/**
 * 获取错误消息
 */
export function getErrorMessage(code: string): string {
  return ErrorMessages[code as ErrorCode] || '未知错误'
}

/**
 * 自定义 API 错误类
 */
export class ApiException extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly details?: Record<string, unknown> | null
  ) {
    super(message || ErrorMessages[code])
    this.name = 'ApiException'
  }
}
