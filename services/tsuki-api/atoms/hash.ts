/**
 * 哈希原子
 *
 * 功能概述:
 * 提供加密哈希计算功能,用于敏感数据的不可逆加密。
 *
 * 核心功能:
 * - sha256: 计算 SHA-256 哈希值
 *
 * 使用场景:
 * - IP 地址哈希: 保护用户隐私
 * - User Agent 哈希: 防止设备指纹追踪
 * - 敏感信息脱敏: 数据存储前的加密
 *
 * 安全特性:
 * - 使用 Web Crypto API,浏览器原生支持
 * - 不可逆加密: 无法从哈希值还原原始数据
 * - 盐值支持: 添加随机盐值防止彩虹表攻击
 *
 * 算法说明:
 * - SHA-256: 安全哈希算法,输出 256 位(32 字节)哈希值
 * - 盐值: 在原始数据前添加随机字符串,增加哈希随机性
 * - 十六进制编码: 将二进制哈希转换为可读的十六进制字符串
 *
 * 性能优化点:
 * - 使用 TextEncoder 进行 UTF-8 编码,性能优于手动编码
 * - 使用 crypto.subtle.digest() 进行异步计算,不阻塞主线程
 * - 使用 Array.from() 和 map() 进行高效数组转换
 *
 * 已知限制:
 * - 仅支持 SHA-256 算法
 * - 盐值需要外部管理
 * - 异步函数,需要 await 调用
 */

/**
 * 计算 SHA-256 哈希(不可逆)
 *
 * 功能说明:
 * 使用 SHA-256 算法对输入数据进行哈希计算,返回十六进制字符串。
 *
 * 实现细节:
 * 1. 将盐值和原始数据拼接
 * 2. 使用 TextEncoder 进行 UTF-8 编码
 * 3. 使用 crypto.subtle.digest() 计算 SHA-256 哈希
 * 4. 将二进制哈希转换为十六进制字符串
 *
 * 参数说明:
 * - value: 待哈希的原始数据
 * - salt: 盐值字符串,用于增加哈希随机性
 *
 * 返回值:
 * - 64 字符的十六进制字符串(SHA-256 输出 32 字节,每字节 2 个十六进制字符)
 *
 * 使用场景:
 * - IP 地址哈希: sha256('192.168.1.1', 'random-salt')
 * - User Agent 哈希: sha256(userAgent, 'ua-salt')
 * - 敏感数据脱敏: sha256(email, 'email-salt')
 *
 * @param value - 待哈希的原始数据
 * @param salt - 盐值字符串
 * @returns SHA-256 哈希值的十六进制字符串
 */
export async function sha256(value: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
