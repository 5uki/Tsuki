import { api } from './client'
import type { AdminPostDTO, ApiResponse } from '@tsuki/shared'

export async function fetchPosts(): Promise<AdminPostDTO[]> {
  const res = await api.get<ApiResponse<AdminPostDTO[]>>('/admin/posts')
  return res.data
}

export async function fetchPost(slug: string): Promise<AdminPostDTO> {
  const res = await api.get<ApiResponse<AdminPostDTO>>(`/admin/posts/${slug}`)
  return res.data
}
