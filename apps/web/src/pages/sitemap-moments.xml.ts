import type { APIRoute } from 'astro'
import { getMomentEntries } from '@/lib/content'

export const prerender = true

function toIsoDate(dateStr: string): string {
  return new Date(dateStr).toISOString().slice(0, 10)
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.origin ?? 'https://example.com'
  const now = Date.now()
  const moments = await getMomentEntries()

  const entries = moments
    .filter((moment) => new Date(moment.frontmatter.publishedAt).getTime() <= now)
    .map(
      (moment) => `  <url>
    <loc>${siteUrl}/moments/${moment.id}</loc>
    <lastmod>${toIsoDate(moment.frontmatter.publishedAt)}</lastmod>
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
