/**
 * 时间处理原子
 * 重新导出共享包内容，并补充后端专用能力
 */

import { createTimeDTO } from '@tsuki/shared/time'

export * from '@tsuki/shared/time'

/**
 * 获取当前时间（TimeDTO）
 */
export function now() {
  return createTimeDTO(Date.now())
}

/**
 * 计算阅读时间（分钟）
 * 按 400 字/分钟估算，向上取整
 */
export function calculateReadingTime(text: string): number {
  const charCount = text.replace(/\s/g, '').length
  return Math.ceil(charCount / 400)
}
