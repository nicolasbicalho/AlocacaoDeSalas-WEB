import { describe, it, expect } from 'vitest'
import {
  coverage,
  idleRooms,
  nextDateForWeekday,
  referenceDate,
  semesterProgress,
  timeAgo,
  upcomingSingles,
} from './helpers'
import type { IAllocation, IRoom, ITurma } from '@/types'

// 2027-03-01 é segunda-feira
const START = '2027-03-01'
const END = '2027-07-10'

function turma(id: string, schedule: ITurma['schedule'], active = true): ITurma {
  return {
    id,
    projectId: 'p',
    instituteId: 'i',
    name: `Turma ${id}`,
    category: 'graduacao',
    studentCount: 30,
    professor: 'Prof',
    requiredFeatures: [],
    schedule,
    active,
    createdAt: '',
    updatedAt: '',
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

describe('semesterProgress', () => {
  it('antes do início: dias até começar', () => {
    expect(semesterProgress(START, END, '2027-02-19')).toEqual({ phase: 'before', daysToStart: 10 })
  })
  it('durante: semana corrente e percentual', () => {
    const p = semesterProgress(START, END, '2027-03-10')
    expect(p).toMatchObject({ phase: 'running', week: 2, totalWeeks: 19 })
  })
  it('depois do fim', () => {
    expect(semesterProgress(START, END, '2027-07-12')).toEqual({ phase: 'after', daysSinceEnd: 2 })
  })
})

describe('coverage', () => {
  const a = turma('a', [
    { day: 'mon', start: '08:00', end: '10:00' },
    { day: 'wed', start: '08:00', end: '10:00' },
  ])
  const b = turma('b', [{ day: 'tue', start: '14:00', end: '16:00' }])
  const semGrade = turma('c', [])
  const inativa = turma('d', [{ day: 'fri', start: '08:00', end: '10:00' }], false)

  it('conta horários cobertos por evento recorrente da própria turma', () => {
    const allocs = [
      event({ turmaId: 'a', timeSlot: { day: 'mon', start: '08:00', end: '10:00' } }),
      // evento curto demais: não cobre o horário inteiro
      event({ turmaId: 'b', timeSlot: { day: 'tue', start: '14:00', end: '15:00' } }),
      // evento único não conta como alocação da grade
      event({ turmaId: 'a', type: 'single', date: '2027-03-03', timeSlot: { day: 'wed', start: '08:00', end: '10:00' } }),
    ]
    const c = coverage([a, b, semGrade, inativa], allocs)
    expect(c.total).toBe(3)
    expect(c.covered).toBe(1)
    expect(c.pending.map((p) => `${p.turma.id}:${p.slot.day}`)).toEqual(['b:tue', 'a:wed'])
    expect(c.withoutSchedule.map((t) => t.id)).toEqual(['c'])
  })

  it('turma com aula prática conta a sala teórica e a de prática de cada horário', () => {
    const p = { ...turma('p', [{ day: 'mon', start: '14:00', end: '16:00' }]), practice: { requiredFeatures: [] } }
    const c = coverage([p], [event({ turmaId: 'p', role: 'pratica', timeSlot: { day: 'mon', start: '14:00', end: '16:00' } })])
    expect(c.total).toBe(2)
    expect(c.covered).toBe(1)
    expect(c.pending.map((x) => x.role)).toEqual(['teorica'])
  })

  it('evento que abrange o horário (mais longo) também cobre', () => {
    const c = coverage([b], [event({ turmaId: 'b', timeSlot: { day: 'tue', start: '13:00', end: '17:00' } })])
    expect(c.covered).toBe(1)
  })
})

describe('idleRooms', () => {
  it('salas ativas sem evento recorrente', () => {
    const rooms = [{ id: 'r1', active: true }, { id: 'r2', active: true }, { id: 'r3', active: false }] as IRoom[]
    expect(idleRooms(rooms, [event({ roomId: 'r1' })]).map((r) => r.id)).toEqual(['r2'])
  })
})

describe('datas de referência', () => {
  it('referenceDate prende hoje ao semestre', () => {
    expect(referenceDate(START, END, '2026-09-29')).toBe(START)
    expect(referenceDate(START, END, '2027-04-01')).toBe('2027-04-01')
  })
  it('nextDateForWeekday acha a próxima data do dia da semana', () => {
    expect(nextDateForWeekday('2027-03-01', 'wed', END)).toBe('2027-03-03')
    expect(nextDateForWeekday('2027-03-04', 'mon', END)).toBe('2027-03-08')
    expect(nextDateForWeekday('2027-07-09', 'mon', END)).toBeNull()
  })
  it('upcomingSingles: só únicos a partir da data, em ordem', () => {
    const x = event({ type: 'single', date: '2027-03-25', timeSlot: { day: 'thu', start: '14:00', end: '16:00' } })
    const y = event({ type: 'single', date: '2027-03-24', timeSlot: { day: 'wed', start: '14:00', end: '16:00' } })
    const past = event({ type: 'single', date: '2027-03-02', timeSlot: { day: 'tue', start: '14:00', end: '16:00' } })
    expect(upcomingSingles([x, event({}), past, y], '2027-03-10')).toEqual([y, x])
  })
})

describe('timeAgo', () => {
  it('formata em português', () => {
    const now = new Date('2027-03-01T12:00:00Z')
    expect(timeAgo('2027-03-01T11:55:00Z', now)).toBe('há 5 minutos')
    expect(timeAgo('2027-02-28T12:00:00Z', now)).toBe('ontem')
  })
})
