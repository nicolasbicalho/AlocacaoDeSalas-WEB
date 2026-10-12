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
export type RoomFeature = 'acessibilidade' | 'camera' | 'computadores' | 'bancadas' | 'som'

export interface IRoom {
  id: string
  name: string
  code: string
  buildingId: string
  instituteId: string
  capacity: number
  features: RoomFeature[]
  /** andar (0 = térreo); ausente = não informado */
  floor?: number
  /** quantidade de quadros */
  boardCount?: number
  /** fica na extremidade do corredor */
  corridorEnd?: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Preferências de sala do professor (nunca bloqueiam; só ordenam as sugestões). */
export interface ProfessorPreferences {
  minBoards?: number
  floors?: number[]
  avoidCorridorEnd?: boolean
}

/** Cadastro do instituto — professor não é usuário de login. */
export interface IProfessor {
  id: string
  instituteId: string
  name: string
  preferences: ProfessorPreferences
  notes?: string
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

/** Separação pedida pelo gerente (espelha `TURMA_CATEGORIES` da API). */
export type TurmaCategory = 'graduacao' | 'pos' | 'externa'

export interface ITurma {
  id: string
  projectId: string
  instituteId: string
  /** nome da disciplina */
  name: string
  code?: string
  category: TurmaCategory
  /** setor = departamento que oferta a disciplina */
  sector?: string
  /** anotações/preferências como vieram da planilha */
  notes?: string
  /** null = "a definir" (o número chega depois da planilha) */
  studentCount: number | null
  professor: string
  /** cadastro de professores (associado pelo nome ao salvar a turma) */
  professorId?: string
  /** requisitos da sala teórica */
  requiredFeatures: RoomFeature[]
  /** aula prática no mesmo horário (D3): a turma ocupa uma segunda sala; ausente = só teoria */
  practice?: { requiredFeatures: RoomFeature[] }
  schedule: TimeSlot[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface TurmaCounts {
  total: number
  graduacao: number
  pos: number
  externa: number
}

/** `weekly` = evento recorrente (sempre de turma); `single` = evento único */
export type AllocationType = 'weekly' | 'single'

/** Papel do evento de turma: teórica e prática acontecem no mesmo horário, em salas diferentes. */
export type AllocationRole = 'teorica' | 'pratica'

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
  /** presente em todo evento de turma (eventos antigos vêm como 'teorica') */
  role?: AllocationRole
  createdAt: string
  updatedAt: string
}

export type PreferenceKey = 'minBoards' | 'floors' | 'avoidCorridorEnd'
export type PreferenceStatus = 'met' | 'unmet' | 'unknown'

/** Uma sala avaliada para uma turma num horário (`GET …/allocations/suggestions`). */
export interface RoomSuggestion {
  roomId: string
  name: string
  code: string
  buildingId: string
  capacity: number
  features: RoomFeature[]
  floor?: number
  boardCount?: number
  corridorEnd?: boolean
  /** livre no horário */
  available: boolean
  /** comporta a turma inteira e tem as características exigidas */
  fits: boolean
  capacityStatus: 'ok' | 'insufficient' | 'unknown'
  slack: number | null
  missingFeatures: RoomFeature[]
  preferences: { key: PreferenceKey; status: PreferenceStatus }[]
}

export interface RoomSuggestions {
  /** requiredFeatures = as do papel pedido (teórica: da turma; prática: de `practice`) */
  turma: { id: string; role: AllocationRole; studentCount: number | null; requiredFeatures: RoomFeature[] }
  professor: { id: string; name: string; preferences: ProfessorPreferences } | null
  /** livres e compatíveis primeiro, na ordem de melhor escolha */
  rooms: RoomSuggestion[]
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
  | 'professor'

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
