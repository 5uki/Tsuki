import type { MomentEntry } from '@/lib/types/content'

export interface MomentCardItem {
  id: string
  title: string
  publishedAt: string
  summary: string
  category?: string
  series?: string
  media: string[]
  tags: string[]
}

export interface MomentDateGroup {
  date: string
  items: MomentCardItem[]
}

/** 图片 URL 安全校验：仅允许 https:// 或 /media/ 开头 */
export function isSafeImageUrl(url: string): boolean {
  return url.startsWith('https://') || url.startsWith('/media/')
}

/** 过滤并返回安全的图片 URL 列表 */
export function filterSafeMedia(media: string[] | undefined): string[] {
  if (!media) return []
  return media.filter(isSafeImageUrl)
}

/** 截取摘要，最多 maxLen 字符 */
export function truncateSummary(text: string, maxLen = 120): string {
  const cleaned = text.replace(/\n+/g, ' ').trim()
  if (cleaned.length <= maxLen) return cleaned
  return cleaned.slice(0, maxLen) + '...'
}

/** 将动态列表按日期分组，同一天归为一组，按时间倒序 */
export function groupMomentsByDate(
  moments: MomentEntry[],
  bodyMap?: Map<string, string>
): MomentDateGroup[] {
  const sorted = [...moments].sort(
    (a, b) => b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt)
  )

  const groupMap = new Map<string, MomentCardItem[]>()

  for (const m of sorted) {
    const date = m.frontmatter.publishedAt
    const body = bodyMap?.get(m.id) ?? ''
    const item: MomentCardItem = {
      id: m.id,
      title: m.frontmatter.title,
      publishedAt: date,
      summary: truncateSummary(body),
      category: m.frontmatter.category,
      series: m.frontmatter.series,
      media: filterSafeMedia(m.frontmatter.media),
      tags: m.frontmatter.tags ?? [],
    }

    const existing = groupMap.get(date)
    if (existing) {
      existing.push(item)
    } else {
      groupMap.set(date, [item])
    }
  }

  return Array.from(groupMap.entries()).map(([date, items]) => ({
    date,
    items,
  }))
}
