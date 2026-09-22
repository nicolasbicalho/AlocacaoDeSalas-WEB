import type { WeekDay } from '@/types'

export const DAY_OPTIONS: { value: WeekDay; label: string; long: string }[] = [
  { value: 'mon', label: 'Seg', long: 'Segunda' },
  { value: 'tue', label: 'Ter', long: 'Terça' },
  { value: 'wed', label: 'Qua', long: 'Quarta' },
  { value: 'thu', label: 'Qui', long: 'Quinta' },
  { value: 'fri', label: 'Sex', long: 'Sexta' },
  { value: 'sat', label: 'Sáb', long: 'Sábado' },
]

const DAY_LONG: Record<WeekDay, string> = Object.fromEntries(
  DAY_OPTIONS.map((d) => [d.value, d.long]),
) as Record<WeekDay, string>

export function dayLabel(day: WeekDay): string {
  return DAY_LONG[day] ?? day
}

// getUTCDay: 0=Dom … 6=Sáb. Retorna null para domingo (não é dia letivo).
const WEEKDAY_BY_INDEX: Record<number, WeekDay | undefined> = {
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
}

export function weekdayFromDate(date: string): WeekDay | null {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return WEEKDAY_BY_INDEX[parsed.getUTCDay()] ?? null
}

export function formatDateBR(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}
