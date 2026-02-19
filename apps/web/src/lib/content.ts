/**
 * 内容数据层 — Content Collections 访问 + 数据编排
 *
 * 合并了原 adapters/content.ts 和 usecases/content.ts：
 * - Astro Content Collections API 调用
 * - 侧边栏/日历等聚合查询
 */

import { getCollection, getEntry, render } from 'astro:content'
import { countWords } from './utils/word-count'
import { toSlug } from './utils/post-cards'
import type {
  PostEntry,
  PostContent,
  MomentEntry,
  MomentContent,
  SidebarCountItem,
  SidebarData,
  CalendarData,
  CalendarIndex,
} from './types/content'

// ── 基础数据访问 ──

export async function getPostEntries(): Promise<PostEntry[]> {
  const entries = await getCollection('posts')
  return entries.map((entry) => ({
    slug: entry.id,
    frontmatter: entry.data,
    words: countWords(entry.body ?? ''),
  }))
}

export async function getPostBySlug(slug: string): Promise<PostContent | null> {
  const entry = await getEntry('posts', slug)
  if (!entry) return null
  const rendered = await render(entry)
  return {
    slug: entry.id,
    frontmatter: entry.data,
    words: countWords(entry.body ?? ''),
    Content: rendered.Content,
    headings: rendered.headings,
  }
}

export async function getMomentEntries(): Promise<MomentEntry[]> {
  const entries = await getCollection('moments')
  return entries.map((entry) => ({
    id: entry.id,
    frontmatter: entry.data,
    body: entry.body,
  }))
}

export async function getMomentById(id: string): Promise<MomentContent | null> {
  const entry = await getEntry('moments', id)
  if (!entry) return null
  const rendered = await render(entry)
  return {
    id: entry.id,
    frontmatter: entry.data,
    Content: rendered.Content,
    headings: rendered.headings,
  }
}

// ── 聚合查询 ──

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

export async function getSidebarData(): Promise<SidebarData> {
  const posts = await getPostEntries()
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
  year: number,
  month: number
): Promise<CalendarData> {
  const posts = await getPostEntries()
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

export async function getCalendarDataForCurrentMonth(): Promise<CalendarData> {
  const now = new Date()
  return getCalendarData(now.getFullYear(), now.getMonth() + 1)
}

export async function getCalendarIndex(): Promise<CalendarIndex> {
  const posts = await getPostEntries()
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

  Object.values(index).forEach((articles) => {
    articles.sort((a, b) => a.day - b.day)
  })

  return index
}
