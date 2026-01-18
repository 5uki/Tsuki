/**
 * 共享主题定义
 */

export const THEMES = ['paper', 'ink', 'nord', 'rose', 'aurora', 'mono', 'violet'] as const
export type Theme = (typeof THEMES)[number]

export const DEFAULT_THEME: Theme = 'paper'

/**
 * 主题元数据
 */
export interface ThemeMeta {
  id: Theme
  name: string
  primaryColor: string
  bgColor: string
}

/**
 * 主题元数据列表（单一数据源）
 */
export const THEME_METAS: ThemeMeta[] = [
  { id: 'paper', name: '纸张', primaryColor: '#0b5fff', bgColor: '#fbf7ef' },
  { id: 'ink', name: '墨水', primaryColor: '#7aa2f7', bgColor: '#0b0f19' },
  { id: 'nord', name: '北欧', primaryColor: '#5e81ac', bgColor: '#eceff4' },
  { id: 'rose', name: '玫瑰', primaryColor: '#db2777', bgColor: '#fff7fb' },
  { id: 'aurora', name: '极光', primaryColor: '#06b6d4', bgColor: '#f8fafc' },
  { id: 'mono', name: '极简', primaryColor: '#111827', bgColor: '#ffffff' },
  { id: 'violet', name: '紫罗兰', primaryColor: '#7c3aed', bgColor: '#faf8ff' },
]

/**
 * 获取主题元数据
 */
export function getThemeMeta(theme: Theme): ThemeMeta {
  return THEME_METAS.find((t) => t.id === theme) || THEME_METAS[0]
}

/**
 * 验证主题名称是否有效
 */
export function isValidTheme(theme: string): theme is Theme {
  return THEMES.includes(theme as Theme)
}

/**
 * 获取安全的主题名称
 */
export function getSafeTheme(theme: string | null | undefined): Theme {
  if (theme && isValidTheme(theme)) {
    return theme
  }
  return DEFAULT_THEME
}
