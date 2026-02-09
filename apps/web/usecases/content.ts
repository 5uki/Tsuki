import type { MomentContent, PostContent, SidebarData } from '@contracts/content'
import type { AppContext } from '@contracts/context'

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

function toSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\\s+/g, '-')
}

export async function getSidebarData(ctx: AppContext): Promise<SidebarData> {
  const posts = await ctx.content.getPosts()
  const tagsMap = new Map<string, { name: string; count: number; slug: string }>()
  const categoriesMap = new Map<string, { name: string; count: number; slug: string }>()

  posts.forEach((post) => {
    const category = post.frontmatter.category
    if (category) {
      const key = toSlug(category)
      const existing = categoriesMap.get(key)
      if (existing) {
        existing.count += 1
      } else {
        categoriesMap.set(key, { name: category, count: 1, slug: key })
      }
    }
    post.frontmatter.tags.forEach((tag) => {
      const key = toSlug(tag)
      const existing = tagsMap.get(key)
      if (existing) {
        existing.count += 1
      } else {
        tagsMap.set(key, { name: tag, count: 1, slug: key })
      }
    })
  })

  const categories = Array.from(categoriesMap.values()).sort((a, b) => b.count - a.count)
  const tags = Array.from(tagsMap.values()).sort((a, b) => b.count - a.count)

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
