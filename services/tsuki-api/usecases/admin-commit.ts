/**
 * Admin Commit 用例
 * 批量提交文件变更到 GitHub
 */

import type { GitHubRepoPort } from '@contracts/ports'
import type { AdminFileChange, AdminCommitResponse } from '@contracts/dto'
import { AppError } from '@contracts/errors'

/** 允许修改的路径前缀 */
const ALLOWED_PREFIXES = ['contents/', 'tsuki.config.json']

function isPathAllowed(path: string): boolean {
  return ALLOWED_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix))
}

// ─── BatchCommit ───

export interface BatchCommitInput {
  changes: AdminFileChange[]
  message: string
  githubRepoPort: GitHubRepoPort
}

export async function batchCommit(input: BatchCommitInput): Promise<AdminCommitResponse> {
  if (!input.changes.length) {
    throw new AppError('VALIDATION_FAILED', 'No changes to commit', {
      field: 'changes',
      reason: 'EMPTY',
    })
  }

  if (!input.message.trim()) {
    throw new AppError('VALIDATION_FAILED', 'Commit message is required', {
      field: 'message',
      reason: 'REQUIRED',
    })
  }

  // Validate paths
  for (const change of input.changes) {
    if (!isPathAllowed(change.path)) {
      throw new AppError('FORBIDDEN', `Path not allowed: ${change.path}`, {
        field: 'path',
        value: change.path,
      })
    }

    if (!change.action || !['create', 'update', 'delete'].includes(change.action)) {
      throw new AppError('VALIDATION_FAILED', `Invalid action: ${change.action}`, {
        field: 'action',
        reason: 'INVALID',
      })
    }
  }

  return input.githubRepoPort.batchCommit(input.changes, input.message)
}
