import { api } from './client'
import type { ApiResponse } from '@tsuki/shared'

export async function uploadMedia(filename: string, base64: string): Promise<{ path: string }> {
  const res = await api.post<ApiResponse<{ path: string }>>('/admin/media', { filename, base64 })
  return res.data
}
