import { api } from './client'
import type { CommentDTO, PaginatedResponse, ApiResponse } from '@tsuki/shared'

export async function fetchAdminComments(params?: {
  cursor?: string
  status?: string
  target_type?: string
  target_id?: string
}): Promise<PaginatedResponse<CommentDTO>> {
  const sp = new URLSearchParams()
  if (params?.cursor) sp.set('cursor', params.cursor)
  if (params?.status) sp.set('status', params.status)
  if (params?.target_type) sp.set('target_type', params.target_type)
  if (params?.target_id) sp.set('target_id', params.target_id)
  const qs = sp.toString()
  const res = await api.get<ApiResponse<PaginatedResponse<CommentDTO>>>(`/admin/comments${qs ? `?${qs}` : ''}`)
  return res.data
}

export async function hideComment(id: string) {
  return api.post(`/admin/comments/${id}/hide`)
}

export async function unhideComment(id: string) {
  return api.post(`/admin/comments/${id}/unhide`)
}

export async function pinComment(id: string) {
  return api.post(`/admin/comments/${id}/pin`)
}

export async function unpinComment(id: string) {
  return api.post(`/admin/comments/${id}/unpin`)
}

export async function deleteComment(id: string) {
  return api.delete(`/admin/comments/${id}`)
}
