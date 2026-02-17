import type { MarkdownHeading } from 'astro'

export interface PostFrontmatter {
  title: string
  summary: string
  publishedAt: string
  category: string
  tags: string[]
  words: number
  cover?: string
  pinned?: boolean
}

export interface MomentFrontmatter {
  title: string
  publishedAt: string
  tags?: string[]
}

/** 文章列表项（不含渲染后的内容） */
export interface PostEntry {
  slug: string
  frontmatter: PostFrontmatter
}

/** 文章详情（含渲染后的内容和标题树） */
export interface PostContent extends PostEntry {
  Content: any
  headings: MarkdownHeading[]
}

/** 动态列表项 */
export interface MomentEntry {
  id: string
  frontmatter: MomentFrontmatter
}

/** 动态详情 */
export interface MomentContent extends MomentEntry {
  Content: any
  headings: MarkdownHeading[]
}

export interface SidebarStats {
  posts: number
  tags: number
  groups: number
}

export interface SidebarCountItem {
  name: string
  count: number
  slug: string
}

export interface SidebarData {
  stats: SidebarStats
  categories: SidebarCountItem[]
  tags: SidebarCountItem[]
}
