/**
 * Admin Content 路由
 * 文章管理、配置管理、媒体上传、Git 提交、草稿管理
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'
import type { SaveDraftRequest, PublishDraftRequest, AdminFileChange } from '@contracts/dto'
import { AppError } from '@contracts/errors'
import { csrfMiddleware } from './middleware/csrf'
import { listPosts, getPost } from '@usecases/admin-posts'
import { getSiteConfig, getAboutPage } from '@usecases/admin-config'
import { batchCommit } from '@usecases/admin-commit'
import { uploadMedia } from '@usecases/admin-media'
import { saveDraft, listDrafts, getDraft, publishDraft, deleteDraft } from '@usecases/admin-drafts'

export function adminContentRoutes() {
  const router = new Hono<{ Bindings: Env; Variables: AppContext }>()

  // 确保 GitHub Repo 端口可用
  function getGitHubRepo(c: { get: <K extends keyof AppContext>(key: K) => AppContext[K] }) {
    const port = c.get('ports').githubRepo
    if (!port) {
      throw new AppError('INTERNAL_ERROR', 'GitHub Repo not configured')
    }
    return port
  }

  // GET /v1/admin/posts — 文章列表
  router.get('/posts', async (c) => {
    const githubRepoPort = getGitHubRepo(c)
    const data = await listPosts({ githubRepoPort })
    return c.json({ ok: true, data })
  })

  // GET /v1/admin/posts/:slug — 文章详情
  router.get('/posts/:slug', async (c) => {
    const slug = c.req.param('slug')
    const githubRepoPort = getGitHubRepo(c)
    const data = await getPost({ slug, githubRepoPort })
    return c.json({ ok: true, data })
  })

  // GET /v1/admin/config — 站点配置
  router.get('/config', async (c) => {
    const githubRepoPort = getGitHubRepo(c)
    const data = await getSiteConfig({ githubRepoPort })
    return c.json({ ok: true, data })
  })

  // GET /v1/admin/about — 关于页面
  router.get('/about', async (c) => {
    const githubRepoPort = getGitHubRepo(c)
    const data = await getAboutPage({ githubRepoPort })
    return c.json({ ok: true, data })
  })

  // POST /v1/admin/media — 上传图片
  router.post('/media', csrfMiddleware, async (c) => {
    const body = await c.req.json<{ filename?: string; base64?: string }>()
    if (!body.filename || !body.base64) {
      throw new AppError('VALIDATION_FAILED', 'filename and base64 are required')
    }
    const githubRepoPort = getGitHubRepo(c)
    const data = await uploadMedia({
      filename: body.filename,
      base64: body.base64,
      githubRepoPort,
    })
    return c.json({ ok: true, data }, 201)
  })

  // POST /v1/admin/commit — 批量提交到 Git
  router.post('/commit', csrfMiddleware, async (c) => {
    const body = await c.req.json<{ message?: string; changes?: AdminFileChange[] }>()
    if (!body.message || !Array.isArray(body.changes)) {
      throw new AppError('VALIDATION_FAILED', 'message and changes are required')
    }
    const githubRepoPort = getGitHubRepo(c)
    const data = await batchCommit({
      changes: body.changes,
      message: body.message,
      githubRepoPort,
    })
    return c.json({ ok: true, data })
  })

  // ── Drafts ──

  // GET /v1/admin/drafts — 草稿列表
  router.get('/drafts', async (c) => {
    const draftsPort = c.get('ports').drafts
    const data = await listDrafts({ draftsPort })
    return c.json({ ok: true, data })
  })

  // GET /v1/admin/drafts/:id — 草稿详情
  router.get('/drafts/:id', async (c) => {
    const id = c.req.param('id')
    const draftsPort = c.get('ports').drafts
    const data = await getDraft({ draftsPort, id })
    return c.json({ ok: true, data })
  })

  // POST /v1/admin/drafts — 创建/更新草稿
  router.post('/drafts', csrfMiddleware, async (c) => {
    const body = await c.req.json<SaveDraftRequest>()
    if (!body.slug || !body.title || !body.content_markdown) {
      throw new AppError('VALIDATION_FAILED', 'slug, title, and content_markdown are required')
    }
    const draftsPort = c.get('ports').drafts
    const data = await saveDraft({
      draftsPort,
      id: body.id,
      slug: body.slug,
      title: body.title,
      summary: body.summary,
      cover_url: body.cover_url,
      content_markdown: body.content_markdown,
      scheduled_at: body.scheduled_at,
    })
    return c.json({ ok: true, data }, body.id ? 200 : 201)
  })

  // POST /v1/admin/drafts/:id/publish — 发布草稿到 Git
  router.post('/drafts/:id/publish', csrfMiddleware, async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json<PublishDraftRequest>().catch(() => ({}) as PublishDraftRequest)
    const draftsPort = c.get('ports').drafts
    const githubRepoPort = getGitHubRepo(c)
    const data = await publishDraft({
      draftsPort,
      githubRepoPort,
      id,
      message: body.message,
    })
    return c.json({ ok: true, data })
  })

  // DELETE /v1/admin/drafts/:id — 删除草稿
  router.delete('/drafts/:id', csrfMiddleware, async (c) => {
    const id = c.req.param('id')
    const draftsPort = c.get('ports').drafts
    await deleteDraft({ draftsPort, id })
    return c.json({ ok: true, data: null })
  })

  return router
}
