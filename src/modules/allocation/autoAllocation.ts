import type { RouteLocationRaw } from 'vue-router'
import { nextDateForWeekday, referenceDate } from '@/modules/dashboard/helpers'
import { todayISO } from './helpers'
import type { AutoMetrics, AutoStrategy, AutoUnallocated, IProject, UnallocatedReason } from '@/types'

/** Textos e formatação da alocação automática (spec WEB 07). */

export const STRATEGY_LABELS: Record<AutoStrategy, string> = {
  gerente: 'Do gerente — exigências raras, depois as menores',
  'maiores-primeiro': 'Maiores primeiro (comparação)',
}

export const STRATEGY_SHORT: Record<AutoStrategy, string> = {
  gerente: 'Do gerente',
  'maiores-primeiro': 'Maiores primeiro',
}

export const REASON_LABELS: Record<UnallocatedReason, string> = {
  NO_STUDENT_COUNT: 'Sem nº de alunos (a capacidade não pode ser conferida)',
  NO_ROOM_WITH_FEATURES: 'Nenhuma sala tem as características exigidas',
  NO_ROOM_WITH_CAPACITY: 'Nenhuma sala com as características comporta a turma',
  ALL_OCCUPIED: 'Todas as salas compatíveis estão ocupadas nesse horário',
  TURMA_BUSY: 'A turma já tem outro evento desse papel nesse horário',
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

/** Linhas da comparação: qual direção é melhor em cada métrica. */
export const METRIC_ROWS: { key: keyof AutoMetrics; label: string; better: 'higher' | 'lower'; format?: (m: AutoMetrics) => string }[] = [
  { key: 'allocated', label: 'Horários alocados', better: 'higher', format: (m) => `${m.allocated} de ${m.demands}` },
  { key: 'unallocated', label: 'Ficam sem sala', better: 'lower' },
  { key: 'wastedSeats', label: 'Lugares desperdiçados', better: 'lower' },
  { key: 'averageOccupancy', label: 'Ocupação média das salas', better: 'higher', format: (m) => percent(m.averageOccupancy) },
  { key: 'preferencesMet', label: 'Preferências atendidas', better: 'higher', format: (m) => `${m.preferencesMet} de ${m.preferencesTotal}` },
  { key: 'oversizedRooms', label: 'Salas grandes demais (mais que o dobro)', better: 'lower' },
]

/** Estratégias que vencem numa métrica (empate → nenhuma destacada). */
export function winners(byStrategy: Record<AutoStrategy, AutoMetrics>, key: keyof AutoMetrics, better: 'higher' | 'lower'): AutoStrategy[] {
  const entries = Object.entries(byStrategy) as [AutoStrategy, AutoMetrics][]
  const values = entries.map(([, m]) => m[key])
  const best = better === 'higher' ? Math.max(...values) : Math.min(...values)
  const top = entries.filter(([, m]) => m[key] === best).map(([s]) => s)
  return top.length === entries.length ? [] : top
}

/** "Alocar →" de um horário que ficou sem sala: o mesmo atalho do dashboard, com o papel. */
export function unallocatedLink(project: IProject, u: AutoUnallocated): RouteLocationRaw | null {
  if (!u.timeSlot || !project.startDate || !project.endDate) return null
  const date = nextDateForWeekday(referenceDate(project.startDate, project.endDate, todayISO()), u.timeSlot.day, project.endDate)
  return {
    path: `/projects/${project.id}/allocation`,
    query: {
      ...(date ? { date } : {}),
      turma: u.turmaId,
      start: u.timeSlot.start,
      end: u.timeSlot.end,
      ...(u.role === 'pratica' ? { role: 'pratica' } : {}),
    },
  }
}
