import type { TsukiConfig, TsukiUserConfig } from './types'
import { DEFAULT_CONFIG } from './defaults'

/**
 * 定义 Tsuki 配置
 *
 * 提供类型安全与智能提示，并将用户配置与默认值进行合并。
 */
export function defineConfig(config: TsukiUserConfig): TsukiConfig {
  const hero = config.hero

  return {
    site: {
      ...DEFAULT_CONFIG.site,
      ...config.site,
    },
    nav: config.nav ?? DEFAULT_CONFIG.nav,
    hero: hero
      ? {
          ...DEFAULT_CONFIG.hero,
          ...hero,
        }
      : DEFAULT_CONFIG.hero,
  }
}
