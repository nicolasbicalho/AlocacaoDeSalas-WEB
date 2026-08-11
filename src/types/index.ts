export type UserRole = 'admin' | 'coordinator' | 'professor'

export interface IUser {
  id: string
  name: string
  email: string
  role: UserRole
  departmentId?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Subconjunto do usuário retornado pelo login e mantido na sessão do front. */
export type AuthUser = Pick<IUser, 'id' | 'name' | 'email' | 'role'>

export interface IDepartment {
  id: string
  name: string
  code: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface IBuilding {
  id: string
  name: string
  code: string
  departmentId: string
  latitude?: number
  longitude?: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export type RoomType = 'classroom' | 'laboratory' | 'auditorium' | 'other'

export interface IRoom {
  id: string
  name: string
  code: string
  buildingId: string
  capacity: number
  type: RoomType
  floor: number
  resources: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'draft' | 'active' | 'closed'

export interface IProject {
  id: string
  name: string
  semester: string
  departmentId: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown[]
  }
}
