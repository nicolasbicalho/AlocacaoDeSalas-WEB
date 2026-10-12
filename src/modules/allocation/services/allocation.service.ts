import api from '@/services/api'
import type {
  IAllocation,
  TimeSlot,
  AllocationType,
  EventColor,
  WeekDay,
  AllocationRole,
  RoomSuggestions,
  AutoStrategy,
  AutoAllocationResult,
  AutoComparison,
  ApiSuccess,
} from '@/types'

/**
 * Recorrente (`weekly`): `turmaId` obrigatório, sem `date`/`title`/`color`.
 * Único (`single`): `date` obrigatória; exatamente um entre `turmaId` e `title`; `color` opcional.
 */
export interface AllocationCreatePayload {
  turmaId?: string
  title?: string
  roomId: string
  timeSlot: TimeSlot
  type: AllocationType
  date?: string
  color?: EventColor
  /** só em evento de turma; prática exige aula prática na turma */
  role?: AllocationRole
}

/** A turma do evento não muda; `title` só vale para evento de texto livre. */
export type AllocationMovePayload = Omit<AllocationCreatePayload, 'turmaId'>

export async function listAllocations(
  projectId: string,
  params?: { roomId?: string; turmaId?: string; day?: WeekDay },
): Promise<IAllocation[]> {
  const { data } = await api.get<ApiSuccess<IAllocation[]>>(
    `/projects/${projectId}/allocations`,
    { params },
  )
  return data.data
}

export async function createAllocation(
  projectId: string,
  payload: AllocationCreatePayload,
): Promise<IAllocation> {
  const { data } = await api.post<ApiSuccess<IAllocation>>(
    `/projects/${projectId}/allocations`,
    payload,
  )
  return data.data
}

export async function moveAllocation(
  projectId: string,
  id: string,
  payload: AllocationMovePayload,
): Promise<IAllocation> {
  const { data } = await api.patch<ApiSuccess<IAllocation>>(
    `/projects/${projectId}/allocations/${id}`,
    payload,
  )
  return data.data
}

export async function deleteAllocation(projectId: string, id: string): Promise<void> {
  await api.delete(`/projects/${projectId}/allocations/${id}`)
}

/**
 * Salas avaliadas para uma turma num horário: livres e compatíveis primeiro, por melhor encaixe e
 * preferências do professor. `excludeId` = evento em edição (não conflita consigo mesmo).
 */
export async function getRoomSuggestions(
  projectId: string,
  params: {
    turmaId: string
    role: AllocationRole
    type: AllocationType
    day?: WeekDay
    date?: string
    start: string
    end: string
    excludeId?: string
  },
): Promise<RoomSuggestions> {
  const { data } = await api.get<ApiSuccess<RoomSuggestions>>(
    `/projects/${projectId}/allocations/suggestions`,
    { params },
  )
  return data.data
}

// ---------------- alocação automática (módulo 07) ----------------

export interface AutoRunPayload {
  strategy: AutoStrategy
  /** refazer: os automáticos atuais são substituídos; os manuais nunca mudam */
  replaceAuto: boolean
}

/** Simula: o plano e as métricas, sem gravar. */
export async function previewAutoAllocation(projectId: string, payload: AutoRunPayload): Promise<AutoAllocationResult> {
  const { data } = await api.post<ApiSuccess<AutoAllocationResult>>(`/projects/${projectId}/allocations/auto/preview`, payload)
  return data.data
}

/** Recalcula no servidor e grava os eventos automáticos. */
export async function applyAutoAllocation(projectId: string, payload: AutoRunPayload): Promise<AutoAllocationResult> {
  const { data } = await api.post<ApiSuccess<AutoAllocationResult>>(`/projects/${projectId}/allocations/auto`, payload)
  return data.data
}

/** As duas estratégias sobre os mesmos dados (só métricas). */
export async function compareAutoAllocation(projectId: string, replaceAuto: boolean): Promise<AutoComparison> {
  const { data } = await api.post<ApiSuccess<AutoComparison>>(`/projects/${projectId}/allocations/auto/compare`, { replaceAuto })
  return data.data
}

/** Remove os eventos automáticos do projeto; os manuais ficam. */
export async function clearAutoAllocation(projectId: string): Promise<number> {
  const { data } = await api.delete<ApiSuccess<{ removed: number }>>(`/projects/${projectId}/allocations/auto`)
  return data.data.removed
}
