import { api } from './client'
import type { AdminFileChange, AdminCommitResponse, ApiResponse } from '@tsuki/shared'

export async function commitChanges(message: string, changes: AdminFileChange[]): Promise<AdminCommitResponse> {
  const res = await api.post<ApiResponse<AdminCommitResponse>>('/admin/commit', { message, changes })
  return res.data
}
