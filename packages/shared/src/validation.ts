/**
 * 共享校验函数
 */

/**
 * 验证 slug 格式
 * 规则：1-64 字符，仅 a-z/0-9/-，不以 - 开头或结尾，不含 --
 */
export function isValidSlug(slug: string): boolean {
  if (slug.length < 1 || slug.length > 64) return false
  if (!/^[a-z0-9-]+$/.test(slug)) return false
  if (slug.startsWith('-') || slug.endsWith('-')) return false
  if (slug.includes('--')) return false
  return true
}

/**
 * 规范化 slug（转小写，去除首尾空格）
 */
export function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim()
}

/**
 * 标准化字符串输入（去除首尾空格）
 */
export function normalizeString(input: string): string {
  return input.trim()
}

/**
 * 解析分页参数
 * limit: 默认 20，范围 1-50；cursor: 可选游标
 */
export function parsePaginationParams(params: URLSearchParams): {
  limit: number
  cursor: string | null
} {
  const limit = Math.min(Math.max(1, parseInt(params.get('limit') || '20', 10) || 20), 50)
  const cursor = params.get('cursor') || null
  return { limit, cursor }
}

/**
 * 验证 UUID v4 格式
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}
