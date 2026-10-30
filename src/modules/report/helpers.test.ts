import { describe, it, expect } from 'vitest'
import {
  formatHours,
  formatPct,
  heatIntensity,
  occupancyRows,
  professorSchedule,
  professorsWithTurmas,
  roomSchedule,
  roomSingleEvents,
  windowText,
} from './helpers'
import type { IAllocation, IProfessor, IRoom, ITurma, OccupancyReport } from '@/types'

function turma(id: string, extra: Partial<ITurma> = {}): ITurma {
  return {
    id,
    projectId: 'p',
    instituteId: 'i',
    name: `Turma ${id}`,
    code: id.toUpperCase(),
    category: 'graduacao',
    studentCount: 30,
    professor: 'Ana Ribeiro',
    professorId: 'ana',
    requiredFeatures: [],
    schedule: [{ day: 'mon', start: '08:00', end: '10:00' }],
    active: true,
    createdAt: '',
    updatedAt: '',
    ...extra,
  }
}
function event(partial: Partial<IAllocation>): IAllocation {
  return {
    id: Math.random().toString(36).slice(2),
    projectId: 'p',
    instituteId: 'i',
    roomId: 'r1',
    timeSlot: { day: 'mon', start: '08:00', end: '10:00' },
    type: 'weekly',
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}
const rooms = [
  { id: 'r1', name: 'Sala 101', buildingId: 'b1', active: true },
  { id: 'lab', name: 'Lab. de Redes', buildingId: 'b1', active: true },
] as IRoom[]

describe('formatação', () => {
  it('porcentagem, horas e janela', () => {
    expect(formatPct(0.224)).toBe('22%')
    expect(formatPct(null)).toBe('—')
    expect(formatHours(24)).toBe('24 h')
    expect(formatHours(3.5)).toBe('3,5 h')
    expect(windowText({ days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '07:00', end: '22:00', weeklyHours: 75 })).toBe(
      'Seg–Sex, 07:00–22:00 · 75 h por sala por semana',
    )
  })
})

describe('roomSchedule', () => {
  it('agrupa as aulas semanais da sala em faixas de horário, com papel e origem', () => {
    const turmas = [turma('a'), turma('b', { name: 'Redes', practice: { requiredFeatures: [] } })]
    const schedule = roomSchedule(
      'r1',
      [
        event({ turmaId: 'a', source: 'auto' }),
        event({ turmaId: 'b', role: 'pratica', timeSlot: { day: 'wed', start: '08:00', end: '10:00' } }),
        event({ turmaId: 'a', timeSlot: { day: 'tue', start: '14:00', end: '16:00' } }),
        event({ turmaId: 'a', roomId: 'lab' }), // outra sala
        event({ title: 'Palestra', type: 'single', date: '2026-11-03' }), // único não entra na grade
      ],
      turmas,
    )
    expect(schedule.days).toEqual(['mon', 'tue', 'wed', 'thu', 'fri'])
    expect(schedule.bands.map((b) => `${b.start}-${b.end}`)).toEqual(['08:00-10:00', '14:00-16:00'])
    expect(schedule.bands[0].cells.mon).toEqual([{ title: 'Turma a (A)', detail: 'Ana Ribeiro', auto: true }])
    expect(schedule.bands[0].cells.wed).toEqual([{ title: 'Redes (B)', detail: 'Ana Ribeiro', tag: 'Prática' }])
    expect(schedule.bands[1].cells.tue).toHaveLength(1)
  })

  it('mostra o sábado só quando há aula nele', () => {
    const schedule = roomSchedule('r1', [event({ turmaId: 'a', timeSlot: { day: 'sat', start: '08:00', end: '12:00' } })], [turma('a')])
    expect(schedule.days).toContain('sat')
  })
})

describe('roomSingleEvents', () => {
  it('lista os eventos únicos da sala em ordem de data, com título livre ou turma', () => {
    const items = roomSingleEvents(
      'r1',
      [
        event({ id: 'e2', type: 'single', date: '2026-11-10', title: 'Defesa' }),
        event({ id: 'e1', type: 'single', date: '2026-11-03', turmaId: 'a' }),
        event({ id: 'x', type: 'single', date: '2026-11-01', title: 'Outra sala', roomId: 'lab' }),
      ],
      [turma('a')],
    )
    expect(items.map((i) => [i.id, i.label])).toEqual([
      ['e1', 'Turma a (A)'],
      ['e2', 'Defesa'],
    ])
  })
})

describe('professorSchedule', () => {
  it('mostra a sala de cada horário das turmas do professor, ou "sem sala"', () => {
    const turmas = [
      turma('a', { schedule: [{ day: 'mon', start: '08:00', end: '10:00' }, { day: 'wed', start: '08:00', end: '10:00' }] }),
      turma('b', { professorId: 'outro' }),
      turma('c', { active: false }),
    ]
    const schedule = professorSchedule('ana', turmas, [event({ turmaId: 'a' })], rooms)
    expect(schedule.bands).toHaveLength(1)
    expect(schedule.bands[0].cells.mon).toEqual([{ title: 'Turma a (A)', detail: 'Sala 101' }])
    expect(schedule.bands[0].cells.wed).toEqual([{ title: 'Turma a (A)', detail: 'sem sala', missing: true }])
  })

  it('turma com aula prática mostra as duas salas e marca o papel que falta', () => {
    const t = turma('r', { practice: { requiredFeatures: [] } })
    const full = professorSchedule('ana', [t], [event({ turmaId: 'r' }), event({ turmaId: 'r', roomId: 'lab', role: 'pratica' })], rooms)
    expect(full.bands[0].cells.mon[0]).toEqual({ title: 'Turma r (R)', detail: 'T: Sala 101 · P: Lab. de Redes' })

    const partial = professorSchedule('ana', [t], [event({ turmaId: 'r' })], rooms)
    expect(partial.bands[0].cells.mon[0]).toEqual({ title: 'Turma r (R)', detail: 'T: Sala 101 · P: sem sala', missing: true })
  })

  it('evento que não cobre o horário inteiro não conta', () => {
    const schedule = professorSchedule(
      'ana',
      [turma('a')],
      [event({ turmaId: 'a', timeSlot: { day: 'mon', start: '08:00', end: '09:00' } })],
      rooms,
    )
    expect(schedule.bands[0].cells.mon[0].missing).toBe(true)
  })
})

describe('professorsWithTurmas', () => {
  it('só professores com turma ativa no projeto, em ordem alfabética', () => {
    const professors = [
      { id: 'diego', name: 'Diego Souza' },
      { id: 'ana', name: 'Ana Ribeiro' },
      { id: 'carla', name: 'Carla Dias' },
    ] as IProfessor[]
    const turmas = [turma('a'), turma('b', { professorId: 'diego' }), turma('c', { professorId: 'carla', active: false })]
    expect(professorsWithTurmas(professors, turmas).map((p) => p.id)).toEqual(['ana', 'diego'])
  })
})

describe('occupancyRows', () => {
  const report: OccupancyReport = {
    window: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '07:00', end: '22:00', weeklyHours: 75 },
    summary: {
      rooms: 2, usedRooms: 1, idleRooms: 1, weeklyHoursUsed: 24, occupancy: 0.16, seatUsage: 0.8,
      recurringEvents: 8, singleEvents: 1, unknownStudentEvents: 2,
    },
    byShift: [
      { key: 'manha', start: '07:00', end: '12:00', occupancy: 0.3 },
      { key: 'tarde', start: '12:00', end: '18:00', occupancy: 0.1 },
      { key: 'noite', start: '18:00', end: '22:00', occupancy: 0 },
    ],
    byBuilding: [],
    rooms: [
      {
        roomId: 'r1', roomName: 'Sala 101', buildingId: 'b1', buildingName: 'Bloco A', capacity: 40, active: true,
        weeklyHours: 24, occupancy: 0.32, byShift: { manha: 0.6, tarde: 0.2, noite: 0 }, seatUsage: 0.8,
        recurringEvents: 8, singleEvents: 1,
      },
      {
        roomId: 'r2', roomName: 'Sala 102', buildingId: 'b1', buildingName: 'Bloco A', capacity: 30, active: true,
        weeklyHours: 0, occupancy: 0, byShift: { manha: 0, tarde: 0, noite: 0 }, seatUsage: null,
        recurringEvents: 0, singleEvents: 0,
      },
    ],
    heatmap: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], hours: [7, 8], busyRooms: [[0, 1], [1, 1], [0, 0], [0, 0], [0, 0]] },
  }

  it('monta resumo, salas e mapa de calor', () => {
    const sheets = occupancyRows(report, 'Todos os prédios')
    expect(sheets.summary.rows).toContainEqual(['Ocupação de horário', '16%'])
    expect(sheets.summary.rows).toContainEqual(['Ocupação — manhã (07:00–12:00)', '30%'])
    expect(sheets.summary.rows).toContainEqual(['Prédio', 'Todos os prédios'])
    expect(sheets.rooms.rows[0]).toEqual(['Bloco A', 'Sala 101', 40, 'Em uso', 24, 0.32, 0.6, 0.2, 0, 0.8, 8, 1])
    expect(sheets.rooms.rows[1][3]).toBe('Ociosa')
    expect(sheets.rooms.header).toHaveLength(sheets.rooms.formats.length)
    expect(sheets.heatmap.header).toEqual(['Dia', '07h', '08h'])
    expect(sheets.heatmap.rows[1]).toEqual(['Terça', 1, 1])
  })
})

describe('heatIntensity', () => {
  it('zero é neutro; o resto vai de 0,15 a 1', () => {
    expect(heatIntensity(0, 10)).toBe(0)
    expect(heatIntensity(10, 10)).toBe(1)
    expect(heatIntensity(1, 10)).toBeCloseTo(0.235)
    expect(heatIntensity(3, 0)).toBe(0)
  })
})
