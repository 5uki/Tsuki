export interface PostCardItem {
  slug: string
  title: string
  summary: string
  publishedAt: string
  category: string
  words: number
  tags: string[]
  pinned?: boolean
  cover?: string
}

import type { PostContent } from '@contracts/content'

export function toPostCardItems(posts: PostContent[]): PostCardItem[] {
  return posts
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title,
      summary: post.frontmatter.summary,
      publishedAt: post.frontmatter.publishedAt,
      category: post.frontmatter.category,
      words: post.frontmatter.words,
      tags: post.frontmatter.tags,
      pinned: post.frontmatter.pinned,
      cover: post.frontmatter.cover,
    }))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.publishedAt.localeCompare(a.publishedAt)
    })
}
