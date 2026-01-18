/**
 * 存储适配器 - localStorage / cookie 操作
 */

export interface StorageAdapter {
  // 主题偏好
  getTheme(): string | null
  setTheme(theme: string): void

  // CSRF Token
  getCsrfToken(): string | null
}

/**
 * 创建存储适配器
 */
export function createStorageAdapter(): StorageAdapter {
  // 检测是否在浏览器环境
  const isBrowser = typeof window !== 'undefined'

  return {
    getTheme() {
      if (!isBrowser) return null
      return localStorage.getItem('orin.theme')
    },

    setTheme(theme) {
      if (!isBrowser) return
      localStorage.setItem('orin.theme', theme)
    },

    getCsrfToken() {
      if (!isBrowser) return null
      const match = document.cookie.match(/orin_csrf=([^;]+)/)
      return match?.[1] || null
    },
  }
}
