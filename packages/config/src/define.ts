import type { TsukiConfig, TsukiUserConfig } from './types'
import { DEFAULT_CONFIG } from './defaults'

/**
 * 定义 Tsuki 配置
 *
 * 提供类型安全与智能提示，并将用户配置与默认值进行合并。
 */
export function defineConfig(config: TsukiUserConfig): TsukiConfig {
  const hero = config.hero
  const profile = config.profile
  const announcement = config.announcement
  const stats = config.stats
  const defaultProfile = DEFAULT_CONFIG.profile ?? { name: 'Tsuki', links: [] }
  const defaultAnnouncement = DEFAULT_CONFIG.announcement ?? {
    enable: false,
    title: '公告',
    content: '',
    link: {
      enable: false,
      text: '查看详情',
      url: '',
    },
  }

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
    profile: profile
      ? {
          ...defaultProfile,
          ...profile,
          name: profile.name ?? defaultProfile.name,
        }
      : defaultProfile,
    announcement: announcement
      ? {
          ...defaultAnnouncement,
          ...announcement,
          link: announcement.link
            ? {
                ...defaultAnnouncement.link,
                ...announcement.link,
              }
            : defaultAnnouncement.link,
        }
      : defaultAnnouncement,
    stats: stats
      ? {
          ...DEFAULT_CONFIG.stats,
          ...stats,
        }
      : DEFAULT_CONFIG.stats,
  }
}
