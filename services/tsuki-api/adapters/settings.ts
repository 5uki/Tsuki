/**
 * Settings 适配器 - D1 实现
 */

import type { SettingsPort } from '@contracts/ports'
import type { SettingsPublicDTO } from '@contracts/dto'

/**
 * 默认配置
 */
const DEFAULT_SETTINGS: SettingsPublicDTO = {
  site_title: 'Tsuki',
  site_description: '一个认真写字的地方',
  default_theme: 'paper',
  nav_links: [
    { label: '文章', href: '/posts' },
    { label: '动态', href: '/moments' },
    { label: '标签', href: '/tags' },
    { label: '分组', href: '/groups' },
  ],
}

/**
 * 创建 Settings 适配器
 */
export function createSettingsAdapter(_db: D1Database): SettingsPort {
  return {
    async getPublicSettings(): Promise<SettingsPublicDTO> {
      // TODO: 从 D1 读取配置
      // 目前返回默认配置
      return DEFAULT_SETTINGS
    },
  }
}
