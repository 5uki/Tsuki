import { imageManifest } from '@/generated/image-manifest'

function normalizeLocalPublicPath(raw: string): string {
  const noQuery = raw.split('#')[0].split('?')[0]
  const cleaned = noQuery
    .replace(/^\.\/?/, '')
    .replace(/^contents\//, '')
    .replace(/^(\.\.\/)+/, '')
    .replace(/^\/+/, '')
  return cleaned ? `/${cleaned}` : raw
}

export function toOptimizedImageUrl(src: string | undefined | null): string | undefined {
  if (!src) return undefined
  if (/^data:image\//i.test(src)) return src

  const direct = imageManifest[src as keyof typeof imageManifest]
  if (direct) return direct

  if (!/^https?:\/\//i.test(src)) {
    const normalized = normalizeLocalPublicPath(src)
    const mapped = imageManifest[normalized as keyof typeof imageManifest]
    return mapped || src
  }

  return src
}
