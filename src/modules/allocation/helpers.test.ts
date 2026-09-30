import { describe, it, expect } from 'vitest'
import {
  addDays,
  clampDate,
  eventClasses,
  eventsOnDate,
  firstSchoolDay,
  mondayOf,
  weekDates,
  weekdayFromDate,
} from './helpers'
import type { IAllocation } from '@/types'

// 2027-03-01 é segunda-feira
const semester = { startDate: '2027-03-01', endDate: '2027-07-10' }

function event(partial: Partial<IAllocation>): IAllocation {
  return {
    id: Math.random().toString(36).slice(2),
    projectId: 'p',
    instituteId: 'i',
    roomId: 'r',
    timeSlot: { day: 'mon', start: '08:00', end: '10:00' },
    type: 'weekly',
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('datas do cronograma', () => {
  it('addDays atravessa meses', () => {
    expect(addDays('2027-02-27', 2)).toBe('2027-03-01')
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28')
  })

  it('weekdayFromDate retorna o dia letivo e null no domingo', () => {
    expect(weekdayFromDate('2027-03-01')).toBe('mon')
    expect(weekdayFromDate('2027-03-06')).toBe('sat')
    expect(weekdayFromDate('2027-03-07')).toBeNull()
  })

  it('mondayOf: dias da semana voltam para a segunda; domingo avança para a próxima', () => {
    expect(mondayOf('2027-03-03')).toBe('2027-03-01')
    expect(mondayOf('2027-03-06')).toBe('2027-03-01')
    expect(mondayOf('2027-03-07')).toBe('2027-03-08')
  })

  it('weekDates devolve Seg–Sáb com datas reais', () => {
    const week = weekDates('2027-03-04')
    expect(week.map((d) => d.date)).toEqual([
      '2027-03-01',
      '2027-03-02',
      '2027-03-03',
      '2027-03-04',
      '2027-03-05',
      '2027-03-06',
    ])
    expect(week[0].day).toBe('mon')
  })

  it('clampDate e firstSchoolDay respeitam o semestre', () => {
    expect(clampDate('2027-01-10', semester.startDate, semester.endDate)).toBe('2027-03-01')
    expect(clampDate('2027-09-10', semester.startDate, semester.endDate)).toBe('2027-07-10')
    expect(firstSchoolDay('2027-03-07', semester.endDate)).toBe('2027-03-08') // domingo → segunda
  })
})

describe('eventsOnDate', () => {
  const weeklyMon = event({ type: 'weekly', timeSlot: { day: 'mon', start: '08:00', end: '10:00' } })
  const weeklyTue = event({ type: 'weekly', timeSlot: { day: 'tue', start: '08:00', end: '10:00' } })
  const singleMon = event({ type: 'single', date: '2027-03-08', timeSlot: { day: 'mon', start: '14:00', end: '16:00' } })
  const all = [weeklyMon, weeklyTue, singleMon]

  it('traz os recorrentes do dia da semana e os únicos da data', () => {
    expect(eventsOnDate(all, '2027-03-08', semester)).toEqual([weeklyMon, singleMon])
    expect(eventsOnDate(all, '2027-03-01', semester)).toEqual([weeklyMon])
    expect(eventsOnDate(all, '2027-03-02', semester)).toEqual([weeklyTue])
  })

  it('fora do semestre ou no domingo não há eventos', () => {
    expect(eventsOnDate(all, '2027-02-22', semester)).toEqual([])
    expect(eventsOnDate(all, '2027-03-07', semester)).toEqual([])
  })
})

describe('eventClasses', () => {
  it('recorrente usa a cor primária; único usa a cor escolhida (âmbar por padrão)', () => {
    expect(eventClasses({ type: 'weekly' }).swatch).toBe('bg-primary-500')
    expect(eventClasses({ type: 'single', color: 'violet' }).swatch).toBe('bg-violet-500')
    expect(eventClasses({ type: 'single' }).swatch).toBe('bg-amber-400')
  })
})
