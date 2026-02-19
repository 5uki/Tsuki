/**
 * GitHub OAuth 适配器 - HTTP 实现
 */

import type { GitHubOAuthPort } from '@contracts/ports'

export function createGitHubOAuthAdapter(
  clientId: string,
  clientSecret: string
): GitHubOAuthPort {
  return {
    getAuthorizationUrl(state: string): string {
      const params = new URLSearchParams({
        client_id: clientId,
        scope: 'read:user',
        state,
      })
      return `https://github.com/login/oauth/authorize?${params.toString()}`
    },

    async exchangeCodeForToken(code: string): Promise<string> {
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      })

      if (!res.ok) {
        throw new Error(`GitHub token exchange failed: ${res.status}`)
      }

      const data = (await res.json()) as {
        access_token?: string
        error?: string
        error_description?: string
      }

      if (data.error || !data.access_token) {
        throw new Error(
          `GitHub OAuth error: ${data.error_description || data.error || 'no access_token'}`
        )
      }

      return data.access_token
    },

    async getGitHubUser(accessToken: string) {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'Tsuki-Blog',
        },
      })

      if (!res.ok) {
        throw new Error(`GitHub user API failed: ${res.status}`)
      }

      const user = (await res.json()) as {
        id: number
        login: string
        avatar_url: string
        html_url: string
      }

      return {
        github_id: user.id,
        login: user.login,
        avatar_url: user.avatar_url,
        profile_url: user.html_url,
      }
    },
  }
}
