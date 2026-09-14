import api from '@/services/api'
import type { IRoom, RoomAttribute, ApiSuccess, PaginatedResponse } from '@/types'

export interface RoomCreatePayload {
  buildingId: string
  name: string
  code: string
  capacity: number
  attributes: RoomAttribute[]
}

export type RoomUpdatePayload = Partial<Omit<RoomCreatePayload, 'buildingId'>>

export async function listRooms(params: {
  buildingId?: string
  page?: number
  limit?: number
  search?: string
}): Promise<PaginatedResponse<IRoom>> {
  const { data } = await api.get<PaginatedResponse<IRoom>>('/rooms', { params })
  return data
}

export async function getRoom(id: string): Promise<IRoom> {
  const { data } = await api.get<ApiSuccess<IRoom>>(`/rooms/${id}`)
  return data.data
}

export async function createRoom(payload: RoomCreatePayload): Promise<IRoom> {
  const { data } = await api.post<ApiSuccess<IRoom>>('/rooms', payload)
  return data.data
}

export async function updateRoom(id: string, payload: RoomUpdatePayload): Promise<IRoom> {
  const { data } = await api.put<ApiSuccess<IRoom>>(`/rooms/${id}`, payload)
  return data.data
}

export async function deactivateRoom(id: string): Promise<IRoom> {
  const { data } = await api.patch<ApiSuccess<IRoom>>(`/rooms/${id}/deactivate`)
  return data.data
}
