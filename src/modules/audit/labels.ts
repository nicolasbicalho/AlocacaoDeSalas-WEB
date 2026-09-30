import type { AuditAction, AuditEntity } from '@/types'

export const ENTITY_LABELS: Record<AuditEntity, string> = {
  auth: 'Autenticação',
  user: 'Usuário',
  institute: 'Instituto',
  project: 'Projeto',
  building: 'Prédio',
  room: 'Sala',
  turma: 'Turma',
  allocation: 'Evento (cronograma)',
}

export const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Criação',
  update: 'Edição',
  delete: 'Remoção',
  move: 'Edição de evento',
  activate: 'Ativação',
  deactivate: 'Desativação',
  close: 'Encerramento',
  login: 'Login',
  login_failed: 'Login com falha',
  logout: 'Logout',
  forgot_password: 'Esqueci a senha',
  reset_password: 'Redefinição de senha',
}

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export function actionVariant(action: AuditAction): BadgeVariant {
  switch (action) {
    case 'create':
    case 'activate':
      return 'success'
    case 'delete':
    case 'deactivate':
    case 'login_failed':
      return 'danger'
    case 'close':
    case 'forgot_password':
    case 'reset_password':
      return 'warning'
    case 'update':
    case 'move':
      return 'info'
    default:
      return 'neutral'
  }
}
