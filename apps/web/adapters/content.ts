import { getCollection, getEntry, render } from 'astro:content'
import type { PostEntry, PostContent, MomentEntry, MomentContent } from '@contracts/content'
import { countWords } from '@atoms/word-count'

export interface ContentAdapter {
  getPostEntries(): Promise<PostEntry[]>
  getPostBySlug(slug: string): Promise<PostContent | null>
  getMomentEntries(): Promise<MomentEntry[]>
  getMomentById(id: string): Promise<MomentContent | null>
}

export function createContentAdapter(): ContentAdapter {
  return {
    async getPostEntries() {
      const entries = await getCollection('posts')
      return entries.map(entry => ({
        slug: entry.id,
        frontmatter: entry.data,
        words: countWords(entry.body ?? ''),
      }))
    },

    async getPostBySlug(slug) {
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
    },

    async getMomentEntries() {
      const entries = await getCollection('moments')
      return entries.map(entry => ({
        id: entry.id,
        frontmatter: entry.data,
        body: entry.body,
      }))
    },

    async getMomentById(id) {
      const entry = await getEntry('moments', id)
      if (!entry) return null
      const rendered = await render(entry)
      return {
        id: entry.id,
        frontmatter: entry.data,
        Content: rendered.Content,
        headings: rendered.headings,
      }
    },
  }
}
