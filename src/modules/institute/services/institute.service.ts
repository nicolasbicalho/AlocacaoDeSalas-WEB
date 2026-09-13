import api from '@/services/api'
import type { IInstitute, ApiSuccess, PaginatedResponse } from '@/types'

export interface InstitutePayload {
  name: string
  code: string
}

export async function listInstitutes(params: {
  page?: number
  limit?: number
  search?: string
}): Promise<PaginatedResponse<IInstitute>> {
  const { data } = await api.get<PaginatedResponse<IInstitute>>('/institutes', { params })
  return data
}

export async function getInstitute(id: string): Promise<IInstitute> {
  const { data } = await api.get<ApiSuccess<IInstitute>>(`/institutes/${id}`)
  return data.data
}

export async function createInstitute(payload: InstitutePayload): Promise<IInstitute> {
  const { data } = await api.post<ApiSuccess<IInstitute>>('/institutes', payload)
  return data.data
}

export async function updateInstitute(
  id: string,
  payload: Partial<InstitutePayload>,
): Promise<IInstitute> {
  const { data } = await api.put<ApiSuccess<IInstitute>>(`/institutes/${id}`, payload)
  return data.data
}

export async function deactivateInstitute(id: string): Promise<IInstitute> {
  const { data } = await api.patch<ApiSuccess<IInstitute>>(`/institutes/${id}/deactivate`)
  return data.data
}
