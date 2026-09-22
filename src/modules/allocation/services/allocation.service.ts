import api from '@/services/api'
import type { IAllocation, TimeSlot, AllocationType, WeekDay, ApiSuccess } from '@/types'

export interface AllocationCreatePayload {
  turmaId: string
  roomId: string
  timeSlot: TimeSlot
  type: AllocationType
  date?: string
}

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
