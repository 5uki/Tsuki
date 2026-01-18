/**
 * 哈希原子
 */

/**
 * 计算 SHA-256 哈希（不可逆）
 * 用于 ip_hash、user_agent_hash 等隐私数据
 */
export async function sha256(value: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
