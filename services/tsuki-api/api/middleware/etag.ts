/**
 * ETag 中间件
 *
 * 对 GET 响应体计算 ETag（SHA-256 前 16 字节），
 * 如果客户端 If-None-Match 命中则返回 304。
 */

import { createMiddleware } from 'hono/factory'
import type { Env, AppContext } from '@contracts/env'

export const etagMiddleware = createMiddleware<{
  Bindings: Env
  Variables: AppContext
}>(async (c, next) => {
  await next()

  // 仅处理成功的 GET/HEAD 响应
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') return
  if (c.res.status !== 200) return

  const body = await c.res.clone().text()
  if (!body) return

  // 计算 ETag
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body))
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const etag = `"${hashHex}"`

  // 检查 If-None-Match
  const ifNoneMatch = c.req.header('If-None-Match')
  if (ifNoneMatch === etag) {
    c.res = new Response(null, { status: 304, headers: { ETag: etag } })
    return
  }

  c.res.headers.set('ETag', etag)
})
