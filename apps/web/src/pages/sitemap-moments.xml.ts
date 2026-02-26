import type { APIRoute } from 'astro'
import { getMomentEntries } from '@/lib/content'

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
  const moments = await getMomentEntries()
  const publishedMoments = moments.filter(
    (m) => new Date(m.frontmatter.publishedAt).getTime() <= now
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publishedMoments
  .map(
    (moment) => `  <url>
    <loc>${escapeXml(`${siteUrl}/moments/${moment.id}`)}</loc>
    <lastmod>${toIsoDate(moment.frontmatter.publishedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
