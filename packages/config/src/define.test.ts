import { describe, expect, it } from 'vitest'

import { defineConfig } from './define'
import { DEFAULT_CONFIG } from './defaults'

describe('defineConfig', () => {
  it('会合并默认值并覆盖用户配置', () => {
    const config = defineConfig({
      site: { title: 'My Blog' },
      nav: [{ label: '首页', href: '/' }],
    })

    expect(config.site.title).toBe('My Blog')
    expect(config.site.description).toBe(DEFAULT_CONFIG.site.description)
    expect(config.nav).toEqual([{ label: '首页', href: '/' }])
  })

  it('hero 未提供时使用默认 hero', () => {
    const config = defineConfig({ site: { title: 'X' } })
    expect(config.hero).toEqual(DEFAULT_CONFIG.hero)
  })
})

