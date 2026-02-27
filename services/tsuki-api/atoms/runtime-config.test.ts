import { describe, it, expect } from 'vitest'
import { resolveRuntimeConfig } from './runtime-config'

describe('resolveRuntimeConfig', () => {
  const settingsPort = {
    async getPublicSettings() {
      throw new Error('not used')
    },
    async getValue<T>(key: string): Promise<T | null> {
      const map: Record<string, string> = {
        'runtime.github_repo_owner': 'd1-owner',
      }
      return (map[key] as T) ?? null
    },
    async setValue() {
      return
    },
  }

  it('prefers env over d1', async () => {
    const env = {
      TSUKI_PUBLIC_ORIGIN: 'https://example.com',
      TSUKI_ADMIN_GITHUB_IDS: '1',
      GITHUB_OAUTH_CLIENT_ID: 'env-id',
      GITHUB_OAUTH_CLIENT_SECRET: 'env-secret',
      TSUKI_SESSION_SIGNING_SECRET: 'x',
      TSUKI_CSRF_SALT: 'y',
      TSUKI_SESSION_TTL_MS: '1',
      GITHUB_REPO_OWNER: 'env-owner',
      GITHUB_REPO_NAME: 'env-repo',
      GITHUB_TOKEN: 'env-token',
      DB: {} as D1Database,
    }

    const result = await resolveRuntimeConfig(env, settingsPort)
    expect(result.config.githubRepoOwner).toBe('env-owner')
    expect(result.sourceByField.githubRepoOwner).toBe('env')
  })

  it('falls back to d1 when env empty', async () => {
    const env = {
      TSUKI_PUBLIC_ORIGIN: 'https://example.com',
      TSUKI_ADMIN_GITHUB_IDS: '1',
      GITHUB_OAUTH_CLIENT_ID: 'env-id',
      GITHUB_OAUTH_CLIENT_SECRET: 'env-secret',
      TSUKI_SESSION_SIGNING_SECRET: 'x',
      TSUKI_CSRF_SALT: 'y',
      TSUKI_SESSION_TTL_MS: '1',
      GITHUB_REPO_OWNER: '',
      GITHUB_REPO_NAME: 'env-repo',
      GITHUB_TOKEN: 'env-token',
      DB: {} as D1Database,
    }

    const result = await resolveRuntimeConfig(env, settingsPort)
    expect(result.config.githubRepoOwner).toBe('d1-owner')
    expect(result.sourceByField.githubRepoOwner).toBe('d1')
  })
})
