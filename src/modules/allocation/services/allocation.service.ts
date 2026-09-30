import api from '@/services/api'
import type { IAllocation, TimeSlot, AllocationType, EventColor, WeekDay, ApiSuccess } from '@/types'

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
