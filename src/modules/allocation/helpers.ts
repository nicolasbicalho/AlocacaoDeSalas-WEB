import type { EventColor, IAllocation, TurmaCategory, WeekDay } from '@/types'

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

// ---------------- datas (strings 'YYYY-MM-DD', sem fuso) ----------------

function parseUTC(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Data de hoje no fuso local do navegador. */
export function todayISO(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function addDays(date: string, days: number): string {
  const d = parseUTC(date)
  d.setUTCDate(d.getUTCDate() + days)
  return toISO(d)
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
  const parsed = parseUTC(date)
  if (Number.isNaN(parsed.getTime())) return null
  return WEEKDAY_BY_INDEX[parsed.getUTCDay()] ?? null
}

/** Segunda-feira da semana da data (domingo pertence à semana que começa no dia seguinte). */
export function mondayOf(date: string): string {
  const dow = parseUTC(date).getUTCDay()
  return addDays(date, dow === 0 ? 1 : 1 - dow)
}

/** As 6 datas letivas (Seg–Sáb) da semana que contém `date`. */
export function weekDates(date: string): { date: string; day: WeekDay; label: string }[] {
  const monday = mondayOf(date)
  return DAY_OPTIONS.map((d, i) => ({ date: addDays(monday, i), day: d.value, label: d.label }))
}

export function clampDate(date: string, min: string, max: string): string {
  if (date < min) return min
  if (date > max) return max
  return date
}

/** Primeiro dia letivo (Seg–Sáb) em [start, end], a partir de `date`. */
export function firstSchoolDay(date: string, end: string): string {
  let d = date
  while (d <= end && !weekdayFromDate(d)) d = addDays(d, 1)
  return d
}

export function formatDateBR(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export function formatDayMonth(date: string): string {
  const [, m, d] = date.split('-')
  return `${d}/${m}`
}

/** Eventos que acontecem numa data: recorrentes do dia da semana + únicos daquela data. */
export function eventsOnDate(
  allocations: IAllocation[],
  date: string,
  semester: { startDate: string; endDate: string },
): IAllocation[] {
  if (date < semester.startDate || date > semester.endDate) return []
  const day = weekdayFromDate(date)
  if (!day) return []
  return allocations.filter((a) =>
    a.type === 'weekly' ? a.timeSlot.day === day : a.date === date,
  )
}

// ---------------- cores dos eventos ----------------

export interface ColorClasses {
  /** bloco na grade */
  block: string
  /** texto secundário dentro do bloco */
  sub: string
  /** amostra no seletor / marcador na lista */
  swatch: string
}

// classes estáticas (o Tailwind precisa vê-las literalmente no código-fonte)
export const EVENT_COLORS: { value: EventColor; label: string; classes: ColorClasses }[] = [
  {
    value: 'amber',
    label: 'Âmbar',
    classes: {
      block: 'border-amber-500 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/60',
      sub: 'text-amber-800/80 dark:text-amber-200/80',
      swatch: 'bg-amber-400',
    },
  },
  {
    value: 'emerald',
    label: 'Esmeralda',
    classes: {
      block: 'border-emerald-500 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:hover:bg-emerald-900/60',
      sub: 'text-emerald-800/80 dark:text-emerald-200/80',
      swatch: 'bg-emerald-500',
    },
  },
  {
    value: 'rose',
    label: 'Rosa',
    classes: {
      block: 'border-rose-500 bg-rose-100 text-rose-900 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-100 dark:hover:bg-rose-900/60',
      sub: 'text-rose-800/80 dark:text-rose-200/80',
      swatch: 'bg-rose-500',
    },
  },
  {
    value: 'violet',
    label: 'Violeta',
    classes: {
      block: 'border-violet-500 bg-violet-100 text-violet-900 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-100 dark:hover:bg-violet-900/60',
      sub: 'text-violet-800/80 dark:text-violet-200/80',
      swatch: 'bg-violet-500',
    },
  },
  {
    value: 'sky',
    label: 'Céu',
    classes: {
      block: 'border-sky-500 bg-sky-100 text-sky-900 hover:bg-sky-200 dark:bg-sky-900/40 dark:text-sky-100 dark:hover:bg-sky-900/60',
      sub: 'text-sky-800/80 dark:text-sky-200/80',
      swatch: 'bg-sky-500',
    },
  },
  {
    value: 'orange',
    label: 'Laranja',
    classes: {
      block: 'border-orange-500 bg-orange-100 text-orange-900 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-100 dark:hover:bg-orange-900/60',
      sub: 'text-orange-800/80 dark:text-orange-200/80',
      swatch: 'bg-orange-500',
    },
  },
]

export const DEFAULT_EVENT_COLOR: EventColor = 'amber'

// eventos recorrentes usam o tom da categoria da turma (graduação = cor primária do sistema)
const CATEGORY_CLASSES: Record<TurmaCategory, ColorClasses> = {
  graduacao: {
    block: 'border-primary-500 bg-primary-100/80 text-primary-900 hover:bg-primary-200/80 dark:bg-primary-900/40 dark:text-primary-100 dark:hover:bg-primary-900/60',
    sub: 'text-primary-700/90 dark:text-primary-300/80',
    swatch: 'bg-primary-500',
  },
  pos: {
    block: 'border-teal-500 bg-teal-100/80 text-teal-900 hover:bg-teal-200/80 dark:bg-teal-900/40 dark:text-teal-100 dark:hover:bg-teal-900/60',
    sub: 'text-teal-700/90 dark:text-teal-300/80',
    swatch: 'bg-teal-500',
  },
  externa: {
    block: 'border-slate-500 bg-slate-200/80 text-slate-900 hover:bg-slate-300/80 dark:bg-slate-700/50 dark:text-slate-100 dark:hover:bg-slate-700/70',
    sub: 'text-slate-600 dark:text-slate-300/80',
    swatch: 'bg-slate-500',
  },
}

export function categoryClasses(category: TurmaCategory | undefined): ColorClasses {
  return CATEGORY_CLASSES[category ?? 'graduacao']
}

const COLOR_BY_VALUE = Object.fromEntries(EVENT_COLORS.map((c) => [c.value, c.classes])) as Record<
  EventColor,
  ColorClasses
>

/** Recorrente: tom da categoria da turma. Único: a cor escolhida no cadastro. */
export function eventClasses(
  a: Pick<IAllocation, 'type' | 'color'>,
  category?: TurmaCategory,
): ColorClasses {
  if (a.type === 'weekly') return categoryClasses(category)
  return COLOR_BY_VALUE[a.color ?? DEFAULT_EVENT_COLOR] ?? COLOR_BY_VALUE[DEFAULT_EVENT_COLOR]
}
