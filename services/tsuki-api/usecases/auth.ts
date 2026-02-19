/**
 * Auth 用例
 */

import type { UserDTO } from '@contracts/dto'
import type { SessionPort, UsersPort, GitHubOAuthPort } from '@contracts/ports'
import { AppError } from '@contracts/errors'
import { sha256 } from '@atoms/hash'
import { createTimeDTO } from '@tsuki/shared/time'

// ─── StartGithubOAuth ───

export interface StartGithubOAuthInput {
  returnTo: string
  oauthPort: GitHubOAuthPort
}

export interface StartGithubOAuthResult {
  authorizationUrl: string
  state: string
  returnTo: string
}

export function startGithubOAuth(input: StartGithubOAuthInput): StartGithubOAuthResult {
  // return_to 仅允许站内路径（以 / 开头，但不能以 // 开头，防止协议相对 URL）
  const returnTo =
    input.returnTo.startsWith('/') && !input.returnTo.startsWith('//') ? input.returnTo : '/'
  const state = crypto.randomUUID()
  const authorizationUrl = input.oauthPort.getAuthorizationUrl(state)
  return { authorizationUrl, state, returnTo }
}

// ─── HandleGithubCallback ───

export interface HandleGithubCallbackInput {
  code: string
  state: string
  expectedState: string
  ip: string
  ua: string
  hashSalt: string
  sessionTtlMs: number
  oauthPort: GitHubOAuthPort
  usersPort: UsersPort
  sessionPort: SessionPort
}

export interface HandleGithubCallbackResult {
  sessionId: string
  csrfToken: string
  expiresAt: number
  user: UserDTO
  returnTo: string
}

export async function handleGithubCallback(
  input: HandleGithubCallbackInput & { returnTo: string }
): Promise<HandleGithubCallbackResult> {
  if (input.state !== input.expectedState) {
    throw new AppError('FORBIDDEN', 'OAuth state mismatch')
  }

  const accessToken = await input.oauthPort.exchangeCodeForToken(input.code)
  const githubUser = await input.oauthPort.getGitHubUser(accessToken)

  const userRecord = await input.usersPort.upsertByGithubId({
    github_id: githubUser.github_id,
    login: githubUser.login,
    avatar_url: githubUser.avatar_url,
    profile_url: githubUser.profile_url,
    role: 'user',
  })

  // IP/UA 哈希在 usecase 层完成（调用 atoms 纯函数）
  const [ipHash, uaHash] = await Promise.all([
    sha256(input.ip, input.hashSalt),
    sha256(input.ua, input.hashSalt),
  ])

  const session = await input.sessionPort.createSession({
    userId: userRecord.id,
    ipHash,
    uaHash,
    ttlMs: input.sessionTtlMs,
  })

  return {
    sessionId: session.sessionId,
    csrfToken: session.csrfToken,
    expiresAt: session.expiresAt,
    user: userRecordToDTO(userRecord),
    returnTo: input.returnTo,
  }
}

// ─── GetCurrentUser ───

export interface GetCurrentUserInput {
  sessionId: string | null
  sessionPort: SessionPort
  usersPort: UsersPort
}

export async function getCurrentUser(input: GetCurrentUserInput): Promise<UserDTO | null> {
  if (!input.sessionId) return null

  const session = await input.sessionPort.getValidSession(input.sessionId)
  if (!session) return null

  const user = await input.usersPort.getUserById(session.userId)
  if (!user) return null

  return userRecordToDTO(user)
}

// ─── Logout ───

export interface LogoutInput {
  sessionId: string | null
  sessionPort: SessionPort
}

export async function logout(input: LogoutInput): Promise<void> {
  if (input.sessionId) {
    await input.sessionPort.revokeSession(input.sessionId)
  }
}

// ─── Helper ───

function userRecordToDTO(record: {
  id: string
  github_id: number
  login: string
  avatar_url: string
  profile_url: string
  role: 'user' | 'admin'
  created_at: number
}): UserDTO {
  return {
    id: record.id,
    github_id: record.github_id,
    login: record.login,
    avatar_url: record.avatar_url,
    profile_url: record.profile_url,
    role: record.role,
    created_at: createTimeDTO(record.created_at),
  }
}
