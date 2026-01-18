/**
 * 错误码定义
 * 重新导出共享包内容，并添加后端特有内容
 */

export * from '@orin/shared/errors'

import type { ErrorCode } from '@orin/shared/errors'

/**
 * HTTP 状态码映射
 */
export const ErrorHttpStatus: Record<ErrorCode, number> = {
  AUTH_REQUIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 400,
  RATE_LIMITED: 429,
  COMMENT_DEPTH_EXCEEDED: 400,
  INTERNAL_ERROR: 500,
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details: Record<string, unknown> | null = null
  ) {
    super(message)
    this.name = 'AppError'
  }

  get status(): number {
    return ErrorHttpStatus[this.code]
  }
}
