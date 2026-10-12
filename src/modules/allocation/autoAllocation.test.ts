import { describe, it, expect } from 'vitest'
import { winners, percent, unallocatedLink, METRIC_ROWS } from './autoAllocation'
import type { AutoMetrics, IProject } from '@/types'

const metrics = (over: Partial<AutoMetrics>): AutoMetrics => ({
  demands: 10,
  allocated: 8,
  unallocated: 2,
  skippedTurmas: 0,
  wastedSeats: 50,
  averageOccupancy: 0.7,
  preferencesMet: 3,
  preferencesTotal: 5,
  oversizedRooms: 1,
  ...over,
})

describe('comparação de estratégias', () => {
  it('destaca quem vence em cada métrica, na direção certa', () => {
    const by = { gerente: metrics({ allocated: 9, wastedSeats: 80 }), 'maiores-primeiro': metrics({ allocated: 8, wastedSeats: 40 }) }
    expect(winners(by, 'allocated', 'higher')).toEqual(['gerente'])
    expect(winners(by, 'wastedSeats', 'lower')).toEqual(['maiores-primeiro'])
  })

  it('empate não destaca ninguém', () => {
    const by = { gerente: metrics({}), 'maiores-primeiro': metrics({}) }
    expect(winners(by, 'oversizedRooms', 'lower')).toEqual([])
  })

  it('formata as métricas', () => {
    expect(percent(0.714)).toBe('71%')
    const allocated = METRIC_ROWS.find((r) => r.key === 'allocated')!
    expect(allocated.format!(metrics({}))).toBe('8 de 10')
  })
})

describe('unallocatedLink', () => {
  const project = { id: 'p1', startDate: '2026-08-03', endDate: '2026-12-12' } as IProject

  it('abre o cronograma com o modal preenchido, inclusive o papel', () => {
    const link = unallocatedLink(project, {
      turmaId: 't1',
      role: 'pratica',
      timeSlot: { day: 'tue', start: '14:00', end: '16:00' },
      reason: 'ALL_OCCUPIED',
    }) as { path: string; query: Record<string, string> }
    expect(link.path).toBe('/projects/p1/allocation')
    expect(link.query).toMatchObject({ turma: 't1', start: '14:00', end: '16:00', role: 'pratica' })
    expect(link.query.date).toMatch(/^2026-/)
  })

  it('turma pulada (sem horário) não tem atalho', () => {
    expect(unallocatedLink(project, { turmaId: 't1', reason: 'NO_STUDENT_COUNT' })).toBeNull()
  })
})
