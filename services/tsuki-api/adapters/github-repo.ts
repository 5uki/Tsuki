/**
 * GitHub Repo 适配器
 * 通过 GitHub API 读写仓库内容
 */

import type { GitHubRepoPort } from '@contracts/ports'
import { AppError } from '@contracts/errors'

const GITHUB_API = 'https://api.github.com'

interface GitHubTreeItem {
  path: string
  mode: '100644' | '100755' | '040000' | '160000' | '120000'
  type: 'blob' | 'tree' | 'commit'
  sha?: string | null
}

export function createGitHubRepoAdapter(
  token: string,
  owner: string,
  repo: string
): GitHubRepoPort {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  async function ghFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${GITHUB_API}${path}`, {
      ...init,
      headers: { ...headers, ...init?.headers },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new AppError('GITHUB_API_ERROR', `GitHub API ${res.status}: ${body.slice(0, 200)}`)
    }
    return res.json() as Promise<T>
  }

  return {
    async getFile(path) {
      const data = await ghFetch<{
        content: string
        sha: string
        encoding: string
      }>(`/repos/${owner}/${repo}/contents/${path}`)

      const content =
        data.encoding === 'base64' ? atob(data.content.replace(/\n/g, '')) : data.content

      return { content, sha: data.sha }
    },

    async listDirectory(path) {
      const data = await ghFetch<
        Array<{
          name: string
          path: string
          type: 'file' | 'dir'
          sha: string
        }>
      >(`/repos/${owner}/${repo}/contents/${path}`)

      return data.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        sha: item.sha,
      }))
    },

    async batchCommit(changes, message) {
      const branch = 'main'

      // 1. GET ref → latest commit SHA
      const refData = await ghFetch<{ object: { sha: string } }>(
        `/repos/${owner}/${repo}/git/ref/heads/${branch}`
      )
      const latestCommitSha = refData.object.sha

      // 2. GET commit → base tree SHA
      const commitData = await ghFetch<{ tree: { sha: string } }>(
        `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`
      )
      const baseTreeSha = commitData.tree.sha

      // 3. Create blobs for new/updated files
      const treeItems: GitHubTreeItem[] = []

      for (const change of changes) {
        if (change.action === 'delete') {
          treeItems.push({
            path: change.path,
            mode: '100644',
            type: 'blob',
            sha: null,
          })
        } else {
          // create or update
          const encoding = change.encoding === 'base64' ? 'base64' : 'utf-8'
          const blobData = await ghFetch<{ sha: string }>(`/repos/${owner}/${repo}/git/blobs`, {
            method: 'POST',
            body: JSON.stringify({
              content: change.content ?? '',
              encoding,
            }),
          })
          treeItems.push({
            path: change.path,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha,
          })
        }
      }

      // 4. Create tree
      const treeData = await ghFetch<{ sha: string }>(`/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      })

      // 5. Create commit
      const newCommitData = await ghFetch<{ sha: string; html_url: string }>(
        `/repos/${owner}/${repo}/git/commits`,
        {
          method: 'POST',
          body: JSON.stringify({
            message,
            tree: treeData.sha,
            parents: [latestCommitSha],
          }),
        }
      )

      // 6. Update ref
      await ghFetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        body: JSON.stringify({
          sha: newCommitData.sha,
        }),
      })

      return { sha: newCommitData.sha, url: newCommitData.html_url }
    },
  }
}
