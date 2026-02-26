import type { APIRoute } from 'astro'
import { getMomentEntries } from '@/lib/content'
import tsukiConfig from '@/config/tsuki-config'

export const prerender = true

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc822(dateStr: string): string {
  return new Date(dateStr).toUTCString()
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.origin ?? 'https://example.com'
  const siteTitle = tsukiConfig.site.title

  const now = Date.now()
  const moments = await getMomentEntries()

  const feedItems = moments
    .filter((moment) => new Date(moment.frontmatter.publishedAt).getTime() <= now)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.publishedAt).getTime() - new Date(a.frontmatter.publishedAt).getTime()
    )
    .slice(0, 20)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)} - Moments</title>
    <description>${escapeXml(siteTitle)} moments feed</description>
    <link>${siteUrl}/moments</link>
    <atom:link href="${siteUrl}/rss-moments.xml" rel="self" type="application/rss+xml" />
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${feedItems
  .map((moment) => {
    const bodyExcerpt = moment.body
      ? moment.body
          .replace(/[#*_`>[\]()!~]/g, '')
          .trim()
          .slice(0, 200)
      : ''

    return `    <item>
      <title>${escapeXml(moment.frontmatter.title)}</title>
      <link>${siteUrl}/moments/${moment.id}</link>
      <guid>${siteUrl}/moments/${moment.id}</guid>
      <pubDate>${toRfc822(moment.frontmatter.publishedAt)}</pubDate>
      <description>${escapeXml(bodyExcerpt)}</description>
    </item>`
  })
  .join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
