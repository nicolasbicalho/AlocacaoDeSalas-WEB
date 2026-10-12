import { DAY_OPTIONS, rolesOf, roleOf, ROLE_LABELS } from '@/modules/allocation/helpers'
import { categoryLabel } from '@/shared/constants/turmaCategories'
import type { AllocationRole, IAllocation, IBuilding, IRoom, ITurma, TimeSlot, WeekDay } from '@/types'

/**
 * Quadro de horários semanal do semestre (pedido junto com a fase 4): a grade de todas as
 * turmas ativas, com as salas alocadas (teórica e prática). Função pura — a geração do XLSX
 * fica em `timetable.export.ts`.
 */

export const WEEK: WeekDay[] = DAY_OPTIONS.map((d) => d.value)
const DAY_ORDER = Object.fromEntries(WEEK.map((d, i) => [d, i])) as Record<WeekDay, number>

export interface TimetableBand {
  start: string
  end: string
  /** turmas que acontecem nesse horário, por dia */
  cells: Record<WeekDay, string[]>
}

export interface TimetableRow {
  day: WeekDay | null
  start: string
  end: string
  name: string
  code: string
  category: string
  professor: string
  sector: string
  studentCount: number | null
  theoryRoom: string
  practiceRoom: string
  status: string
}

export interface TimetableRoom {
  label: string
  cells: Record<WeekDay, string[]>
}

export interface Timetable {
  bands: TimetableBand[]
  rows: TimetableRow[]
  rooms: TimetableRoom[]
}

const emptyWeek = (): Record<WeekDay, string[]> =>
  Object.fromEntries(WEEK.map((d) => [d, []])) as unknown as Record<WeekDay, string[]>

/** Evento recorrente do papel que cobre o horário inteiro (mesma regra da cobertura). */
function coveringEvent(events: IAllocation[], slot: TimeSlot, role: AllocationRole): IAllocation | undefined {
  return events.find(
    (e) =>
      e.type === 'weekly' &&
      roleOf(e) === role &&
      e.timeSlot.day === slot.day &&
      e.timeSlot.start <= slot.start &&
      e.timeSlot.end >= slot.end,
  )
}

export function buildTimetable(
  turmas: ITurma[],
  allocations: IAllocation[],
  rooms: IRoom[],
  buildings: IBuilding[],
): Timetable {
  const roomById = new Map(rooms.map((r) => [r.id, r]))
  const buildingById = new Map(buildings.map((b) => [b.id, b]))
  const turmaById = new Map(turmas.map((t) => [t.id, t]))
  const weeklyByTurma = new Map<string, IAllocation[]>()
  for (const a of allocations) {
    if (a.type !== 'weekly' || !a.turmaId) continue
    weeklyByTurma.set(a.turmaId, [...(weeklyByTurma.get(a.turmaId) ?? []), a])
  }
  const roomName = (id?: string) => (id ? roomById.get(id)?.name ?? '—' : '')

  const bands = new Map<string, TimetableBand>()
  const rows: TimetableRow[] = []
  const active = turmas
    .filter((t) => t.active)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base', numeric: true }))

  for (const t of active) {
    const events = weeklyByTurma.get(t.id) ?? []
    const tag = t.category && t.category !== 'graduacao' ? ` [${categoryLabel(t.category)}]` : ''
    const base = {
      name: t.name,
      code: t.code ?? '',
      category: categoryLabel(t.category),
      professor: t.professor,
      sector: t.sector ?? '',
      studentCount: t.studentCount,
    }
    if (t.schedule.length === 0) {
      rows.push({ ...base, day: null, start: '', end: '', theoryRoom: '', practiceRoom: '', status: 'sem horário' })
      continue
    }
    for (const slot of t.schedule) {
      const theory = roomName(coveringEvent(events, slot, 'teorica')?.roomId)
      const practice = t.practice ? roomName(coveringEvent(events, slot, 'pratica')?.roomId) : ''
      const missing = rolesOf(t).filter((role) => !(role === 'pratica' ? practice : theory))
      const status =
        missing.length === 0
          ? 'com sala'
          : missing.length === rolesOf(t).length
            ? 'sem sala'
            : `falta ${ROLE_LABELS[missing[0]].toLowerCase()}`
      rows.push({ ...base, day: slot.day, start: slot.start, end: slot.end, theoryRoom: theory, practiceRoom: practice, status })

      // célula do quadro: "Disciplina (CÓD) [Pós] · sala(s) · professor"
      const where = t.practice
        ? `T: ${theory || 'sem sala'} · P: ${practice || 'sem sala'}`
        : theory || 'sem sala'
      const key = `${slot.start}|${slot.end}`
      if (!bands.has(key)) bands.set(key, { start: slot.start, end: slot.end, cells: emptyWeek() })
      bands.get(key)!.cells[slot.day].push(`${t.name}${t.code ? ` (${t.code})` : ''}${tag} · ${where} · ${t.professor}`)
    }
  }

  rows.sort(
    (a, b) =>
      (a.day === null ? 99 : DAY_ORDER[a.day]) - (b.day === null ? 99 : DAY_ORDER[b.day]) ||
      a.start.localeCompare(b.start) ||
      a.name.localeCompare(b.name, 'pt', { sensitivity: 'base', numeric: true }),
  )

  // ocupação por sala: o que cada sala recebe em cada dia (só aulas recorrentes)
  const label = (r: IRoom) => `${buildingById.get(r.buildingId)?.name ?? ''} · ${r.name}`
  const roomRows: TimetableRoom[] = rooms
    .filter((r) => r.active)
    .sort((a, b) => label(a).localeCompare(label(b), 'pt', { sensitivity: 'base', numeric: true }))
    .map((r) => {
      const cells = emptyWeek()
      allocations
        .filter((a) => a.type === 'weekly' && a.roomId === r.id && a.turmaId && turmaById.get(a.turmaId)?.active)
        .sort((a, b) => a.timeSlot.start.localeCompare(b.timeSlot.start))
        .forEach((a) => {
          const t = turmaById.get(a.turmaId!)!
          const role = t.practice ? ` [${ROLE_LABELS[roleOf(a)]}]` : ''
          cells[a.timeSlot.day].push(`${a.timeSlot.start}–${a.timeSlot.end} ${t.name}${t.code ? ` (${t.code})` : ''}${role}`)
        })
      return { label: label(r), cells }
    })

  return {
    bands: [...bands.values()].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end)),
    rows,
    rooms: roomRows,
  }
}
