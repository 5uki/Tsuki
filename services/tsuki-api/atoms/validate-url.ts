/**
 * URL 校验原子
 * 仅允许 HTTPS URL（防止注入恶意协议）
 */

/**
 * 校验 URL 是否为合法的 HTTPS URL
 * 用于校验来自外部系统的用户头像、个人主页等 URL
 */
export function isValidHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 对 URL 进行安全化处理
 * 非法 URL 返回空字符串
 */
export function sanitizeUrl(url: string): string {
  return isValidHttpsUrl(url) ? url : ''
}
