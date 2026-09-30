import api from '@/services/api'
import { listProjects } from '@/modules/project/services/project.service'
import { listTurmas } from '@/modules/turma/services/turma.service'
import { listRooms } from '@/modules/room/services/room.service'
import { listAllocations } from '@/modules/allocation/services/allocation.service'
import { listInstitutes } from '@/modules/institute/services/institute.service'
import { listAuditLogs } from '@/modules/audit/services/audit.service'
import type {
  IAllocation,
  IAuditLog,
  IInstitute,
  IProject,
  IRoom,
  ITurma,
  IUser,
  PaginatedResponse,
} from '@/types'

export interface UserDashboardData {
  /** projeto ativo do instituto (no máximo um) */
  active: IProject | null
  /** rascunhos, para orientar quando não há projeto ativo */
  drafts: IProject[]
  turmas: ITurma[]
  rooms: IRoom[]
  allocations: IAllocation[]
}

export async function loadUserDashboard(): Promise<UserDashboardData> {
  const projects = (await listProjects({ limit: 100 })).data
  const active = projects.find((p) => p.status === 'active') ?? null
  const drafts = projects.filter((p) => p.status === 'draft')
  if (!active) return { active, drafts, turmas: [], rooms: [], allocations: [] }

  const [turmaRes, roomRes, allocations] = await Promise.all([
    listTurmas({ projectId: active.id, limit: 100 }),
    listRooms({ limit: 100 }),
    listAllocations(active.id),
  ])
  return { active, drafts, turmas: turmaRes.data, rooms: roomRes.data, allocations }
}

export interface AdminDashboardData {
  institutes: number
  users: number
  projects: { active: number; draft: number; closed: number }
  institutesWithoutActive: IInstitute[]
  recent: IAuditLog[]
}

async function countUsers(): Promise<number> {
  const { data } = await api.get<PaginatedResponse<IUser>>('/users', { params: { limit: 1 } })
  return data.pagination.total
}

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const [institutes, users, active, draft, closed, recent] = await Promise.all([
    listInstitutes({ limit: 100 }),
    countUsers(),
    listProjects({ status: 'active', limit: 100 }),
    listProjects({ status: 'draft', limit: 1 }),
    listProjects({ status: 'closed', limit: 1 }),
    listAuditLogs({ limit: 8 }),
  ])
  const withActive = new Set(active.data.map((p) => p.instituteId))
  return {
    // institutos são poucos: conta os ativos a partir da lista (inativos não entram no painel)
    institutes: institutes.data.filter((i) => i.active).length,
    users,
    projects: {
      active: active.pagination.total,
      draft: draft.pagination.total,
      closed: closed.pagination.total,
    },
    institutesWithoutActive: institutes.data.filter((i) => i.active && !withActive.has(i.id)),
    recent: recent.data,
  }
}
