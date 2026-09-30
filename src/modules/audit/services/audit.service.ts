import api from '@/services/api'
import type { AuditAction, AuditEntity, IAuditLog, PaginatedResponse } from '@/types'

export interface AuditLogQuery {
  page?: number
  limit?: number
  entity?: AuditEntity
  action?: AuditAction
  userId?: string
  /** 'YYYY-MM-DD' */
  from?: string
  to?: string
}

export async function listAuditLogs(params: AuditLogQuery): Promise<PaginatedResponse<IAuditLog>> {
  const { data } = await api.get<PaginatedResponse<IAuditLog>>('/audit-logs', { params })
  return data
}
