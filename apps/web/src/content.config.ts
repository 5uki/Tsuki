import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.string(),
    category: z.string(),
    tags: z.array(z.string()),
    words: z.number(),
    cover: z.string().optional(),
    pinned: z.boolean().optional(),
  }),
})

const moments = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/moments' }),
  schema: z.object({
    title: z.string(),
    publishedAt: z.string(),
    tags: z.array(z.string()).optional(),
  }),
})

export const collections = { posts, moments }
