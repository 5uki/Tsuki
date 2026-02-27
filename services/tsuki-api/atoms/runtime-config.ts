import type { Env } from '@contracts/env'
import type { SettingsPort } from '@contracts/ports'

export interface RuntimeConfig {
  publicOrigin: string
  adminGithubIds: string
  oauthClientId: string
  oauthClientSecret: string
  githubRepoOwner: string
  githubRepoName: string
  githubToken: string
}

interface ResolvedField {
  value: string
  source: 'env' | 'd1' | 'none'
}

export interface ResolvedRuntimeConfig {
  config: RuntimeConfig
  sourceByField: Record<keyof RuntimeConfig, ResolvedField['source']>
}

function normalize(value: string | null | undefined): string {
  return (value || '').trim()
}

async function readWithPriority(
  envValue: string | undefined,
  d1Key: string,
  settingsPort: SettingsPort
): Promise<ResolvedField> {
  const fromEnv = normalize(envValue)
  if (fromEnv) {
    return { value: fromEnv, source: 'env' }
  }

  const fromD1 = normalize(await settingsPort.getValue<string>(d1Key))
  if (fromD1) {
    return { value: fromD1, source: 'd1' }
  }

  return { value: '', source: 'none' }
}

export async function resolveRuntimeConfig(
  env: Env,
  settingsPort: SettingsPort
): Promise<ResolvedRuntimeConfig> {
  const fields = {
    publicOrigin: await readWithPriority(
      env.TSUKI_PUBLIC_ORIGIN,
      'runtime.public_origin',
      settingsPort
    ),
    adminGithubIds: await readWithPriority(
      env.TSUKI_ADMIN_GITHUB_IDS,
      'runtime.admin_github_ids',
      settingsPort
    ),
    oauthClientId: await readWithPriority(
      env.GITHUB_OAUTH_CLIENT_ID,
      'runtime.github_oauth_client_id',
      settingsPort
    ),
    oauthClientSecret: await readWithPriority(
      env.GITHUB_OAUTH_CLIENT_SECRET,
      'runtime.github_oauth_client_secret',
      settingsPort
    ),
    githubRepoOwner: await readWithPriority(
      env.GITHUB_REPO_OWNER,
      'runtime.github_repo_owner',
      settingsPort
    ),
    githubRepoName: await readWithPriority(
      env.GITHUB_REPO_NAME,
      'runtime.github_repo_name',
      settingsPort
    ),
    githubToken: await readWithPriority(env.GITHUB_TOKEN, 'runtime.github_token', settingsPort),
  }

  return {
    config: {
      publicOrigin: fields.publicOrigin.value,
      adminGithubIds: fields.adminGithubIds.value,
      oauthClientId: fields.oauthClientId.value,
      oauthClientSecret: fields.oauthClientSecret.value,
      githubRepoOwner: fields.githubRepoOwner.value,
      githubRepoName: fields.githubRepoName.value,
      githubToken: fields.githubToken.value,
    },
    sourceByField: {
      publicOrigin: fields.publicOrigin.source,
      adminGithubIds: fields.adminGithubIds.source,
      oauthClientId: fields.oauthClientId.source,
      oauthClientSecret: fields.oauthClientSecret.source,
      githubRepoOwner: fields.githubRepoOwner.source,
      githubRepoName: fields.githubRepoName.source,
      githubToken: fields.githubToken.source,
    },
  }
}
