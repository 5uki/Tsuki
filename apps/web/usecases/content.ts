import type { PostEntry, PostContent, MomentEntry, MomentContent, SidebarCountItem, SidebarData, CalendarData, CalendarIndex } from '@contracts/content'
import type { AppContext } from '@contracts/context'
import { toSlug } from '@atoms/post-cards'

export async function getPostEntries(ctx: AppContext): Promise<PostEntry[]> {
  return ctx.content.getPostEntries()
}

export async function getPostDetail(
  ctx: AppContext,
  slug: string
): Promise<PostContent | null> {
  return ctx.content.getPostBySlug(slug)
}

export async function getMomentEntries(ctx: AppContext): Promise<MomentEntry[]> {
  return ctx.content.getMomentEntries()
}

export async function getMomentDetail(
  ctx: AppContext,
  id: string
): Promise<MomentContent | null> {
  return ctx.content.getMomentById(id)
}

function countBy(map: Map<string, SidebarCountItem>, name: string): void {
  const key = toSlug(name)
  const existing = map.get(key)
  if (existing) {
    existing.count += 1
  } else {
    map.set(key, { name, count: 1, slug: key })
  }
}

function sortedValues(map: Map<string, SidebarCountItem>): SidebarCountItem[] {
  return Array.from(map.values()).sort((a, b) => b.count - a.count)
}

export async function getSidebarData(ctx: AppContext): Promise<SidebarData> {
  const posts = await ctx.content.getPostEntries()
  const tagsMap = new Map<string, SidebarCountItem>()
  const categoriesMap = new Map<string, SidebarCountItem>()
  const seriesMap = new Map<string, SidebarCountItem>()

  posts.forEach((post) => {
    if (post.frontmatter.category) {
      countBy(categoriesMap, post.frontmatter.category)
    }
    if (post.frontmatter.series) {
      countBy(seriesMap, post.frontmatter.series)
    }
    post.frontmatter.tags.forEach((tag) => countBy(tagsMap, tag))
  })

  const categories = sortedValues(categoriesMap)
  const tags = sortedValues(tagsMap)
  const series = sortedValues(seriesMap)

  return {
    stats: {
      posts: posts.length,
      tags: tags.length,
      groups: categories.length,
    },
    categories,
    tags,
    series,
  }
}

export async function getCalendarData(
  ctx: AppContext,
  year: number,
  month: number
): Promise<CalendarData> {
  const posts = await ctx.content.getPostEntries()
  const articles = posts
    .filter((post) => {
      const date = new Date(post.frontmatter.publishedAt)
      return date.getFullYear() === year && date.getMonth() + 1 === month
    })
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title,
      day: new Date(post.frontmatter.publishedAt).getDate(),
    }))
    .sort((a, b) => a.day - b.day)

  return { year, month, articles }
}

export async function getCalendarDataForCurrentMonth(
  ctx: AppContext
): Promise<CalendarData> {
  const now = new Date()
  return getCalendarData(ctx, now.getFullYear(), now.getMonth() + 1)
}

export async function getCalendarIndex(
  ctx: AppContext
): Promise<CalendarIndex> {
  const posts = await ctx.content.getPostEntries()
  const index: CalendarIndex = {}

  posts.forEach((post) => {
    const date = new Date(post.frontmatter.publishedAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!index[key]) {
      index[key] = []
    }
    index[key].push({
      slug: post.slug,
      title: post.frontmatter.title,
      day: date.getDate(),
    })
  })

  // Sort articles within each month by day
  Object.values(index).forEach((articles) => {
    articles.sort((a, b) => a.day - b.day)
  })

  return index
}
