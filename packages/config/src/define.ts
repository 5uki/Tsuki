import type { TsukiConfig, TsukiUserConfig } from './types'
import { DEFAULT_CONFIG } from './defaults'

/**
 * 归一化资源路径：
 *   绝对 URL（http/https）→ 原样
 *   站内绝对路径（/xxx）→ 原样
 *   相对路径（./contents/X）→ /X（publicDir = contents/，直接映射）
 */
function normalizeHref(href: string | undefined): string | undefined {
  const raw = href?.trim()
  if (!raw) return undefined
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith('/')) return raw
  // 去掉 ./ 前缀，再去掉 contents/ 前缀（因为 contents/ 即 publicDir）
  const cleaned = raw.replace(/^\.\//, '').replace(/^contents\//, '')
  return `/${cleaned}`
}

/**
 * 定义 Tsuki 配置
 * 提供类型安全与智能提示，将用户配置与默认值深度合并
 */
export function defineConfig(config: TsukiUserConfig): TsukiConfig {
  const merged: TsukiConfig = {
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
    friends: config.friends,
  }

  // 归一化所有资源路径
  if (merged.site.faviconHref) {
    merged.site.faviconHref = normalizeHref(merged.site.faviconHref)
  }
  if (merged.profile?.avatar) {
    merged.profile.avatar = normalizeHref(merged.profile.avatar)
  }
  if (merged.hero?.backgroundImage?.href) {
    merged.hero.backgroundImage.href = normalizeHref(merged.hero.backgroundImage.href)!
  }
  if (merged.hero?.backgroundImages) {
    merged.hero.backgroundImages = merged.hero.backgroundImages.map((img) => ({
      ...img,
      href: normalizeHref(img.href)!,
    }))
  }
  if (merged.friends) {
    merged.friends = merged.friends.map((f) => ({
      ...f,
      avatar: normalizeHref(f.avatar),
    }))
  }

  return merged
}
