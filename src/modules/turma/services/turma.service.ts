import api from '@/services/api'
import type { ImportRowPayload } from '../import/mapping'
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
  /** nome; a API associa ao cadastro de professores (ou cria o professor) */
  professor: string
  requiredFeatures: RoomFeature[]
  /** aula prática no mesmo horário; null = sem (na edição, desliga) */
  practice: { requiredFeatures: RoomFeature[] } | null
  schedule: TimeSlot[]
}

export type TurmaUpdatePayload = Partial<Omit<TurmaCreatePayload, 'projectId'>>

export async function listTurmas(params: {
  projectId?: string
  page?: number
  limit?: number
  search?: string
  category?: TurmaCategory
  professorId?: string
}): Promise<PaginatedResponse<ITurma>> {
  const { data } = await api.get<PaginatedResponse<ITurma>>('/turmas', { params })
  return data
}

/** Quantidade de turmas do projeto por categoria (abas da lista), respeitando a busca. */
export async function getTurmaCounts(params: {
  projectId: string
  search?: string
  professorId?: string
}): Promise<TurmaCounts> {
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

// ---------------- importação da planilha (fase 4) ----------------

export type ImportAction = 'create' | 'update' | 'unchanged' | 'error'

export interface ImportIssue {
  field: 'name' | 'code' | 'schedule' | 'sector' | 'professor' | 'notes' | 'studentCount' | 'category'
  code: string
  message: string
  severity: 'error' | 'warning'
}

export interface ImportRowResult {
  line: number
  action: ImportAction
  code?: string
  name?: string
  category?: TurmaCategory
  sector?: string
  notes?: string
  professor?: string
  professorStatus?: 'existing' | 'new'
  studentCount?: number | null
  schedule?: TimeSlot[]
  changes: string[]
  issues: ImportIssue[]
  turmaId?: string
}

export interface ImportResult {
  summary: Record<ImportAction, number>
  rows: ImportRowResult[]
}

export interface ImportPayload {
  projectId: string
  defaultCategory: TurmaCategory
  /** linhas da planilha, com as células como texto */
  rows: ImportRowPayload[]
}

/** Prévia: o que a importação faria, linha a linha, sem gravar. */
export async function previewImport(payload: ImportPayload): Promise<ImportResult> {
  const { data } = await api.post<ApiSuccess<ImportResult>>('/turmas/import/preview', payload)
  return data.data
}

/** Aplica as linhas novas e as alteradas; as com erro ficam de fora. */
export async function applyImport(payload: ImportPayload): Promise<ImportResult> {
  const { data } = await api.post<ApiSuccess<ImportResult>>('/turmas/import', payload)
  return data.data
}
