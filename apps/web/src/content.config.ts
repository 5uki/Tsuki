import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../../contents/posts' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.string(),
    category: z.string().optional(),
    series: z.string().optional(),
    tags: z.array(z.string()),
    cover: z.string().optional(),
    pinned: z.boolean().optional(),
  }),
})

const moments = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../../contents/moments' }),
  schema: z.object({
    title: z.string(),
    publishedAt: z.string(),
    category: z.string().optional(),
    series: z.string().optional(),
    tags: z.array(z.string()).optional(),
    media: z.array(z.string()).optional(),
  }),
})

export const collections = { posts, moments }
