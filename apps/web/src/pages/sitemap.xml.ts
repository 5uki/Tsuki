import type { APIRoute } from 'astro'
import { getPostEntries, getMomentEntries } from '@/lib/content'

export const prerender = true

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toIsoDate(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10)
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.origin ?? 'https://example.com'
  const now = Date.now()

  const posts = await getPostEntries()
  const moments = await getMomentEntries()

  const publishedPosts = posts.filter(
    (p) => new Date(p.frontmatter.publishedAt).getTime() <= now
  )
  const publishedMoments = moments.filter(
    (m) => new Date(m.frontmatter.publishedAt).getTime() <= now
  )

  type SitemapEntry = {
    loc: string
    lastmod?: string
    changefreq?: string
    priority: string
  }

  const entries: SitemapEntry[] = [
    { loc: `${siteUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${siteUrl}/posts`, changefreq: 'daily', priority: '0.8' },
    { loc: `${siteUrl}/moments`, changefreq: 'daily', priority: '0.8' },
    { loc: `${siteUrl}/about`, changefreq: 'monthly', priority: '0.5' },
  ]

  for (const post of publishedPosts) {
    entries.push({
      loc: `${siteUrl}/posts/${post.slug}`,
      lastmod: toIsoDate(post.frontmatter.publishedAt),
      changefreq: 'weekly',
      priority: '0.6',
    })
  }

  for (const moment of publishedMoments) {
    entries.push({
      loc: `${siteUrl}/moments/${moment.id}`,
      lastmod: toIsoDate(moment.frontmatter.publishedAt),
      changefreq: 'weekly',
      priority: '0.6',
    })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}${e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ''}
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
