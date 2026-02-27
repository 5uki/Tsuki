import { api } from './client'
import type { ApiResponse, SetupStatusDTO, SetupConfigDTO } from '@tsuki/shared'

export async function fetchSetupStatus(): Promise<SetupStatusDTO> {
  const res = await api.get<ApiResponse<SetupStatusDTO>>('/setup/status')
  return res.data
}

export async function saveSetupConfig(config: SetupConfigDTO): Promise<SetupStatusDTO> {
  const res = await api.post<ApiResponse<SetupStatusDTO>>('/setup/save', config)
  return res.data
}
