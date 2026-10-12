import type { IAllocation, ITurma, TimeSlot, WeekDay } from '@/types'

const DAY_ORDER: Record<WeekDay, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5 }

export interface TurmaRoomSummary {
  /** horários na grade da turma */
  total: number
  /** horários cobertos por um evento recorrente da própria turma (mesma regra do dashboard) */
  covered: number
  /** salas distintas dos eventos recorrentes da turma, na ordem da semana */
  roomIds: string[]
  /** primeiro horário ainda sem sala (para o atalho "Alocar") */
  firstPending: TimeSlot | null
}

/** Resumo de salas por turma, a partir dos eventos do projeto. */
export function summarizeTurmaRooms(
  turmas: ITurma[],
  allocations: IAllocation[],
): Map<string, TurmaRoomSummary> {
  const byTurma = new Map<string, IAllocation[]>()
  for (const a of allocations) {
    if (a.type !== 'weekly' || !a.turmaId) continue
    const list = byTurma.get(a.turmaId) ?? []
    list.push(a)
    byTurma.set(a.turmaId, list)
  }

  const result = new Map<string, TurmaRoomSummary>()
  for (const turma of turmas) {
    const events = (byTurma.get(turma.id) ?? []).sort(
      (a, b) =>
        DAY_ORDER[a.timeSlot.day] - DAY_ORDER[b.timeSlot.day] || a.timeSlot.start.localeCompare(b.timeSlot.start),
    )
    const slots = [...turma.schedule].sort(
      (a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day] || a.start.localeCompare(b.start),
    )
    let covered = 0
    let firstPending: TimeSlot | null = null
    for (const slot of slots) {
      const ok = events.some(
        (e) => e.timeSlot.day === slot.day && e.timeSlot.start <= slot.start && e.timeSlot.end >= slot.end,
      )
      if (ok) covered++
      else firstPending ??= slot
    }
    result.set(turma.id, {
      total: slots.length,
      covered,
      roomIds: [...new Set(events.map((e) => e.roomId))],
      firstPending,
    })
  }
  return result
}
