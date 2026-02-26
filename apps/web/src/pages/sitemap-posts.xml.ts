import type { APIRoute } from 'astro'
import { getPostEntries } from '@/lib/content'

export const prerender = true

function toIsoDate(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10)
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.origin ?? 'https://example.com'
  const now = Date.now()
  const posts = await getPostEntries()

  const entries = posts
    .filter((post) => new Date(post.frontmatter.publishedAt).getTime() <= now)
    .map(
      (post) => `  <url>
    <loc>${siteUrl}/posts/${post.slug}</loc>
    <lastmod>${toIsoDate(post.frontmatter.publishedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
    )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
