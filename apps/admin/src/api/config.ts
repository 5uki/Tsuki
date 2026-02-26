import { api } from './client'
import type { ApiResponse } from '@tsuki/shared'

export async function fetchConfig(): Promise<{ config: unknown; sha: string }> {
  const res = await api.get<ApiResponse<{ config: unknown; sha: string }>>('/admin/config')
  return res.data
}

export async function fetchAbout(): Promise<{ content: string; sha: string }> {
  const res = await api.get<ApiResponse<{ content: string; sha: string }>>('/admin/about')
  return res.data
}
