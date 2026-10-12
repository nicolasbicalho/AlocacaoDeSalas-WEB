import { describe, it, expect } from 'vitest'
import { summarizeTurmaRooms } from './helpers'
import type { IAllocation, ITurma } from '@/types'

function turma(id: string, schedule: ITurma['schedule']): ITurma {
  return {
    id,
    projectId: 'p',
    instituteId: 'i',
    name: `Turma ${id}`,
    code: id.toUpperCase(),
    category: 'graduacao',
    studentCount: null,
    professor: 'Prof',
    requiredFeatures: [],
    schedule,
    active: true,
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

describe('summarizeTurmaRooms', () => {
  const a = turma('a', [
    { day: 'wed', start: '08:00', end: '10:00' },
    { day: 'mon', start: '08:00', end: '10:00' },
  ])
  const b = turma('b', [{ day: 'tue', start: '14:00', end: '16:00' }])
  const semGrade = turma('c', [])

  it('conta horários cobertos, lista salas distintas na ordem da semana e aponta o primeiro pendente', () => {
    const allocs = [
      event({ turmaId: 'a', roomId: 'r2', timeSlot: { day: 'wed', start: '08:00', end: '10:00' } }),
      event({ turmaId: 'a', roomId: 'r1', timeSlot: { day: 'mon', start: '08:00', end: '10:00' } }),
      event({ turmaId: 'b', roomId: 'r3', timeSlot: { day: 'tue', start: '14:00', end: '15:00' } }), // curto: não cobre
      event({ turmaId: 'a', type: 'single', date: '2027-03-03', roomId: 'r9' }), // único não conta
    ]
    const s = summarizeTurmaRooms([a, b, semGrade], allocs)

    expect(s.get('a')).toEqual({ total: 2, covered: 2, roomIds: ['r1', 'r2'], firstPending: null })
    expect(s.get('b')).toMatchObject({ total: 1, covered: 0, roomIds: ['r3'] })
    expect(s.get('b')?.firstPending).toEqual({ day: 'tue', start: '14:00', end: '16:00' })
    expect(s.get('c')).toEqual({ total: 0, covered: 0, roomIds: [], firstPending: null })
  })

  it('primeiro pendente segue a ordem da semana, não a ordem de cadastro', () => {
    const s = summarizeTurmaRooms([a], [])
    expect(s.get('a')?.firstPending).toEqual({ day: 'mon', start: '08:00', end: '10:00' })
  })
})
