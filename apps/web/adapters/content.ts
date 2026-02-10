import type { MomentContent, PostContent } from '@contracts/content'

export interface ContentAdapter {
  getPosts(): Promise<PostContent[]>
  getPostBySlug(slug: string): Promise<PostContent | null>
  getMoments(): Promise<MomentContent[]>
  getMomentById(id: string): Promise<MomentContent | null>
}

export function createContentAdapter(): ContentAdapter {
  return {
    async getPosts() {
      const collection = import.meta.glob('../../../contents/posts/*.md')
      const posts = await Promise.all(
        Object.entries(collection).map(async ([filepath, loader]) => {
          const module = await loader()
          const { frontmatter, Content, headings } = module as {
            frontmatter: PostContent['frontmatter']
            Content: PostContent['Content']
            headings: PostContent['headings']
          }
          const slug = filepath.split('/').pop()?.replace(/\.md$/, '') ?? ''
          return { slug, frontmatter, Content, headings }
        })
      )
      return posts
    },
    async getPostBySlug(slug) {
      const collection = import.meta.glob('../../../contents/posts/*.md')
      const entry = Object.entries(collection).find(([filepath]) =>
        filepath.endsWith(`/${slug}.md`)
      )
      if (!entry) return null
      const [filepath, loader] = entry
      const module = await loader()
      const { frontmatter, Content, headings } = module as {
        frontmatter: PostContent['frontmatter']
        Content: PostContent['Content']
        headings: PostContent['headings']
      }
      const resolvedSlug = filepath.split('/').pop()?.replace(/\.md$/, '') ?? slug
      return { slug: resolvedSlug, frontmatter, Content, headings }
    },
    async getMoments() {
      const collection = import.meta.glob('../../../contents/moments/*.md')
      const moments = await Promise.all(
        Object.entries(collection).map(async ([filepath, loader]) => {
          const module = await loader()
          const { frontmatter, Content, headings } = module as {
            frontmatter: MomentContent['frontmatter']
            Content: MomentContent['Content']
            headings: MomentContent['headings']
          }
          const id = filepath.split('/').pop()?.replace(/\.md$/, '') ?? ''
          return { id, frontmatter, Content, headings }
        })
      )
      return moments
    },
    async getMomentById(id) {
      const collection = import.meta.glob('../../../contents/moments/*.md')
      const entry = Object.entries(collection).find(([filepath]) =>
        filepath.endsWith(`/${id}.md`)
      )
      if (!entry) return null
      const [filepath, loader] = entry
      const module = await loader()
      const { frontmatter, Content, headings } = module as {
        frontmatter: MomentContent['frontmatter']
        Content: MomentContent['Content']
        headings: MomentContent['headings']
      }
      const resolvedId = filepath.split('/').pop()?.replace(/\.md$/, '') ?? id
      return { id: resolvedId, frontmatter, Content, headings }
    },
  }
}
