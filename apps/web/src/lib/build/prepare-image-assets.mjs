import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import sharp from 'sharp'
import { Buffer } from 'node:buffer'

const RASTER_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const REMOTE_IMAGE_RE = /^https?:\/\/.+\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i
const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

function normalizeLocalPublicPath(raw) {
  const noQuery = raw.split('#')[0].split('?')[0]
  const cleaned = noQuery
    .replace(/^\.\/?/, '')
    .replace(/^contents\//, '')
    .replace(/^(\.\.\/)+/, '')
    .replace(/^\/+/, '')
  return cleaned ? `/${cleaned}` : raw
}

function isRemote(src) {
  return /^https?:\/\//i.test(src)
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walk(p)))
      continue
    }
    files.push(p)
  }
  return files
}

function getConfigImageUrls(tsukiConfig) {
  const urls = []
  if (tsukiConfig.site?.faviconHref) urls.push(tsukiConfig.site.faviconHref)
  if (tsukiConfig.profile?.avatar) urls.push(tsukiConfig.profile.avatar)
  for (const hero of tsukiConfig.hero?.backgroundImages ?? []) {
    if (hero.href) urls.push(hero.href)
  }
  for (const friend of tsukiConfig.friends ?? []) {
    if (friend.avatar) urls.push(friend.avatar)
  }
  return urls
}

async function getMarkdownImageUrls(contentsDir) {
  const mdFiles = (await walk(contentsDir)).filter((f) => f.endsWith('.md'))
  const urls = []

  for (const file of mdFiles) {
    const text = await fs.readFile(file, 'utf8')

    const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/)
    const frontmatter = frontmatterMatch?.[1] ?? ''
    for (const line of frontmatter.split('\n')) {
      const m = line.match(/^\s*(cover|avatar)\s*:\s*["']?([^"']+)["']?\s*$/)
      if (m?.[2]) urls.push(m[2].trim())
      const media = line.match(/^\s*media\s*:\s*\[(.*)\]\s*$/)
      if (media?.[1]) {
        for (const item of media[1].split(',')) {
          const val = item.trim().replace(/^['"]|['"]$/g, '')
          if (val) urls.push(val)
        }
      }
    }

    for (const match of text.matchAll(MARKDOWN_IMAGE_RE)) {
      if (match[1]) urls.push(match[1].trim())
    }
  }

  return urls
}

function toHash(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 16)
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function downloadToBuffer(url) {
  const resp = await globalThis.fetch(url)
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`)
  const arr = await resp.arrayBuffer()
  return Buffer.from(arr)
}

export async function prepareImageAssets({ workspaceRoot, tsukiConfig }) {
  const contentsDir = path.resolve(workspaceRoot, 'contents')
  const outputDir = path.resolve(contentsDir, '.tsuki-avif')
  const generatedManifestFile = path.resolve(
    workspaceRoot,
    'apps/web/src/generated/image-manifest.ts'
  )

  await ensureDir(outputDir)

  const manifest = {}

  const repoRasterFiles = (await walk(contentsDir)).filter((file) => {
    const ext = path.extname(file).toLowerCase()
    return RASTER_EXT.has(ext) && !file.includes(`${path.sep}.tsuki-avif${path.sep}`)
  })

  const configUrls = getConfigImageUrls(tsukiConfig)
  const markdownUrls = await getMarkdownImageUrls(contentsDir)
  const allUsedUrls = Array.from(new Set([...configUrls, ...markdownUrls]))

  const localReferenced = allUsedUrls.filter((u) => !isRemote(u))
  const remoteReferenced = allUsedUrls.filter((u) => isRemote(u) && REMOTE_IMAGE_RE.test(u))

  const localFilesToConvert = new Set(repoRasterFiles)
  for (const ref of localReferenced) {
    const normalized = normalizeLocalPublicPath(ref)
    const abs = path.resolve(contentsDir, normalized.slice(1))
    if (RASTER_EXT.has(path.extname(abs).toLowerCase())) localFilesToConvert.add(abs)
  }

  for (const abs of localFilesToConvert) {
    try {
      const rel = path.relative(contentsDir, abs).replace(/\\/g, '/')
      const key = `/${rel}`
      const hash = toHash(`local:${key}`)
      const outRel = `/.tsuki-avif/${hash}.avif`
      const outAbs = path.resolve(contentsDir, outRel.slice(1))
      const inputBuffer = await fs.readFile(abs)
      await sharp(inputBuffer).avif({ quality: 55 }).toFile(outAbs)
      manifest[key] = outRel
    } catch {
      // skip invalid images
    }
  }

  for (const remoteUrl of remoteReferenced) {
    try {
      const hash = toHash(`remote:${remoteUrl}`)
      const outRel = `/.tsuki-avif/${hash}.avif`
      const outAbs = path.resolve(contentsDir, outRel.slice(1))
      const data = await downloadToBuffer(remoteUrl)
      await sharp(data).avif({ quality: 55 }).toFile(outAbs)
      manifest[remoteUrl] = outRel
    } catch {
      // ignore unreachable remote images
    }
  }

  const manifestSource = `export const imageManifest = ${JSON.stringify(manifest, null, 2)} as const\n`
  await fs.writeFile(generatedManifestFile, manifestSource, 'utf8')
  return manifest
}
