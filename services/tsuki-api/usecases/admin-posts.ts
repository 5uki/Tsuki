/**
 * Admin Posts 用例
 * 读取 GitHub 仓库中的文章
 */

import type { GitHubRepoPort } from '@contracts/ports'
import type { AdminPostDTO } from '@contracts/dto'
import { AppError } from '@contracts/errors'

const POSTS_DIR = 'contents/posts'

/**
 * 简单的 frontmatter 解析器
 */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }

  const frontmatterStr = match[1]!
  const content = match[2]!
  const data: Record<string, unknown> = {}

  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value: unknown = line.slice(colonIdx + 1).trim()

    // Handle arrays like [tag1, tag2]
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''))
    }
    // Handle booleans
    else if (value === 'true') value = true
    else if (value === 'false') value = false
    // Strip quotes
    else if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    } else if (typeof value === 'string' && value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }

    data[key] = value
  }

  return { data, content }
}

// ─── ListPosts ───

export interface ListPostsInput {
  githubRepoPort: GitHubRepoPort
}

export async function listPosts(input: ListPostsInput): Promise<AdminPostDTO[]> {
  const files = await input.githubRepoPort.listDirectory(POSTS_DIR)
  const mdFiles = files.filter(f => f.name.endsWith('.md') || f.name.endsWith('.mdx'))

  const posts: AdminPostDTO[] = []
  for (const file of mdFiles) {
    try {
      const { content, sha } = await input.githubRepoPort.getFile(file.path)
      const { data } = parseFrontmatter(content)
      const slug = file.name.replace(/\.mdx?$/, '')

      posts.push({
        slug,
        title: String(data.title || slug),
        summary: String(data.summary || data.description || ''),
        date: data.date ? String(data.date) : null,
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        categories: Array.isArray(data.categories) ? data.categories.map(String) : [],
        cover: data.cover ? String(data.cover) : null,
        status: (data.status as 'draft' | 'published' | 'unlisted') || 'published',
        content_markdown: '',  // List view doesn't include full content
        sha,
      })
    } catch {
      // Skip files that can't be read
    }
  }

  return posts
}

// ─── GetPost ───

export interface GetPostInput {
  slug: string
  githubRepoPort: GitHubRepoPort
}

export async function getPost(input: GetPostInput): Promise<AdminPostDTO> {
  // Try .md then .mdx
  let content: string
  let sha: string
  try {
    const result = await input.githubRepoPort.getFile(`${POSTS_DIR}/${input.slug}.md`)
    content = result.content
    sha = result.sha
  } catch {
    try {
      const result = await input.githubRepoPort.getFile(`${POSTS_DIR}/${input.slug}.mdx`)
      content = result.content
      sha = result.sha
    } catch {
      throw new AppError('NOT_FOUND', `Post "${input.slug}" not found`)
    }
  }

  const { data, content: body } = parseFrontmatter(content)

  return {
    slug: input.slug,
    title: String(data.title || input.slug),
    summary: String(data.summary || data.description || ''),
    date: data.date ? String(data.date) : null,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    categories: Array.isArray(data.categories) ? data.categories.map(String) : [],
    cover: data.cover ? String(data.cover) : null,
    status: (data.status as 'draft' | 'published' | 'unlisted') || 'published',
    content_markdown: body,
    sha,
  }
}
