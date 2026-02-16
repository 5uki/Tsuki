import type { TsukiConfig, TsukiUserConfig } from './types'
import { DEFAULT_CONFIG } from './defaults'

/**
 * 定义 Tsuki 配置
 * 提供类型安全与智能提示，将用户配置与默认值深度合并
 */
export function defineConfig(config: TsukiUserConfig): TsukiConfig {
  return {
    site: {
      ...DEFAULT_CONFIG.site,
      ...config.site,
    },
    nav: config.nav ?? DEFAULT_CONFIG.nav,
    hero: config.hero
      ? { ...DEFAULT_CONFIG.hero, ...config.hero }
      : DEFAULT_CONFIG.hero,
    profile: config.profile
      ? {
          ...DEFAULT_CONFIG.profile,
          ...config.profile,
          name: config.profile.name ?? DEFAULT_CONFIG.profile!.name,
        }
      : DEFAULT_CONFIG.profile,
    announcement: config.announcement
      ? {
          ...DEFAULT_CONFIG.announcement,
          ...config.announcement,
          link: config.announcement.link
            ? { ...DEFAULT_CONFIG.announcement!.link, ...config.announcement.link }
            : DEFAULT_CONFIG.announcement!.link,
        }
      : DEFAULT_CONFIG.announcement,
    stats: config.stats
      ? { ...DEFAULT_CONFIG.stats, ...config.stats }
      : DEFAULT_CONFIG.stats,
  }
}
