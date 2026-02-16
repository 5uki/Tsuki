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
          const module = (await loader()) as {
            frontmatter: PostContent['frontmatter']
            Content: PostContent['Content']
            getHeadings(): PostContent['headings']
          }
          const slug = filepath.split('/').pop()?.replace(/\.md$/, '') ?? ''
          return { slug, frontmatter: module.frontmatter, Content: module.Content, headings: module.getHeadings() }
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
      const module = (await loader()) as {
        frontmatter: PostContent['frontmatter']
        Content: PostContent['Content']
        getHeadings(): PostContent['headings']
      }
      const resolvedSlug = filepath.split('/').pop()?.replace(/\.md$/, '') ?? slug
      return { slug: resolvedSlug, frontmatter: module.frontmatter, Content: module.Content, headings: module.getHeadings() }
    },
    async getMoments() {
      const collection = import.meta.glob('../../../contents/moments/*.md')
      const moments = await Promise.all(
        Object.entries(collection).map(async ([filepath, loader]) => {
          const module = (await loader()) as {
            frontmatter: MomentContent['frontmatter']
            Content: MomentContent['Content']
            getHeadings(): MomentContent['headings']
          }
          const id = filepath.split('/').pop()?.replace(/\.md$/, '') ?? ''
          return { id, frontmatter: module.frontmatter, Content: module.Content, headings: module.getHeadings() }
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
      const module = (await loader()) as {
        frontmatter: MomentContent['frontmatter']
        Content: MomentContent['Content']
        getHeadings(): MomentContent['headings']
      }
      const resolvedId = filepath.split('/').pop()?.replace(/\.md$/, '') ?? id
      return { id: resolvedId, frontmatter: module.frontmatter, Content: module.Content, headings: module.getHeadings() }
    },
  }
}
