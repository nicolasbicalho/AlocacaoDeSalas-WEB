import { describe, it, expect } from 'vitest'
import { buildTimetable } from './timetable'
import type { IAllocation, IBuilding, IRoom, ITurma } from '@/types'

function turma(id: string, extra: Partial<ITurma> = {}): ITurma {
  return {
    id,
    projectId: 'p',
    instituteId: 'i',
    name: `Turma ${id}`,
    code: id.toUpperCase(),
    category: 'graduacao',
    studentCount: 30,
    professor: 'Prof',
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
  { id: 'lab', name: 'Lab. de Redes', buildingId: 'b2', active: true },
] as IRoom[]
const buildings = [
  { id: 'b1', name: 'Pavilhão' },
  { id: 'b2', name: 'Laboratórios' },
] as IBuilding[]

describe('buildTimetable', () => {
  const a = turma('a', { name: 'Cálculo I', code: 'MAT101' })
  const p = turma('p', {
    name: 'Redes',
    code: 'CMP305',
    category: 'pos',
    practice: { requiredFeatures: ['computadores'] },
    schedule: [{ day: 'mon', start: '08:00', end: '10:00' }, { day: 'wed', start: '14:00', end: '16:00' }],
  })
  const semGrade = turma('s', { name: 'Seminário', schedule: [] })
  const inativa = turma('x', { name: 'Antiga', active: false })
  const allocs = [
    event({ turmaId: 'a', roomId: 'r1' }),
    event({ turmaId: 'p', roomId: 'lab', role: 'pratica' }),
    event({ turmaId: 'x', roomId: 'r1', timeSlot: { day: 'tue', start: '08:00', end: '10:00' } }),
  ]
  const tt = buildTimetable([p, a, semGrade, inativa], allocs, rooms, buildings)

  it('agrupa por faixa de horário e dia, com salas e professor', () => {
    expect(tt.bands.map((b) => `${b.start}-${b.end}`)).toEqual(['08:00-10:00', '14:00-16:00'])
    expect(tt.bands[0].cells.mon).toEqual([
      'Cálculo I (MAT101) · Sala 101 · Prof',
      'Redes (CMP305) [Pós-graduação] · T: sem sala · P: Lab. de Redes · Prof',
    ])
    expect(tt.bands[1].cells.wed).toEqual(['Redes (CMP305) [Pós-graduação] · T: sem sala · P: sem sala · Prof'])
  })

  it('lista uma linha por horário, com a situação, e as turmas sem horário no fim; ignora inativas', () => {
    expect(tt.rows.map((r) => `${r.day ?? '-'} ${r.code} ${r.status}`)).toEqual([
      'mon MAT101 com sala',
      'mon CMP305 falta teórica',
      'wed CMP305 sem sala',
      '- S sem horário',
    ])
  })

  it('ocupação por sala só com aulas recorrentes de turmas ativas', () => {
    expect(tt.rooms.map((r) => r.label)).toEqual(['Laboratórios · Lab. de Redes', 'Pavilhão · Sala 101'])
    expect(tt.rooms[0].cells.mon).toEqual(['08:00–10:00 Redes (CMP305) [Prática]'])
    expect(tt.rooms[1].cells.tue).toEqual([])
  })
})
