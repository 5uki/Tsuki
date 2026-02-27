/**
 * Settings 适配器 - D1 实现
 */

import type { SettingsPort } from '@contracts/ports'
import type { SettingsPublicDTO, NavLink } from '@contracts/dto'

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
export function createSettingsAdapter(db: D1Database): SettingsPort {
  return {
    async getPublicSettings(): Promise<SettingsPublicDTO> {
      try {
        const { results } = await db
          .prepare('SELECT key, value_json FROM settings')
          .all<{ key: string; value_json: string }>()

        const map = new Map<string, unknown>()
        for (const row of results) {
          try {
            const parsed = JSON.parse(row.value_json)
            map.set(row.key, parsed.value)
          } catch {
            // Skip malformed rows
          }
        }

        return {
          site_title:
            typeof map.get('site_title') === 'string'
              ? (map.get('site_title') as string)
              : DEFAULT_SETTINGS.site_title,
          site_description:
            typeof map.get('site_description') === 'string'
              ? (map.get('site_description') as string)
              : DEFAULT_SETTINGS.site_description,
          default_theme:
            typeof map.get('default_theme') === 'string'
              ? (map.get('default_theme') as string)
              : DEFAULT_SETTINGS.default_theme,
          nav_links: Array.isArray(map.get('nav_links'))
            ? (map.get('nav_links') as NavLink[])
            : DEFAULT_SETTINGS.nav_links,
        }
      } catch {
        return DEFAULT_SETTINGS
      }
    },

    async getValue<T>(key: string): Promise<T | null> {
      try {
        const row = await db
          .prepare('SELECT value_json FROM settings WHERE key = ?')
          .bind(key)
          .first<{ value_json: string }>()

        if (!row) return null
        const parsed = JSON.parse(row.value_json) as { value?: T }
        return parsed.value ?? null
      } catch {
        return null
      }
    },

    async setValue(key: string, value: unknown): Promise<void> {
      const now = Date.now()
      const valueJson = JSON.stringify({ value })
      await db
        .prepare(
          `INSERT INTO settings (key, value_json, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`
        )
        .bind(key, valueJson, now)
        .run()
    },
  }
}
