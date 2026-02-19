/**
 * 浏览器端存储 — localStorage / cookie 操作
 */

const isBrowser = typeof window !== 'undefined'

export function getTheme(): string | null {
  if (!isBrowser) return null
  return localStorage.getItem('tsuki.theme')
}

export function setTheme(theme: string): void {
  if (!isBrowser) return
  localStorage.setItem('tsuki.theme', theme)
}

export function getCsrfToken(): string | null {
  if (!isBrowser) return null
  const match = document.cookie.match(/tsuki_csrf=([^;]+)/)
  return match?.[1] || null
}
