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
  const siteDescription = tsukiConfig.site.description ?? ''

  const now = Date.now()
  const moments = await getMomentEntries()
  const items = moments
    .filter((moment) => new Date(moment.frontmatter.publishedAt).getTime() <= now)
    .map((moment) => ({
      title: moment.frontmatter.title,
      link: `${siteUrl}/moments/${moment.id}`,
      guid: `${siteUrl}/moments/${moment.id}`,
      pubDate: toRfc822(moment.frontmatter.publishedAt),
      description: moment.body ? moment.body.replace(/[#*_`>[\]()!~]/g, '').trim().slice(0, 200) : '',
      publishedTs: new Date(moment.frontmatter.publishedAt).getTime(),
    }))
    .sort((a, b) => b.publishedTs - a.publishedTs)
    .slice(0, 20)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)} · Moments</title>
    <description>${escapeXml(siteDescription)}</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss-moments.xml" rel="self" type="application/rss+xml" />
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items
  .map(
    (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid>${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
