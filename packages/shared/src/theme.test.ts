import { describe, expect, it } from 'vitest'

import { DEFAULT_THEME, getSafeTheme, getThemeMeta, isValidTheme, THEMES } from './theme'

describe('theme', () => {
  it('THEMES 包含 DEFAULT_THEME', () => {
    expect(THEMES).toContain(DEFAULT_THEME)
    expect(THEMES).toEqual(['mauve'])
    expect(DEFAULT_THEME).toBe('mauve')
  })

  it('isValidTheme 对合法值返回 true', () => {
    for (const theme of THEMES) {
      expect(isValidTheme(theme)).toBe(true)
    }
  })

  it('isValidTheme 对下线主题返回 false', () => {
    expect(isValidTheme('paper')).toBe(false)
    expect(isValidTheme('ink')).toBe(false)
  })

  it('getSafeTheme 对非法值回退到默认主题', () => {
    expect(getSafeTheme(null)).toBe(DEFAULT_THEME)
    expect(getSafeTheme(undefined)).toBe(DEFAULT_THEME)
    expect(getSafeTheme('not-a-theme')).toBe(DEFAULT_THEME)
  })

  it('getThemeMeta 始终返回合法 meta', () => {
    const meta = getThemeMeta(DEFAULT_THEME)
    expect(meta.id).toBe(DEFAULT_THEME)
    expect(meta.name).toBe('紫绯')
    expect(meta.primaryColor.length).toBeGreaterThan(0)
    expect(meta.bgColor.length).toBeGreaterThan(0)
  })
})
