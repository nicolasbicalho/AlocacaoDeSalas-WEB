import { DAY_OPTIONS, ROLE_LABELS, dayLabel, roleOf, rolesOf } from '@/modules/allocation/helpers'
import { coveringEvent } from '@/modules/turma/timetable'
import type { IAllocation, IProfessor, IRoom, ITurma, OccupancyReport, ShiftKey, WeekDay } from '@/types'

/**
 * Relatórios (módulo 08): grades semanais por sala e por professor e as linhas da planilha
 * de ocupação. Funções puras — os componentes só desenham.
 */

const compare = (a: string, b: string) => a.localeCompare(b, 'pt', { sensitivity: 'base', numeric: true })
const WEEKDAYS: WeekDay[] = ['mon', 'tue', 'wed', 'thu', 'fri']

export const SHIFT_LABELS: Record<ShiftKey, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' }

// ---------------- formatação ----------------

/** 0,224 → "22%"; null → "—". */
export function formatPct(value: number | null): string {
  return value == null ? '—' : `${Math.round(value * 100)}%`
}

/** 24 → "24 h"; 3,5 → "3,5 h". */
export function formatHours(hours: number): string {
  return `${hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`
}

/** "Seg–Sex, 07:00–22:00 · 75 h por sala por semana" */
export function windowText(window: OccupancyReport['window']): string {
  const short = Object.fromEntries(DAY_OPTIONS.map((d) => [d.value, d.label])) as Record<WeekDay, string>
  const days = `${short[window.days[0]]}–${short[window.days[window.days.length - 1]]}`
  return `${days}, ${window.start}–${window.end} · ${formatHours(window.weeklyHours)} por sala por semana`
}

// ---------------- grade semanal ----------------

export interface ScheduleEntry {
  title: string
  detail: string
  /** "Prática" nas aulas práticas */
  tag?: string
  /** evento gerado pela alocação automática */
  auto?: boolean
  /** horário do professor ainda sem sala (ou sem um dos papéis) */
  missing?: boolean
}

export interface ScheduleBand {
  start: string
  end: string
  cells: Record<WeekDay, ScheduleEntry[]>
}

export interface WeeklySchedule {
  /** Seg–Sex; o sábado só aparece quando há aula nele */
  days: WeekDay[]
  bands: ScheduleBand[]
}

const emptyWeek = (): Record<WeekDay, ScheduleEntry[]> =>
  Object.fromEntries(DAY_OPTIONS.map((d) => [d.value, []])) as unknown as Record<WeekDay, ScheduleEntry[]>

function buildSchedule(items: { day: WeekDay; start: string; end: string; entry: ScheduleEntry }[]): WeeklySchedule {
  const bands = new Map<string, ScheduleBand>()
  for (const { day, start, end, entry } of items) {
    const key = `${start}|${end}`
    if (!bands.has(key)) bands.set(key, { start, end, cells: emptyWeek() })
    bands.get(key)!.cells[day].push(entry)
  }
  const sorted = [...bands.values()].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end))
  for (const band of sorted) {
    for (const day of Object.keys(band.cells) as WeekDay[]) band.cells[day].sort((a, b) => compare(a.title, b.title))
  }
  return {
    days: items.some((i) => i.day === 'sat') ? [...WEEKDAYS, 'sat'] : WEEKDAYS,
    bands: sorted,
  }
}

const turmaTitle = (t: Pick<ITurma, 'name' | 'code'>) => `${t.name}${t.code ? ` (${t.code})` : ''}`

/** Aulas semanais de uma sala: disciplina, professor, papel e origem. */
export function roomSchedule(roomId: string, allocations: IAllocation[], turmas: ITurma[]): WeeklySchedule {
  const turmaById = new Map(turmas.map((t) => [t.id, t]))
  return buildSchedule(
    allocations
      .filter((a) => a.type === 'weekly' && a.roomId === roomId)
      .map((a) => {
        const t = a.turmaId ? turmaById.get(a.turmaId) : undefined
        return {
          ...a.timeSlot,
          entry: {
            title: t ? turmaTitle(t) : 'Turma removida',
            detail: t?.professor ?? '',
            ...(roleOf(a) === 'pratica' ? { tag: ROLE_LABELS.pratica } : {}),
            ...(a.source === 'auto' ? { auto: true } : {}),
          },
        }
      }),
  )
}

export interface SingleEventItem {
  id: string
  date: string
  start: string
  end: string
  label: string
}

/** Eventos únicos de uma sala, em ordem de data. */
export function roomSingleEvents(roomId: string, allocations: IAllocation[], turmas: ITurma[]): SingleEventItem[] {
  const turmaById = new Map(turmas.map((t) => [t.id, t]))
  return allocations
    .filter((a) => a.type === 'single' && a.roomId === roomId && a.date)
    .map((a) => {
      const t = a.turmaId ? turmaById.get(a.turmaId) : undefined
      return {
        id: a.id,
        date: a.date!,
        start: a.timeSlot.start,
        end: a.timeSlot.end,
        label: a.title ?? (t ? turmaTitle(t) : 'Evento'),
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
}

/**
 * Horários das turmas do professor (cadastro do módulo 11) com a sala de cada papel.
 * Mesma regra de cobertura do quadro de horários: o evento recorrente do papel abrange o horário inteiro.
 */
export function professorSchedule(
  professorId: string,
  turmas: ITurma[],
  allocations: IAllocation[],
  rooms: IRoom[],
): WeeklySchedule {
  const roomName = new Map(rooms.map((r) => [r.id, r.name]))
  const weeklyByTurma = new Map<string, IAllocation[]>()
  for (const a of allocations) {
    if (a.type !== 'weekly' || !a.turmaId) continue
    weeklyByTurma.set(a.turmaId, [...(weeklyByTurma.get(a.turmaId) ?? []), a])
  }

  const items = turmas
    .filter((t) => t.active && t.professorId === professorId)
    .flatMap((t) =>
      t.schedule.map((slot) => {
        const events = weeklyByTurma.get(t.id) ?? []
        const room = (role: 'teorica' | 'pratica') => {
          const e = coveringEvent(events, slot, role)
          return e ? roomName.get(e.roomId) ?? '—' : ''
        }
        const theory = room('teorica')
        const practice = t.practice ? room('pratica') : ''
        const missing = rolesOf(t).some((role) => !(role === 'pratica' ? practice : theory))
        const detail = t.practice
          ? `T: ${theory || 'sem sala'} · P: ${practice || 'sem sala'}`
          : theory || 'sem sala'
        return { ...slot, entry: { title: turmaTitle(t), detail, ...(missing ? { missing: true } : {}) } }
      }),
    )
  return buildSchedule(items)
}

/** Professores do cadastro com turma ativa no projeto, em ordem alfabética. */
export function professorsWithTurmas(professors: IProfessor[], turmas: ITurma[]): IProfessor[] {
  const ids = new Set(turmas.filter((t) => t.active && t.professorId).map((t) => t.professorId!))
  return professors.filter((p) => ids.has(p.id)).sort((a, b) => compare(a.name, b.name))
}

// ---------------- planilha de ocupação ----------------

export type SheetCell = string | number | null
/** Formato de cada coluna na planilha: porcentagem, horas ou texto/número simples. */
export type ColumnFormat = 'pct' | 'hours' | 'plain'

export interface Sheet {
  header: string[]
  formats: ColumnFormat[]
  rows: SheetCell[][]
}

export interface OccupancySheets {
  summary: Sheet
  rooms: Sheet
  heatmap: Sheet
}

/** Linhas das três abas da planilha de ocupação ("Resumo", "Salas", "Mapa de calor"). */
export function occupancyRows(report: OccupancyReport, filterLabel: string): OccupancySheets {
  const { summary } = report
  return {
    summary: {
      header: ['Indicador', 'Valor'],
      formats: ['plain', 'plain'],
      rows: [
        ['Janela', windowText(report.window)],
        ['Prédio', filterLabel],
        ['Salas', summary.rooms],
        ['Salas usadas', summary.usedRooms],
        ['Salas ociosas', summary.idleRooms],
        ['Horas semanais ocupadas', summary.weeklyHoursUsed],
        ['Ocupação de horário', formatPct(summary.occupancy)],
        ['Aproveitamento de lugares', formatPct(summary.seatUsage)],
        ...report.byShift.map((s): SheetCell[] => [
          `Ocupação — ${SHIFT_LABELS[s.key].toLowerCase()} (${s.start}–${s.end})`,
          formatPct(s.occupancy),
        ]),
        ['Aulas semanais', summary.recurringEvents],
        ['Eventos únicos (fora dos percentuais)', summary.singleEvents],
        ['Aulas de turmas sem nº de alunos (fora do aproveitamento)', summary.unknownStudentEvents],
      ],
    },
    rooms: {
      header: [
        'Prédio', 'Sala', 'Capacidade', 'Situação', 'Horas semanais', 'Ocupação',
        'Manhã', 'Tarde', 'Noite', 'Aproveitamento de lugares', 'Aulas semanais', 'Eventos únicos',
      ],
      formats: ['plain', 'plain', 'plain', 'plain', 'hours', 'pct', 'pct', 'pct', 'pct', 'pct', 'plain', 'plain'],
      rows: report.rooms.map((r) => [
        r.buildingName,
        r.roomName,
        r.capacity,
        !r.active ? 'Inativa' : r.weeklyHours === 0 ? 'Ociosa' : 'Em uso',
        r.weeklyHours,
        r.occupancy,
        r.byShift.manha,
        r.byShift.tarde,
        r.byShift.noite,
        r.seatUsage,
        r.recurringEvents,
        r.singleEvents,
      ]),
    },
    heatmap: {
      header: ['Dia', ...report.heatmap.hours.map((h) => `${String(h).padStart(2, '0')}h`)],
      formats: ['plain', ...report.heatmap.hours.map((): ColumnFormat => 'plain')],
      rows: report.heatmap.days.map((d, i) => [dayLabel(d), ...report.heatmap.busyRooms[i]]),
    },
  }
}

// ---------------- cor do mapa de calor ----------------

/**
 * Intensidade 0..1 da célula (salas ocupadas ÷ máximo do mapa). Zero fica com o fundo neutro;
 * o restante começa em 0,15 para a menor ocupação não sumir contra a superfície.
 */
export function heatIntensity(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0
  return 0.15 + 0.85 * (value / max)
}
