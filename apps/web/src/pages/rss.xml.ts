import type { APIRoute } from 'astro'
import { getPostEntries, getMomentEntries } from '@/lib/content'
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
  const posts = await getPostEntries()
  const moments = await getMomentEntries()

  type FeedItem = {
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    publishedTs: number
  }

  const items: FeedItem[] = []

  for (const post of posts) {
    const ts = new Date(post.frontmatter.publishedAt).getTime()
    if (ts > now) continue
    items.push({
      title: post.frontmatter.title,
      link: `${siteUrl}/posts/${post.slug}`,
      guid: `${siteUrl}/posts/${post.slug}`,
      pubDate: toRfc822(post.frontmatter.publishedAt),
      description: post.frontmatter.summary ?? '',
      publishedTs: ts,
    })
  }

  for (const moment of moments) {
    const ts = new Date(moment.frontmatter.publishedAt).getTime()
    if (ts > now) continue
    const bodyExcerpt = moment.body
      ? moment.body.replace(/[#*_`>[\]()!~]/g, '').trim().slice(0, 200)
      : ''
    items.push({
      title: moment.frontmatter.title,
      link: `${siteUrl}/moments/${moment.id}`,
      guid: `${siteUrl}/moments/${moment.id}`,
      pubDate: toRfc822(moment.frontmatter.publishedAt),
      description: bodyExcerpt,
      publishedTs: ts,
    })
  }

  items.sort((a, b) => b.publishedTs - a.publishedTs)
  const feedItems = items.slice(0, 20)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <description>${escapeXml(siteDescription)}</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${feedItems
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
