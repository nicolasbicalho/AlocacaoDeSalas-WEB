import api from '@/services/api'
import type { ITurma, TimeSlot, ApiSuccess, PaginatedResponse } from '@/types'

export interface TurmaCreatePayload {
  projectId: string
  name: string
  code?: string
  studentCount: number
  professor: string
  requiredAttributes: string[]
  schedule: TimeSlot[]
}

export type TurmaUpdatePayload = Partial<Omit<TurmaCreatePayload, 'projectId'>>

export async function listTurmas(params: {
  projectId?: string
  page?: number
  limit?: number
  search?: string
}): Promise<PaginatedResponse<ITurma>> {
  const { data } = await api.get<PaginatedResponse<ITurma>>('/turmas', { params })
  return data
}

export async function getTurma(id: string): Promise<ITurma> {
  const { data } = await api.get<ApiSuccess<ITurma>>(`/turmas/${id}`)
  return data.data
}

export async function createTurma(payload: TurmaCreatePayload): Promise<ITurma> {
  const { data } = await api.post<ApiSuccess<ITurma>>('/turmas', payload)
  return data.data
}

export async function updateTurma(id: string, payload: TurmaUpdatePayload): Promise<ITurma> {
  const { data } = await api.put<ApiSuccess<ITurma>>(`/turmas/${id}`, payload)
  return data.data
}

export async function deactivateTurma(id: string): Promise<ITurma> {
  const { data } = await api.patch<ApiSuccess<ITurma>>(`/turmas/${id}/deactivate`)
  return data.data
}
