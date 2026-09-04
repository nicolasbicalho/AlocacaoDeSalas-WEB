import api from '@/services/api'
import type { IDepartment, ApiSuccess, PaginatedResponse } from '@/types'

export interface DepartmentPayload {
  name: string
  code: string
}

export async function listDepartments(params: {
  page?: number
  limit?: number
  search?: string
}): Promise<PaginatedResponse<IDepartment>> {
  const { data } = await api.get<PaginatedResponse<IDepartment>>('/departments', { params })
  return data
}

export async function getDepartment(id: string): Promise<IDepartment> {
  const { data } = await api.get<ApiSuccess<IDepartment>>(`/departments/${id}`)
  return data.data
}

export async function createDepartment(payload: DepartmentPayload): Promise<IDepartment> {
  const { data } = await api.post<ApiSuccess<IDepartment>>('/departments', payload)
  return data.data
}

export async function updateDepartment(
  id: string,
  payload: Partial<DepartmentPayload>,
): Promise<IDepartment> {
  const { data } = await api.put<ApiSuccess<IDepartment>>(`/departments/${id}`, payload)
  return data.data
}

export async function deactivateDepartment(id: string): Promise<IDepartment> {
  const { data } = await api.patch<ApiSuccess<IDepartment>>(`/departments/${id}/deactivate`)
  return data.data
}
