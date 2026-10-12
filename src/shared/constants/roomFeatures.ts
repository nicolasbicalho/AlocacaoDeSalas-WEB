import type { RoomFeature } from '@/types'

/**
 * Catálogo fixo de características (mesma ordem e valores de `ROOM_FEATURES` na API).
 * Projetor e ar-condicionado saíram: segundo o gerente, todas as salas têm.
 */
export const ROOM_FEATURES: { value: RoomFeature; label: string }[] = [
  { value: 'acessibilidade', label: 'Acessibilidade (PcD)' },
  { value: 'camera', label: 'Câmera (transmissão)' },
  { value: 'computadores', label: 'Computadores (lab. de informática)' },
  { value: 'bancadas', label: 'Bancadas (lab. experimental)' },
  { value: 'som', label: 'Sistema de som' },
]

const LABELS = Object.fromEntries(ROOM_FEATURES.map((f) => [f.value, f.label])) as Record<
  RoomFeature,
  string
>

export function featureLabel(feature: RoomFeature): string {
  return LABELS[feature] ?? feature
}

/** "Térreo", "1º andar", "Subsolo 1"… */
export function floorLabel(floor: number): string {
  if (floor === 0) return 'Térreo'
  if (floor < 0) return `Subsolo ${-floor}`
  return `${floor}º andar`
}
