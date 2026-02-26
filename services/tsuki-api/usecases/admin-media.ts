/**
 * Admin Media 用例
 * 上传媒体文件到 GitHub
 */

import type { GitHubRepoPort } from '@contracts/ports'
import { AppError } from '@contracts/errors'

const MEDIA_DIR = 'contents/media'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB base64 limit

// ─── UploadMedia ───

export interface UploadMediaInput {
  filename: string
  base64: string
  githubRepoPort: GitHubRepoPort
}

export async function uploadMedia(input: UploadMediaInput): Promise<{ path: string }> {
  if (!input.filename || !input.filename.trim()) {
    throw new AppError('VALIDATION_FAILED', 'Filename is required', {
      field: 'filename',
      reason: 'REQUIRED',
    })
  }

  // Sanitize filename
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  if (!safeName) {
    throw new AppError('VALIDATION_FAILED', 'Invalid filename', {
      field: 'filename',
      reason: 'INVALID',
    })
  }

  if (input.base64.length > MAX_FILE_SIZE) {
    throw new AppError('VALIDATION_FAILED', 'File too large (max 5MB)', {
      field: 'base64',
      reason: 'TOO_LARGE',
    })
  }

  const path = `${MEDIA_DIR}/${safeName}`

  // Commit the media file directly
  await input.githubRepoPort.batchCommit(
    [{ path, action: 'create', content: input.base64, encoding: 'base64' }],
    `media: upload ${safeName}`
  )

  return { path }
}
