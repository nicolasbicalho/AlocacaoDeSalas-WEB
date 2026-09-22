export type UserRole = 'admin' | 'user'

export interface IUser {
  id: string
  name: string
  email: string
  role: UserRole
  instituteId?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Subconjunto do usuário retornado pelo login e mantido na sessão do front. */
export type AuthUser = Pick<IUser, 'id' | 'name' | 'email' | 'role'>

export interface IInstitute {
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
  instituteId: string
  latitude?: number
  longitude?: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export type RoomAttributeValue = string | number | boolean

export interface RoomAttribute {
  key: string
  value: RoomAttributeValue
}

export interface IRoom {
  id: string
  name: string
  code: string
  buildingId: string
  instituteId: string
  capacity: number
  attributes: RoomAttribute[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'draft' | 'active' | 'closed'

export interface IProject {
  id: string
  name: string
  semester: string
  instituteId: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export interface TimeSlot {
  day: WeekDay
  start: string
  end: string
}

export interface ITurma {
  id: string
  projectId: string
  instituteId: string
  name: string
  code?: string
  studentCount: number
  professor: string
  requiredAttributes: string[]
  schedule: TimeSlot[]
  active: boolean
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
