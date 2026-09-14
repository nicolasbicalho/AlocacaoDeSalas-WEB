import api from '@/services/api'
import type { IProject, ApiSuccess, PaginatedResponse, ProjectStatus } from '@/types'

export interface ProjectPayload {
  name: string
  semester: string
}

export async function listProjects(params: {
  page?: number
  limit?: number
  status?: ProjectStatus
}): Promise<PaginatedResponse<IProject>> {
  const { data } = await api.get<PaginatedResponse<IProject>>('/projects', { params })
  return data
}

export async function getProject(id: string): Promise<IProject> {
  const { data } = await api.get<ApiSuccess<IProject>>(`/projects/${id}`)
  return data.data
}

export async function createProject(payload: ProjectPayload): Promise<IProject> {
  const { data } = await api.post<ApiSuccess<IProject>>('/projects', payload)
  return data.data
}

export async function updateProject(
  id: string,
  payload: Partial<ProjectPayload>,
): Promise<IProject> {
  const { data } = await api.put<ApiSuccess<IProject>>(`/projects/${id}`, payload)
  return data.data
}

export async function activateProject(id: string): Promise<IProject> {
  const { data } = await api.patch<ApiSuccess<IProject>>(`/projects/${id}/activate`)
  return data.data
}

export async function closeProject(id: string): Promise<IProject> {
  const { data } = await api.patch<ApiSuccess<IProject>>(`/projects/${id}/close`)
  return data.data
}
