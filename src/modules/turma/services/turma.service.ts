import api from '@/services/api'
import type {
  ITurma,
  RoomFeature,
  TimeSlot,
  TurmaCategory,
  TurmaCounts,
  ApiSuccess,
  PaginatedResponse,
} from '@/types'

export interface TurmaCreatePayload {
  projectId: string
  name: string
  code: string
  category: TurmaCategory
  sector?: string
  notes?: string
  /** null = "a definir" */
  studentCount: number | null
  professor: string
  requiredFeatures: RoomFeature[]
  schedule: TimeSlot[]
}

export type TurmaUpdatePayload = Partial<Omit<TurmaCreatePayload, 'projectId'>>

export async function listTurmas(params: {
  projectId?: string
  page?: number
  limit?: number
  search?: string
  category?: TurmaCategory
}): Promise<PaginatedResponse<ITurma>> {
  const { data } = await api.get<PaginatedResponse<ITurma>>('/turmas', { params })
  return data
}

/** Quantidade de turmas do projeto por categoria (abas da lista), respeitando a busca. */
export async function getTurmaCounts(params: { projectId: string; search?: string }): Promise<TurmaCounts> {
  const { data } = await api.get<ApiSuccess<TurmaCounts>>('/turmas/counts', { params })
  return data.data
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
