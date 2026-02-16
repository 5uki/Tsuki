import type { MomentContent, PostContent } from '@contracts/content'

export interface ContentAdapter {
  getPosts(): Promise<PostContent[]>
  getPostBySlug(slug: string): Promise<PostContent | null>
  getMoments(): Promise<MomentContent[]>
  getMomentById(id: string): Promise<MomentContent | null>
}

/** Astro glob 导入的 Markdown 模块结构 */
interface MarkdownModule<F> {
  frontmatter: F
  Content: any
  getHeadings(): any[]
}

function extractSlug(filepath: string): string {
  return filepath.split('/').pop()?.replace(/\.md$/, '') ?? ''
}

export function createContentAdapter(): ContentAdapter {
  return {
    async getPosts() {
      const collection = import.meta.glob('../../../contents/posts/*.md')
      return Promise.all(
        Object.entries(collection).map(async ([filepath, loader]) => {
          const mod = (await loader()) as MarkdownModule<PostContent['frontmatter']>
          return { slug: extractSlug(filepath), frontmatter: mod.frontmatter, Content: mod.Content, headings: mod.getHeadings() }
        })
      )
    },
    async getPostBySlug(slug) {
      const collection = import.meta.glob('../../../contents/posts/*.md')
      const entry = Object.entries(collection).find(([fp]) => fp.endsWith(`/${slug}.md`))
      if (!entry) return null
      const [filepath, loader] = entry
      const mod = (await loader()) as MarkdownModule<PostContent['frontmatter']>
      return { slug: extractSlug(filepath), frontmatter: mod.frontmatter, Content: mod.Content, headings: mod.getHeadings() }
    },
    async getMoments() {
      const collection = import.meta.glob('../../../contents/moments/*.md')
      return Promise.all(
        Object.entries(collection).map(async ([filepath, loader]) => {
          const mod = (await loader()) as MarkdownModule<MomentContent['frontmatter']>
          return { id: extractSlug(filepath), frontmatter: mod.frontmatter, Content: mod.Content, headings: mod.getHeadings() }
        })
      )
    },
    async getMomentById(id) {
      const collection = import.meta.glob('../../../contents/moments/*.md')
      const entry = Object.entries(collection).find(([fp]) => fp.endsWith(`/${id}.md`))
      if (!entry) return null
      const [filepath, loader] = entry
      const mod = (await loader()) as MarkdownModule<MomentContent['frontmatter']>
      return { id: extractSlug(filepath), frontmatter: mod.frontmatter, Content: mod.Content, headings: mod.getHeadings() }
    },
  }
}
