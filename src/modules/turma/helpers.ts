import { rolesOf, roleOf, slotCovered } from '@/modules/allocation/helpers'
import type { AllocationRole, IAllocation, ITurma, TimeSlot, WeekDay } from '@/types'

const DAY_ORDER: Record<WeekDay, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5 }

export interface RoleCoverage {
  role: AllocationRole
  /** horários cobertos por um evento recorrente da turma neste papel (mesma regra do dashboard) */
  covered: number
  /** salas distintas dos eventos recorrentes deste papel, na ordem da semana */
  roomIds: string[]
}

export interface TurmaRoomSummary {
  /** horários na grade da turma */
  total: number
  /** teórica e, se a turma tem aula prática, prática (D3: no mesmo horário, em outra sala) */
  roles: RoleCoverage[]
  /** todos os horários têm sala em todos os papéis */
  complete: boolean
  /** primeiro horário (e papel) ainda sem sala, para o atalho "Alocar" */
  firstPending: { slot: TimeSlot; role: AllocationRole } | null
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
    const roles = rolesOf(turma)
    let firstPending: TurmaRoomSummary['firstPending'] = null

    // por horário, a teórica antes da prática
    for (const slot of slots) {
      for (const role of roles) {
        if (!firstPending && !slotCovered(events, slot, role)) firstPending = { slot, role }
      }
    }
    const coverage = roles.map((role) => ({
      role,
      covered: slots.filter((slot) => slotCovered(events, slot, role)).length,
      roomIds: [...new Set(events.filter((e) => roleOf(e) === role).map((e) => e.roomId))],
    }))
    result.set(turma.id, {
      total: slots.length,
      roles: coverage,
      complete: coverage.every((c) => c.covered === slots.length),
      firstPending,
    })
  }
  return result
}
