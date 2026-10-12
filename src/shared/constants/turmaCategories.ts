import type { TurmaCategory } from '@/types'

/** Categorias da turma (mesma ordem e valores de `TURMA_CATEGORIES` na API). */
export const TURMA_CATEGORIES: { value: TurmaCategory; label: string; plural: string }[] = [
  { value: 'graduacao', label: 'Graduação', plural: 'Graduação' },
  { value: 'pos', label: 'Pós-graduação', plural: 'Pós-graduação' },
  { value: 'externa', label: 'Disciplina externa', plural: 'Externas' },
]

const LABELS = Object.fromEntries(TURMA_CATEGORIES.map((c) => [c.value, c.label])) as Record<
  TurmaCategory,
  string
>

export function categoryLabel(category: TurmaCategory | undefined): string {
  return LABELS[category ?? 'graduacao'] ?? category ?? ''
}

/** Selo da categoria (classes estáticas para o Tailwind). Mesmos tons usados no cronograma. */
const PILL: Record<TurmaCategory, string> = {
  graduacao: 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300',
  pos: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  externa: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

export function categoryPillClass(category: TurmaCategory | undefined): string {
  return PILL[category ?? 'graduacao']
}
