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

/** Catálogo fixo de características de sala (espelha `ROOM_FEATURES` da API). */
export type RoomFeature =
  | 'projetor'
  | 'ar_condicionado'
  | 'acessibilidade'
  | 'computadores'
  | 'som'
  | 'bancadas'

export interface IRoom {
  id: string
  name: string
  code: string
  buildingId: string
  instituteId: string
  capacity: number
  features: RoomFeature[]
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
  /** 'YYYY-MM-DD' — início e fim do semestre */
  startDate: string
  endDate: string
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
  requiredFeatures: RoomFeature[]
  schedule: TimeSlot[]
  active: boolean
  createdAt: string
  updatedAt: string
}

/** `weekly` = evento recorrente (sempre de turma); `single` = evento único */
export type AllocationType = 'weekly' | 'single'

/** Paleta fixa dos eventos únicos (espelha `EVENT_COLORS` da API). */
export type EventColor = 'amber' | 'emerald' | 'rose' | 'violet' | 'sky' | 'orange'

export interface IAllocation {
  id: string
  projectId: string
  instituteId: string
  /** ausente em evento único de texto livre (ex.: palestra) */
  turmaId?: string
  /** título livre — só em evento único sem turma */
  title?: string
  roomId: string
  timeSlot: TimeSlot
  type: AllocationType
  date?: string
  color?: EventColor
  createdAt: string
  updatedAt: string
}

export type AuditEntity =
  | 'auth'
  | 'user'
  | 'institute'
  | 'project'
  | 'building'
  | 'room'
  | 'turma'
  | 'allocation'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'move'
  | 'activate'
  | 'deactivate'
  | 'close'
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'forgot_password'
  | 'reset_password'

export interface IAuditLog {
  id: string
  userId?: string
  userName?: string
  userEmail?: string
  role?: string
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  method: string
  path: string
  statusCode: number
  details?: unknown
  ip?: string
  userAgent?: string
  createdAt: string
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
