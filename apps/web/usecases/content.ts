import type { PostEntry, PostContent, MomentEntry, MomentContent, SidebarCountItem, SidebarData } from '@contracts/content'
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

  posts.forEach((post) => {
    if (post.frontmatter.category) {
      countBy(categoriesMap, post.frontmatter.category)
    }
    post.frontmatter.tags.forEach((tag) => countBy(tagsMap, tag))
  })

  const categories = sortedValues(categoriesMap)
  const tags = sortedValues(tagsMap)

  return {
    stats: {
      posts: posts.length,
      tags: tags.length,
      groups: categories.length,
    },
    categories,
    tags,
  }
}
