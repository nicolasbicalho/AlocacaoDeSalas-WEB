import api from '@/services/api'
import type { IBuilding, ApiSuccess, PaginatedResponse } from '@/types'

export interface BuildingPayload {
  name: string
  code: string
  latitude?: number
  longitude?: number
}

export async function listBuildings(params: {
  page?: number
  limit?: number
  search?: string
}): Promise<PaginatedResponse<IBuilding>> {
  const { data } = await api.get<PaginatedResponse<IBuilding>>('/buildings', { params })
  return data
}

export async function getBuilding(id: string): Promise<IBuilding> {
  const { data } = await api.get<ApiSuccess<IBuilding>>(`/buildings/${id}`)
  return data.data
}

export async function createBuilding(payload: BuildingPayload): Promise<IBuilding> {
  const { data } = await api.post<ApiSuccess<IBuilding>>('/buildings', payload)
  return data.data
}

export async function updateBuilding(
  id: string,
  payload: Partial<BuildingPayload>,
): Promise<IBuilding> {
  const { data } = await api.put<ApiSuccess<IBuilding>>(`/buildings/${id}`, payload)
  return data.data
}

export async function deactivateBuilding(id: string): Promise<IBuilding> {
  const { data } = await api.patch<ApiSuccess<IBuilding>>(`/buildings/${id}/deactivate`)
  return data.data
}
