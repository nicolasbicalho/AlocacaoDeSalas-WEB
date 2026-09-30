import { addDays, clampDate, mondayOf, weekdayFromDate } from '@/modules/allocation/helpers'
import type { IAllocation, IRoom, ITurma, TimeSlot, WeekDay } from '@/types'

const DAY_ORDER: Record<WeekDay, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5 }

export function diffDays(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

// ---------------- andamento do semestre ----------------

export type SemesterProgress =
  | { phase: 'before'; daysToStart: number }
  | { phase: 'running'; week: number; totalWeeks: number; percent: number }
  | { phase: 'after'; daysSinceEnd: number }

export function semesterProgress(start: string, end: string, today: string): SemesterProgress {
  if (today < start) return { phase: 'before', daysToStart: diffDays(today, start) }
  if (today > end) return { phase: 'after', daysSinceEnd: diffDays(end, today) }
  const firstMonday = mondayOf(start)
  const week = Math.floor(diffDays(firstMonday, today) / 7) + 1
  const totalWeeks = Math.floor(diffDays(firstMonday, end) / 7) + 1
  const total = diffDays(start, end)
  const percent = total > 0 ? Math.round((diffDays(start, today) / total) * 100) : 100
  return { phase: 'running', week, totalWeeks, percent }
}

// ---------------- cobertura dos horários das turmas ----------------

export interface PendingSlot {
  turma: ITurma
  slot: TimeSlot
}

export interface Coverage {
  /** horários declarados na grade das turmas ativas */
  total: number
  /** desses, quantos já têm um evento recorrente da turma cobrindo o horário inteiro */
  covered: number
  pending: PendingSlot[]
  /** turmas ativas sem nenhum horário na grade (não dá para alocar) */
  withoutSchedule: ITurma[]
}

/**
 * Um horário da grade da turma está coberto quando existe um evento recorrente da
 * própria turma, no mesmo dia da semana, que abrange o horário inteiro.
 */
export function coverage(turmas: ITurma[], allocations: IAllocation[]): Coverage {
  const weeklyByTurma = new Map<string, IAllocation[]>()
  for (const a of allocations) {
    if (a.type !== 'weekly' || !a.turmaId) continue
    const list = weeklyByTurma.get(a.turmaId) ?? []
    list.push(a)
    weeklyByTurma.set(a.turmaId, list)
  }

  let total = 0
  let covered = 0
  const pending: PendingSlot[] = []
  const withoutSchedule: ITurma[] = []

  for (const turma of turmas.filter((t) => t.active)) {
    if (turma.schedule.length === 0) {
      withoutSchedule.push(turma)
      continue
    }
    const events = weeklyByTurma.get(turma.id) ?? []
    for (const slot of turma.schedule) {
      total++
      const ok = events.some(
        (e) => e.timeSlot.day === slot.day && e.timeSlot.start <= slot.start && e.timeSlot.end >= slot.end,
      )
      if (ok) covered++
      else pending.push({ turma, slot })
    }
  }

  pending.sort(
    (a, b) =>
      DAY_ORDER[a.slot.day] - DAY_ORDER[b.slot.day] ||
      a.slot.start.localeCompare(b.slot.start) ||
      a.turma.name.localeCompare(b.turma.name),
  )
  return { total, covered, pending, withoutSchedule }
}

/** Salas ativas sem nenhum evento recorrente no projeto. */
export function idleRooms(rooms: IRoom[], allocations: IAllocation[]): IRoom[] {
  const used = new Set(allocations.filter((a) => a.type === 'weekly').map((a) => a.roomId))
  return rooms.filter((r) => r.active && !used.has(r.id))
}

// ---------------- datas de referência ----------------

/** Data a partir da qual olhar o semestre: hoje, ou o início se o semestre ainda não começou. */
export function referenceDate(start: string, end: string, today: string): string {
  return clampDate(today, start, end)
}

/** Primeira data ≥ `from` (e ≤ `end`) que cai no dia da semana pedido. */
export function nextDateForWeekday(from: string, day: WeekDay, end: string): string | null {
  for (let i = 0, d = from; i < 7 && d <= end; i++, d = addDays(d, 1)) {
    if (weekdayFromDate(d) === day) return d
  }
  return null
}

/** Próximos eventos únicos a partir de `from` (inclusive), em ordem cronológica. */
export function upcomingSingles(allocations: IAllocation[], from: string, limit = 5): IAllocation[] {
  return allocations
    .filter((a) => a.type === 'single' && a.date && a.date >= from)
    .sort((a, b) => (a.date! + a.timeSlot.start).localeCompare(b.date! + b.timeSlot.start))
    .slice(0, limit)
}

// ---------------- tempo relativo (atividade recente) ----------------

const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return rtf.format(seconds, 'second')
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), 'hour')
  return rtf.format(Math.round(seconds / 86_400), 'day')
}
