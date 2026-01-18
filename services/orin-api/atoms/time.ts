/**
 * 时间处理原子
 * 重新导出共享包内容，并添加后端特有函数
 */

export * from '@orin/shared/time'

/**
 * 计算阅读时间（分钟）
 * 按 400 字/分钟估算，向上取整
 */
export function calculateReadingTime(text: string): number {
  const charCount = text.replace(/\s/g, '').length
  return Math.ceil(charCount / 400)
}
