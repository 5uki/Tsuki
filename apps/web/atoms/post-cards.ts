export interface PostCardItem {
  slug: string
  title: string
  summary: string
  publishedAt: string
  category: string
  words: number
  tags: string[]
  pinned?: boolean
  cover?: string
}

export const mockPostCards: PostCardItem[] = [
  {
    slug: 'firefly-quickstart',
    title: 'Firefly Quick Start Notes',
    summary: 'Run the blog in minutes, then iterate on theme tokens, nav config, and content workflow.',
    publishedAt: '2026-01-02',
    category: 'Guides',
    words: 667,
    tags: ['Firefly', 'Blog', 'Markdown', 'GettingStarted'],
    pinned: true,
    cover: '/background.png',
  },
  {
    slug: 'firefly-layout-system',
    title: 'Firefly Layout System Breakdown',
    summary: 'A practical walkthrough of sidebar layout, post list composition, and mobile behavior.',
    publishedAt: '2026-01-03',
    category: 'Guides',
    words: 2075,
    tags: ['Firefly', 'Layout', 'Astro', 'Practice'],
    cover: '/background.png',
  },
  {
    slug: 'typescript-practice-2026',
    title: 'TypeScript Practice 2026',
    summary: 'Type modeling, error boundaries, and module organization patterns for production projects.',
    publishedAt: '2026-01-08',
    category: 'Engineering',
    words: 1530,
    tags: ['TypeScript', 'Engineering'],
  },
]
