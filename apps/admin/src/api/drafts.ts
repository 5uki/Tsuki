import { api } from './client'
import type { AdminDraftDTO, SaveDraftRequest, ApiResponse } from '@tsuki/shared'

export async function fetchDrafts(): Promise<AdminDraftDTO[]> {
  const res = await api.get<ApiResponse<AdminDraftDTO[]>>('/admin/drafts')
  return res.data
}

export async function fetchDraft(id: string): Promise<AdminDraftDTO> {
  const res = await api.get<ApiResponse<AdminDraftDTO>>(`/admin/drafts/${id}`)
  return res.data
}

export async function saveDraft(data: SaveDraftRequest): Promise<AdminDraftDTO> {
  const res = await api.post<ApiResponse<AdminDraftDTO>>('/admin/drafts', data)
  return res.data
}

export async function publishDraft(id: string, message?: string): Promise<{ sha: string; url: string }> {
  const res = await api.post<ApiResponse<{ sha: string; url: string }>>(`/admin/drafts/${id}/publish`, { message })
  return res.data
}

export async function deleteDraft(id: string): Promise<void> {
  await api.delete(`/admin/drafts/${id}`)
}
