/**
 * Admin Drafts 用例
 * 草稿 CRUD + 发布到 Git + 定时发布
 */

import type { DraftsPort, GitHubRepoPort } from '@contracts/ports'
import type { AdminDraftDTO } from '@contracts/dto'
import { AppError } from '@contracts/errors'

// ── Helpers ──

/** Strip markdown to plain text (simple heuristic) */
function markdownToPlainText(md: string): string {
  return md
    .replace(/^---[\s\S]*?---\n*/m, '')  // frontmatter
    .replace(/!\[.*?\]\(.*?\)/g, '')      // images
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // links → text
    .replace(/#{1,6}\s+/g, '')            // headings
    .replace(/[*_~`>]/g, '')              // emphasis / blockquote / code
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/** Estimate reading time (Chinese: ~400 chars/min, English: ~200 words/min) */
function estimateReadingTime(text: string): number {
  const chars = text.length
  const words = text.split(/\s+/).filter(Boolean).length
  // Heuristic: if mostly CJK, use char count; otherwise word count
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g) || []).length
  const minutes = cjk > words ? chars / 400 : words / 200
  return Math.max(1, Math.round(minutes))
}

/** Build frontmatter string from draft metadata */
function buildFrontmatter(meta: {
  title: string
  summary: string
  date: string
  tags: string[]
  categories: string[]
  cover: string
  status: string
}): string {
  const lines = ['---']
  lines.push(`title: "${meta.title}"`)
  if (meta.summary) lines.push(`summary: "${meta.summary}"`)
  if (meta.date) lines.push(`date: ${meta.date}`)
  if (meta.tags.length) lines.push(`tags: [${meta.tags.map(t => `"${t}"`).join(', ')}]`)
  if (meta.categories.length) lines.push(`categories: [${meta.categories.map(c => `"${c}"`).join(', ')}]`)
  if (meta.cover) lines.push(`cover: "${meta.cover}"`)
  if (meta.status !== 'published') lines.push(`status: ${meta.status}`)
  lines.push('---')
  return lines.join('\n')
}

function toDTO(record: {
  id: string
  slug: string
  title: string
  summary: string
  cover_url: string | null
  status: 'draft'
  scheduled_at: number | null
  updated_at: number
  created_at: number
  content_markdown: string
  reading_time_minutes: number
}): AdminDraftDTO {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    cover_url: record.cover_url,
    status: record.status,
    scheduled_at: record.scheduled_at,
    updated_at: record.updated_at,
    created_at: record.created_at,
    content_markdown: record.content_markdown,
    reading_time_minutes: record.reading_time_minutes,
  }
}

// ── Save Draft ──

export interface SaveDraftInput {
  draftsPort: DraftsPort
  id?: string
  slug: string
  title: string
  summary?: string
  cover_url?: string | null
  content_markdown: string
  scheduled_at?: number | null
}

export async function saveDraft(input: SaveDraftInput): Promise<AdminDraftDTO> {
  const plainText = markdownToPlainText(input.content_markdown)
  const readingTime = estimateReadingTime(plainText)

  if (input.id) {
    // Update existing draft
    const existing = await input.draftsPort.getById(input.id)
    if (!existing) {
      throw new AppError('NOT_FOUND', `Draft "${input.id}" not found`)
    }
    const updated = await input.draftsPort.update(input.id, {
      slug: input.slug,
      title: input.title,
      summary: input.summary ?? '',
      cover_url: input.cover_url ?? null,
      content_markdown: input.content_markdown,
      content_html: '',
      content_text: plainText,
      reading_time_minutes: readingTime,
      scheduled_at: input.scheduled_at ?? null,
    })
    return toDTO(updated)
  }

  // Create new draft
  const record = await input.draftsPort.create({
    id: crypto.randomUUID(),
    slug: input.slug,
    title: input.title,
    summary: input.summary ?? '',
    cover_url: input.cover_url ?? null,
    content_markdown: input.content_markdown,
    content_html: '',
    content_text: plainText,
    reading_time_minutes: readingTime,
    scheduled_at: input.scheduled_at ?? null,
  })
  return toDTO(record)
}

// ── List Drafts ──

export interface ListDraftsInput {
  draftsPort: DraftsPort
}

export async function listDrafts(input: ListDraftsInput): Promise<AdminDraftDTO[]> {
  const records = await input.draftsPort.list()
  return records.map(toDTO)
}

// ── Get Draft ──

export interface GetDraftInput {
  draftsPort: DraftsPort
  id: string
}

export async function getDraft(input: GetDraftInput): Promise<AdminDraftDTO> {
  const record = await input.draftsPort.getById(input.id)
  if (!record) {
    throw new AppError('NOT_FOUND', `Draft "${input.id}" not found`)
  }
  return toDTO(record)
}

// ── Publish Draft ──

export interface PublishDraftInput {
  draftsPort: DraftsPort
  githubRepoPort: GitHubRepoPort
  id: string
  message?: string
}

export async function publishDraft(input: PublishDraftInput): Promise<{ sha: string; url: string }> {
  const draft = await input.draftsPort.getById(input.id)
  if (!draft) {
    throw new AppError('NOT_FOUND', `Draft "${input.id}" not found`)
  }

  const date = new Date().toISOString().split('T')[0]!
  const frontmatter = buildFrontmatter({
    title: draft.title,
    summary: draft.summary,
    date,
    tags: [],
    categories: [],
    cover: draft.cover_url || '',
    status: 'published',
  })

  const fullContent = `${frontmatter}\n\n${draft.content_markdown}`
  const path = `contents/posts/${draft.slug}.md`
  const commitMessage = input.message || `publish: ${draft.title}`

  const result = await input.githubRepoPort.batchCommit(
    [{ path, action: 'create', content: fullContent, encoding: 'utf-8' }],
    commitMessage
  )

  // Delete from D1 after successful Git commit
  await input.draftsPort.delete(input.id)

  return result
}

// ── Delete Draft ──

export interface DeleteDraftInput {
  draftsPort: DraftsPort
  id: string
}

export async function deleteDraft(input: DeleteDraftInput): Promise<void> {
  const draft = await input.draftsPort.getById(input.id)
  if (!draft) {
    throw new AppError('NOT_FOUND', `Draft "${input.id}" not found`)
  }
  await input.draftsPort.delete(input.id)
}

// ── Publish Scheduled Drafts ──

export interface PublishScheduledInput {
  draftsPort: DraftsPort
  githubRepoPort: GitHubRepoPort
}

export async function publishScheduledDrafts(input: PublishScheduledInput): Promise<number> {
  const due = await input.draftsPort.listScheduledDue(Date.now())
  let published = 0

  for (const draft of due) {
    try {
      await publishDraft({
        draftsPort: input.draftsPort,
        githubRepoPort: input.githubRepoPort,
        id: draft.id,
        message: `scheduled publish: ${draft.title}`,
      })
      published++
    } catch (err) {
      console.error(JSON.stringify({
        level: 'error',
        message: `Failed to publish scheduled draft ${draft.id}`,
        error: err instanceof Error ? err.message : String(err),
      }))
    }
  }

  return published
}
