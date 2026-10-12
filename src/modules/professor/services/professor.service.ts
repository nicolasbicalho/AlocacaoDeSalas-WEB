import api from '@/services/api'
import type { IProfessor, ApiSuccess, PaginatedResponse } from '@/types'

/** O formulário sempre envia todas as preferências: `minBoards: null` e `floors: []` = sem preferência. */
export interface ProfessorPayload {
  name: string
  preferences: { minBoards: number | null; floors: number[]; avoidCorridorEnd: boolean }
  /** "" remove as anotações */
  notes: string
}

export async function listProfessors(params: {
  page?: number
  limit?: number
  search?: string
  active?: boolean
}): Promise<PaginatedResponse<IProfessor>> {
  const { data } = await api.get<PaginatedResponse<IProfessor>>('/professors', { params })
  return data
}

export async function getProfessor(id: string): Promise<IProfessor> {
  const { data } = await api.get<ApiSuccess<IProfessor>>(`/professors/${id}`)
  return data.data
}

export async function createProfessor(payload: ProfessorPayload): Promise<IProfessor> {
  const { notes, ...rest } = payload
  const { data } = await api.post<ApiSuccess<IProfessor>>('/professors', { ...rest, ...(notes ? { notes } : {}) })
  return data.data
}

export async function updateProfessor(id: string, payload: Partial<ProfessorPayload>): Promise<IProfessor> {
  const { data } = await api.put<ApiSuccess<IProfessor>>(`/professors/${id}`, payload)
  return data.data
}

export async function setProfessorActive(id: string, active: boolean): Promise<IProfessor> {
  const { data } = await api.patch<ApiSuccess<IProfessor>>(
    `/professors/${id}/${active ? 'activate' : 'deactivate'}`,
  )
  return data.data
}
