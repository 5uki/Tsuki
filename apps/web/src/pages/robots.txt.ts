import type { APIRoute } from 'astro'

export const prerender = true

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.origin ?? 'https://example.com'

  const body = `User-agent: *
Allow: /
Disallow: /login
Disallow: /admin

Sitemap: ${siteUrl}/sitemap.xml
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
