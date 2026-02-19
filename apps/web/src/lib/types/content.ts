import type { MarkdownHeading } from 'astro'

export interface PostFrontmatter {
  title: string
  summary: string
  publishedAt: string
  category?: string
  series?: string
  tags: string[]
  cover?: string
  pinned?: boolean
}

export interface MomentFrontmatter {
  title: string
  publishedAt: string
  category?: string
  series?: string
  tags?: string[]
  media?: string[]
}

/** 文章列表项（不含渲染后的内容） */
export interface PostEntry {
  slug: string
  frontmatter: PostFrontmatter
  words: number
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
  body?: string
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
  series: SidebarCountItem[]
}

export interface CalendarArticle {
  slug: string
  title: string
  day: number
}

export interface CalendarData {
  year: number
  month: number
  articles: CalendarArticle[]
}

/** 所有文章的发布日期映射，用于日历客户端切换月份 */
export interface CalendarIndex {
  [yearMonth: string]: CalendarArticle[]
}
