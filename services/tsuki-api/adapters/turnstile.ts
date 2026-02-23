/**
 * Cloudflare Turnstile 验证适配器
 */

import type { TurnstilePort } from '@contracts/ports'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function createTurnstileAdapter(secretKey: string): TurnstilePort {
  return {
    async verify(token, remoteIp) {
      const body = new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: remoteIp,
      })

      const res = await fetch(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        body,
      })

      if (!res.ok) {
        return false
      }

      const data = await res.json() as { success: boolean }
      return data.success === true
    },
  }
}
