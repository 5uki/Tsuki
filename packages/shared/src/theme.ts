/**
 * 共享主题定义
 */

export const THEMES = ['mauve'] as const
export type Theme = (typeof THEMES)[number]

export const DEFAULT_THEME: Theme = 'mauve'

/**
 * 主题元数据
 */
export interface ThemeMeta {
  id: Theme
  name: string
  gradientColor: string
  accentColor: string
  secondaryColor: string
}

/**
 * 主题元数据列表（单一数据源）
 */
export const THEME_METAS: ThemeMeta[] = [
  {
    id: 'mauve',
    name: '紫绯',
    gradientColor: 'radial-gradient(circle, #ece4ff 12%, #e0c3fc 100%)',
    accentColor: '#a78bfa',
    secondaryColor: '#ece4ff',
  },
]

/**
 * 获取主题元数据
 */
export function getThemeMeta(theme: Theme): ThemeMeta {
  return THEME_METAS.find((t) => t.id === theme) ?? THEME_METAS[0]!
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
