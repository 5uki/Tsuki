/**
 * API Client - fetch 封装
 */

const API_BASE = '/v1'

interface FetchOptions extends RequestInit {
  json?: unknown
}

class ApiClient {
  private csrfToken: string | null = null

  async fetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const url = `${API_BASE}${path}`
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    }

    if (options.json) {
      headers['Content-Type'] = 'application/json'
      options.body = JSON.stringify(options.json)
      delete options.json
    }

    // Add CSRF token for non-GET requests
    if (options.method && options.method !== 'GET' && this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    // Extract CSRF token from cookie
    this.extractCsrfToken()

    if (!res.ok) {
      const body = await res.json().catch(() => ({ ok: false, error: { message: res.statusText } }))
      throw new ApiError(res.status, body?.error?.code || 'UNKNOWN', body?.error?.message || res.statusText)
    }

    return res.json() as Promise<T>
  }

  private extractCsrfToken() {
    const match = document.cookie.match(/tsuki_csrf=([^;]+)/)
    if (match) {
      this.csrfToken = match[1]!
    }
  }

  get<T>(path: string) {
    return this.fetch<T>(path, { method: 'GET' })
  }

  post<T>(path: string, json?: unknown) {
    return this.fetch<T>(path, { method: 'POST', json })
  }

  patch<T>(path: string, json?: unknown) {
    return this.fetch<T>(path, { method: 'PATCH', json })
  }

  delete<T>(path: string) {
    return this.fetch<T>(path, { method: 'DELETE' })
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const api = new ApiClient()
