import type { RoomFeature } from '@/types'

/** Catálogo fixo de características (mesma ordem e valores de `ROOM_FEATURES` na API). */
export const ROOM_FEATURES: { value: RoomFeature; label: string }[] = [
  { value: 'projetor', label: 'Projetor' },
  { value: 'ar_condicionado', label: 'Ar-condicionado' },
  { value: 'acessibilidade', label: 'Acessibilidade (PcD)' },
  { value: 'computadores', label: 'Computadores (lab. de informática)' },
  { value: 'som', label: 'Sistema de som' },
  { value: 'bancadas', label: 'Bancadas (lab. experimental)' },
]

const LABELS = Object.fromEntries(ROOM_FEATURES.map((f) => [f.value, f.label])) as Record<
  RoomFeature,
  string
>

export function featureLabel(feature: RoomFeature): string {
  return LABELS[feature] ?? feature
}
