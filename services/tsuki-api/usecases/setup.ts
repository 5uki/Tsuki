import type { Env } from '@contracts/env'
import type { SettingsPort } from '@contracts/ports'
import type { SetupConfigDTO, SetupStatusDTO } from '@contracts/dto'
import { resolveRuntimeConfig } from '@atoms/runtime-config'

const REQUIRED_FOR_READY: Array<keyof SetupConfigDTO> = [
  'public_origin',
  'admin_github_ids',
  'github_oauth_client_id',
  'github_oauth_client_secret',
  'github_repo_owner',
  'github_repo_name',
  'github_token',
]

function toDTO(config: {
  publicOrigin: string
  adminGithubIds: string
  oauthClientId: string
  oauthClientSecret: string
  githubRepoOwner: string
  githubRepoName: string
  githubToken: string
}): SetupConfigDTO {
  return {
    public_origin: config.publicOrigin,
    admin_github_ids: config.adminGithubIds,
    github_oauth_client_id: config.oauthClientId,
    github_oauth_client_secret: config.oauthClientSecret,
    github_repo_owner: config.githubRepoOwner,
    github_repo_name: config.githubRepoName,
    github_token: config.githubToken,
  }
}

export async function getSetupStatus(input: {
  env: Env
  settingsPort: SettingsPort
  requestOrigin: string
}): Promise<SetupStatusDTO> {
  const resolved = await resolveRuntimeConfig(input.env, input.settingsPort)
  const config = toDTO(resolved.config)

  const missing = REQUIRED_FOR_READY.filter((key) => !config[key])
  const sourceKinds = new Set(Object.values(resolved.sourceByField))
  const mode: SetupStatusDTO['mode'] = sourceKinds.has('env')
    ? sourceKinds.has('d1')
      ? 'mixed'
      : 'env'
    : sourceKinds.has('d1')
      ? 'd1'
      : 'none'

  const callbackBase = config.public_origin || input.requestOrigin

  return {
    ready: missing.length === 0,
    mode,
    missing,
    config,
    guides: {
      oauth_callback_url: `${callbackBase}/v1/auth/github/callback`,
      oauth_note:
        '在 GitHub OAuth App 中填写 Homepage URL 为站点域名，Authorization callback URL 为上面的回调地址。',
      publish_note:
        '发布文章需要配置 github_repo_owner / github_repo_name / github_token。token 需要 repo 内容写入权限。',
    },
  }
}

export async function saveSetupConfig(input: {
  settingsPort: SettingsPort
  config: SetupConfigDTO
}): Promise<void> {
  await input.settingsPort.setValue('runtime.public_origin', input.config.public_origin)
  await input.settingsPort.setValue('runtime.admin_github_ids', input.config.admin_github_ids)
  await input.settingsPort.setValue(
    'runtime.github_oauth_client_id',
    input.config.github_oauth_client_id
  )
  await input.settingsPort.setValue(
    'runtime.github_oauth_client_secret',
    input.config.github_oauth_client_secret
  )
  await input.settingsPort.setValue('runtime.github_repo_owner', input.config.github_repo_owner)
  await input.settingsPort.setValue('runtime.github_repo_name', input.config.github_repo_name)
  await input.settingsPort.setValue('runtime.github_token', input.config.github_token)
}
