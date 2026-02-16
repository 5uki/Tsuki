import type { MomentContent, PostContent, SidebarCountItem, SidebarData } from '@contracts/content'
import type { AppContext } from '@contracts/context'
import { toSlug } from '@atoms/post-cards'

export async function getPostCards(ctx: AppContext): Promise<PostContent[]> {
  return ctx.content.getPosts()
}

export async function getPostDetail(
  ctx: AppContext,
  slug: string
): Promise<PostContent | null> {
  return ctx.content.getPostBySlug(slug)
}

export async function getMoments(ctx: AppContext): Promise<MomentContent[]> {
  return ctx.content.getMoments()
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
  const posts = await ctx.content.getPosts()
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
