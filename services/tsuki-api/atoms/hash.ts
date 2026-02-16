/**
 * 哈希原子
 * 使用 Web Crypto API 进行 SHA-256 哈希计算
 */

/**
 * 计算 SHA-256 哈希（带盐值，不可逆）
 * 返回 64 字符十六进制字符串
 */
export async function sha256(value: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
