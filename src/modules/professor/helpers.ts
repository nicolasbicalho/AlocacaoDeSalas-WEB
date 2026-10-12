import { floorLabel } from '@/shared/constants/roomFeatures'
import type { ProfessorPreferences } from '@/types'

/** Preferências em frases curtas, para pílulas e dicas ("Térreo ou 1º andar", "≥ 2 quadros"…). */
export function preferenceItems(prefs?: ProfessorPreferences | null): string[] {
  if (!prefs) return []
  const items: string[] = []
  if (prefs.floors?.length) items.push(prefs.floors.map(floorLabel).join(' ou '))
  if (prefs.minBoards) items.push(`≥ ${prefs.minBoards} ${prefs.minBoards === 1 ? 'quadro' : 'quadros'}`)
  if (prefs.avoidCorridorEnd) items.push('evita extremidade do corredor')
  return items
}

/** "0, 1" → [0, 1] (ordenado, sem repetição); vazio → []; texto inválido → null. */
export function parseFloors(text: string): number[] | null {
  const parts = text
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const floors: number[] = []
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) return null
    const n = Number(part)
    if (n < -5 || n > 100) return null
    if (!floors.includes(n)) floors.push(n)
  }
  return floors.sort((a, b) => a - b)
}

export function formatFloors(floors?: number[]): string {
  return (floors ?? []).join(', ')
}

/** Compara nomes como a API (collation pt, strength 1): sem acentos e sem maiúsculas. */
export function nameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}
