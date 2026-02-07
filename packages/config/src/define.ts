import type { TsukiConfig, TsukiUserConfig } from './types'
import { DEFAULT_CONFIG } from './defaults'

/**
 * 定义 Tsuki 配置
 *
 * 功能概述:
 * 提供类型安全与智能提示,并将用户配置与默认值进行深度合并。
 *
 * 核心逻辑:
 * 1. 从 DEFAULT_CONFIG 获取基础配置
 * 2. 将用户配置与默认配置进行合并
 * 3. 对嵌套对象进行特殊处理,确保用户配置覆盖默认配置
 * 4. 保留默认配置中的必要字段,避免用户配置缺失导致错误
 *
 * 使用场景:
 * - 在 tsuki.config.ts 中定义站点配置
 * - 提供类型检查和智能提示
 * - 自动合并默认值,减少配置工作量
 *
 * @param config - 用户提供的配置对象
 * @returns 合并后的完整配置对象
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
