/**
 * 幂等键中间件
 *
 * 客户端在写请求中附带 Idempotency-Key 头，
 * 中间件会缓存响应，重复请求直接返回缓存。
 * 幂等键有效期 24 小时。
 */

import { createMiddleware } from 'hono/factory'
import type { Env, AppContext } from '@contracts/env'
import type { IdempotencyPort } from '@contracts/ports'

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000 // 24h

export function createIdempotencyMiddleware(getPort: (c: unknown) => IdempotencyPort) {
  return createMiddleware<{ Bindings: Env; Variables: AppContext }>(async (c, next) => {
    const idemKey = c.req.header('Idempotency-Key')
    if (!idemKey) {
      // 没有幂等键，正常执行
      await next()
      return
    }

    // 校验格式：1-64 字符，仅允许字母数字和连字符
    if (idemKey.length > 64 || !/^[\w-]+$/.test(idemKey)) {
      await next()
      return
    }

    const port = getPort(c)
    const route = `${c.req.method} ${c.req.path}`
    const userId = c.get('currentUser')?.id ?? null

    // 查找缓存
    const cached = await port.find(route, userId, idemKey)
    if (cached) {
      c.res = new Response(cached.response_json, {
        status: cached.response_status,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Replayed': 'true',
        },
      })
      return
    }

    await next()

    // 仅缓存成功响应（2xx）
    if (c.res.status >= 200 && c.res.status < 300) {
      const responseJson = await c.res.clone().text()
      const requestHash = idemKey // 简化：以 idemKey 本身作为 request_hash

      await port.store({
        route,
        userId,
        idemKey,
        requestHash,
        responseStatus: c.res.status,
        responseJson,
        ttlMs: IDEMPOTENCY_TTL_MS,
      })
    }
  })
}
