import { describe, it, expect } from 'vitest'
import { summarizeTurmaRooms } from './helpers'
import type { IAllocation, ITurma } from '@/types'

function turma(id: string, schedule: ITurma['schedule'], extra: Partial<ITurma> = {}): ITurma {
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

    expect(s.get('a')).toEqual({
      total: 2,
      roles: [{ role: 'teorica', covered: 2, roomIds: ['r1', 'r2'] }],
      complete: true,
      firstPending: null,
    })
    expect(s.get('b')).toMatchObject({ total: 1, complete: false, roles: [{ covered: 0, roomIds: ['r3'] }] })
    expect(s.get('b')?.firstPending).toEqual({ slot: { day: 'tue', start: '14:00', end: '16:00' }, role: 'teorica' })
    expect(s.get('c')).toMatchObject({ total: 0, complete: true, firstPending: null })
  })

  it('primeiro pendente segue a ordem da semana, não a ordem de cadastro', () => {
    const s = summarizeTurmaRooms([a], [])
    expect(s.get('a')?.firstPending?.slot).toEqual({ day: 'mon', start: '08:00', end: '10:00' })
  })

  it('turma com aula prática precisa da teórica e da prática em cada horário', () => {
    const p = turma('p', [{ day: 'mon', start: '14:00', end: '16:00' }], { practice: { requiredFeatures: ['computadores'] } })
    const onlyPractice = summarizeTurmaRooms([p], [event({ turmaId: 'p', roomId: 'lab', role: 'pratica', timeSlot: { day: 'mon', start: '14:00', end: '16:00' } })])
    expect(onlyPractice.get('p')).toEqual({
      total: 1,
      roles: [
        { role: 'teorica', covered: 0, roomIds: [] },
        { role: 'pratica', covered: 1, roomIds: ['lab'] },
      ],
      complete: false,
      firstPending: { slot: { day: 'mon', start: '14:00', end: '16:00' }, role: 'teorica' },
    })

    const both = summarizeTurmaRooms(
      [p],
      [
        event({ turmaId: 'p', roomId: 'lab', role: 'pratica', timeSlot: { day: 'mon', start: '14:00', end: '16:00' } }),
        event({ turmaId: 'p', roomId: 's101', role: 'teorica', timeSlot: { day: 'mon', start: '14:00', end: '16:00' } }),
      ],
    )
    expect(both.get('p')?.complete).toBe(true)
  })

  it('evento sem papel (anterior à fase 3) conta como teórico', () => {
    const p = turma('p', [{ day: 'mon', start: '14:00', end: '16:00' }], { practice: { requiredFeatures: [] } })
    const s = summarizeTurmaRooms([p], [event({ turmaId: 'p', timeSlot: { day: 'mon', start: '14:00', end: '16:00' } })])
    expect(s.get('p')?.firstPending?.role).toBe('pratica')
  })
})
