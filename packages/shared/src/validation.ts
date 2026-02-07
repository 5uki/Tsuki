/**
 * 共享校验函数
 *
 * 功能概述:
 * 提供数据验证和规范化功能,确保输入数据符合系统要求。
 *
 * 核心功能:
 * 1. isValidSlug: 验证 slug 格式(URL 友好的标识符)
 * 2. normalizeSlug: 规范化 slug(转小写并去除空格)
 * 3. normalizeString: 标准化字符串输入
 * 4. parsePaginationParams: 解析分页参数
 * 5. isValidUUID: 验证 UUID v4 格式
 *
 * 设计原则:
 * - 使用正则表达式进行高效验证
 * - 提供明确的验证规则和错误提示
 * - 支持数据规范化,自动修正常见问题
 * - 遵循 RESTful API 和 URL 规范
 *
 * 性能优化点:
 * - 使用正则表达式一次性完成复杂验证
 * - 提前返回,避免不必要的计算
 * - 使用简单的字符串操作,避免复杂算法
 *
 * 已知限制:
 * - Slug 仅支持小写字母、数字和连字符
 * - UUID 仅支持 v4 版本
 * - 分页参数限制在 1-50 之间
 */

/**
 * 验证 slug 格式
 *
 * 功能说明:
 * 验证字符串是否符合 URL 友好的 slug 格式要求。
 *
 * 验证规则:
 * 1. 长度: 1-64 个字符
 * 2. 允许字符: 小写字母(a-z)、数字(0-9)、连字符(-)
 * 3. 禁止: 连续连字符(--)、以连字符开头或结尾
 *
 * 正则表达式说明:
 * - ^[a-z0-9-]+$: 仅允许小写字母、数字和连字符
 * - !/^-/: 不以连字符开头
 * - !/-$/: 不以连字符结尾
 * - !/--/: 不包含连续连字符
 *
 * 使用场景:
 * - 验证文章 slug
 * - 验证标签 slug
 * - 验证分类 slug
 * - 生成 URL 路径前验证
 *
 * @param slug - 待验证的字符串
 * @returns 如果符合 slug 格式返回 true,否则返回 false
 */
export function isValidSlug(slug: string): boolean {
  if (slug.length < 1 || slug.length > 64) return false
  if (!/^[a-z0-9-]+$/.test(slug)) return false
  if (slug.startsWith('-') || slug.endsWith('-')) return false
  if (slug.includes('--')) return false
  return true
}

/**
 * 规范化 slug(转小写并去除首尾空格)
 *
 * 功能说明:
 * 将输入字符串转换为符合 slug 规范的格式。
 *
 * 规范化操作:
 * 1. 转换为小写字母
 * 2. 去除首尾空格
 *
 * 注意事项:
 * - 此函数不验证 slug 格式,仅做基本规范化
 * - 如需验证,应配合 isValidSlug 使用
 * - 不处理特殊字符和连续连字符
 *
 * 使用场景:
 * - 用户输入 slug 后的预处理
 * - 从标题生成 slug 后的规范化
 * - 数据导入时的格式统一
 *
 * @param slug - 待规范化的字符串
 * @returns 规范化后的 slug(小写,无首尾空格)
 */
export function normalizeSlug(slug: string): string {
  return slug.toLowerCase().trim()
}

/**
 * 标准化字符串输入
 *
 * 功能说明:
 * 去除字符串首尾的空白字符。
 *
 * 实现细节:
 * - 使用 String.trim() 方法
 * - 去除空格、制表符、换行符等空白字符
 *
 * 使用场景:
 * - 用户输入的预处理
 * - 表单数据清理
 * - 避免因空格导致的匹配问题
 *
 * @param input - 待标准化的字符串
 * @returns 去除首尾空格后的字符串
 */
export function normalizeString(input: string): string {
  return input.trim()
}

/**
 * 解析分页参数
 *
 * 功能说明:
 * 从 URLSearchParams 中解析分页参数,并进行验证和限制。
 *
 * 参数说明:
 * - limit: 每页数量,默认 20,限制范围 1-50
 * - cursor: 游标字符串,用于分页,可为空
 *
 * 验证规则:
 * - limit 必须是正整数
 * - limit 最小值为 1,最大值为 50
 * - cursor 可以是任意字符串或 null
 *
 * 实现细节:
 * - 使用 parseInt 解析数字,默认值 20
 * - 使用 Math.min 和 Math.max 限制范围
 * - cursor 直接获取,不做额外验证
 *
 * 使用场景:
 * - API 请求参数解析
 * - 列表页面分页
 * - 无限滚动加载
 *
 * @param params - URLSearchParams 对象
 * @returns 包含 limit 和 cursor 的分页参数对象
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
 *
 * 功能说明:
 * 验证字符串是否符合 UUID v4 格式标准。
 *
 * UUID v4 格式说明:
 * - 格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * - x: 任意十六进制数字(0-9, a-f)
 * - y: 8, 9, a, 或 b
 * - 总长度: 36 个字符(含 4 个连字符)
 *
 * 正则表达式说明:
 * - ^[0-9a-f]{8}-: 前 8 位十六进制数字 + 连字符
 * - [0-9a-f]{4}-: 中间 4 位十六进制数字 + 连字符
 * - 4[0-9a-f]{3}-: 固定字符 '4' + 3 位十六进制数字 + 连字符
 * - [89ab][0-9a-f]{3}-: 8/9/a/b + 3 位十六进制数字 + 连字符
 * - [0-9a-f]{12}$: 最后 12 位十六进制数字
 * - i 标志: 不区分大小写
 *
 * 使用场景:
 * - 验证文章 ID
 * - 验证评论 ID
 * - 验证用户 ID
 * - API 参数验证
 *
 * @param id - 待验证的 UUID 字符串
 * @returns 如果符合 UUID v4 格式返回 true,否则返回 false
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}
