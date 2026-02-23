/**
 * Admin Content 路由
 * 文章管理、配置管理、媒体上传、Git 提交
 */

import { Hono } from 'hono'
import type { Env, AppContext } from '@contracts/env'
import { AppError } from '@contracts/errors'
import { csrfMiddleware } from './middleware/csrf'
import { listPosts, getPost } from '@usecases/admin-posts'
import { getSiteConfig, getAboutPage } from '@usecases/admin-config'
import { batchCommit } from '@usecases/admin-commit'
import { uploadMedia } from '@usecases/admin-media'

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
    const body = await c.req.json<{ message?: string; changes?: unknown[] }>()
    if (!body.message || !Array.isArray(body.changes)) {
      throw new AppError('VALIDATION_FAILED', 'message and changes are required')
    }
    const githubRepoPort = getGitHubRepo(c)
    const data = await batchCommit({
      changes: body.changes as any,
      message: body.message,
      githubRepoPort,
    })
    return c.json({ ok: true, data })
  })

  return router
}
