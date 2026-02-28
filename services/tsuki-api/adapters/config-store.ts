/**
 * Config Store 适配器
 *
 * 复用现有 settings 表，使用 _cfg: 前缀区分系统配置与站点配置。
 * 不需要新的 D1 迁移——settings(key TEXT PK, value_json TEXT, updated_at INT) 完全满足需求。
 */

import type { Env, ResolvedConfig } from '@contracts/env'

export interface ConfigStore {
  get(key: string): Promise<string | undefined>
  set(key: string, value: string): Promise<void>
  getMulti(keys: string[]): Promise<Record<string, string | undefined>>
  setMulti(entries: Record<string, string>): Promise<void>
  isInitialized(): Promise<boolean>
}

const CFG_PREFIX = '_cfg:'

export function createConfigStore(db: D1Database): ConfigStore {
  return {
    async get(key: string): Promise<string | undefined> {
      const row = await db
        .prepare('SELECT value_json FROM settings WHERE key = ?')
        .bind(CFG_PREFIX + key)
        .first<{ value_json: string }>()
      if (!row) return undefined
      try {
        return JSON.parse(row.value_json).value
      } catch {
        return undefined
      }
    },

    async set(key: string, value: string): Promise<void> {
      await db
        .prepare('INSERT OR REPLACE INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)')
        .bind(CFG_PREFIX + key, JSON.stringify({ value }), Date.now())
        .run()
    },

    async getMulti(keys: string[]): Promise<Record<string, string | undefined>> {
      if (keys.length === 0) return {}

      const placeholders = keys.map(() => '?').join(', ')
      const bindKeys = keys.map((k) => CFG_PREFIX + k)

      const { results } = await db
        .prepare(`SELECT key, value_json FROM settings WHERE key IN (${placeholders})`)
        .bind(...bindKeys)
        .all<{ key: string; value_json: string }>()

      const out: Record<string, string | undefined> = {}
      for (const k of keys) out[k] = undefined

      for (const row of results) {
        const rawKey = row.key.slice(CFG_PREFIX.length)
        try {
          out[rawKey] = JSON.parse(row.value_json).value
        } catch {
          // skip malformed
        }
      }

      return out
    },

    async setMulti(entries: Record<string, string>): Promise<void> {
      const stmt = db.prepare(
        'INSERT OR REPLACE INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)'
      )
      const now = Date.now()
      const batch = Object.entries(entries).map(([k, v]) =>
        stmt.bind(CFG_PREFIX + k, JSON.stringify({ value: v }), now)
      )
      await db.batch(batch)
    },

    async isInitialized(): Promise<boolean> {
      const row = await db
        .prepare('SELECT value_json FROM settings WHERE key = ?')
        .bind(CFG_PREFIX + 'GITHUB_OAUTH_CLIENT_ID')
        .first<{ value_json: string }>()
      if (!row) return false
      try {
        const val = JSON.parse(row.value_json).value
        return typeof val === 'string' && val.length > 0
      } catch {
        return false
      }
    },
  }
}

/** 配置键列表 */
const CONFIG_KEYS = [
  'GITHUB_OAUTH_CLIENT_ID',
  'GITHUB_OAUTH_CLIENT_SECRET',
  'TSUKI_SESSION_SIGNING_SECRET',
  'TSUKI_CSRF_SALT',
  'TSUKI_PUBLIC_ORIGIN',
  'TSUKI_ADMIN_GITHUB_IDS',
  'TSUKI_SESSION_TTL_MS',
  'GITHUB_TOKEN',
  'GITHUB_REPO_OWNER',
  'GITHUB_REPO_NAME',
  'CF_TURNSTILE_SECRET_KEY',
] as const

/**
 * 合并 env var + D1 _cfg: 配置，生成 ResolvedConfig。
 * 优先级: env var > D1 _cfg: value > 默认值（空字符串）
 */
export async function resolveConfig(db: D1Database, env: Env): Promise<ResolvedConfig> {
  const store = createConfigStore(db)
  const d1Values = await store.getMulti([...CONFIG_KEYS])

  const resolve = (key: (typeof CONFIG_KEYS)[number], fallback?: string): string =>
    (env[key as keyof Env] as string | undefined) || d1Values[key] || fallback || ''

  const clientId = resolve('GITHUB_OAUTH_CLIENT_ID')

  return {
    isInitialized: !!clientId,
    TSUKI_PUBLIC_ORIGIN: resolve('TSUKI_PUBLIC_ORIGIN'),
    GITHUB_OAUTH_CLIENT_ID: clientId,
    GITHUB_OAUTH_CLIENT_SECRET: resolve('GITHUB_OAUTH_CLIENT_SECRET'),
    TSUKI_SESSION_SIGNING_SECRET: resolve('TSUKI_SESSION_SIGNING_SECRET'),
    TSUKI_CSRF_SALT: resolve('TSUKI_CSRF_SALT'),
    TSUKI_ADMIN_GITHUB_IDS: resolve('TSUKI_ADMIN_GITHUB_IDS'),
    TSUKI_SESSION_TTL_MS: resolve('TSUKI_SESSION_TTL_MS', '1209600000'),
    GITHUB_TOKEN: resolve('GITHUB_TOKEN') || undefined,
    GITHUB_REPO_OWNER: resolve('GITHUB_REPO_OWNER') || undefined,
    GITHUB_REPO_NAME: resolve('GITHUB_REPO_NAME') || undefined,
    CF_TURNSTILE_SECRET_KEY: resolve('CF_TURNSTILE_SECRET_KEY') || undefined,
  }
}
