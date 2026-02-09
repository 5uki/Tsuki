import type { MarkdownHeading, MarkdownInstance } from 'astro'

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

export interface PostContent {
  slug: string
  frontmatter: PostFrontmatter
  Content: MarkdownInstance<PostFrontmatter>['Content']
  headings: MarkdownHeading[]
}

export interface MomentContent {
  id: string
  frontmatter: MomentFrontmatter
  Content: MarkdownInstance<MomentFrontmatter>['Content']
  headings: MarkdownHeading[]
}

export interface SidebarStats {
  posts: number
  tags: number
  groups: number
}

export interface SidebarCategoryItem {
  name: string
  count: number
  slug: string
}

export interface SidebarTagItem {
  name: string
  count: number
  slug: string
}

export interface SidebarData {
  stats: SidebarStats
  categories: SidebarCategoryItem[]
  tags: SidebarTagItem[]
}
