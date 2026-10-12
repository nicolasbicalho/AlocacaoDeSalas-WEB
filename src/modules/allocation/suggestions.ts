import { featureLabel, floorLabel } from '@/shared/constants/roomFeatures'
import type { PreferenceKey, PreferenceStatus, RoomSuggestion } from '@/types'

export type Tone = 'ok' | 'bad' | 'unknown'

export interface Badge {
  text: string
  tone: Tone
}

const TONE: Record<PreferenceStatus, Tone> = { met: 'ok', unmet: 'bad', unknown: 'unknown' }

/** Selo de uma preferência do professor contra a sala ("✓ 1º andar", "✗ na extremidade"…). */
export function preferenceBadge(
  check: { key: PreferenceKey; status: PreferenceStatus },
  room: Pick<RoomSuggestion, 'floor' | 'boardCount' | 'corridorEnd'>,
): Badge {
  const tone = TONE[check.status]
  if (check.status === 'unknown') {
    const missing: Record<PreferenceKey, string> = {
      minBoards: 'quadros não informados',
      floors: 'andar não informado',
      avoidCorridorEnd: 'extremidade não informada',
    }
    return { text: `? ${missing[check.key]}`, tone }
  }
  const mark = check.status === 'met' ? '✓' : '✗'
  switch (check.key) {
    case 'minBoards':
      return { text: `${mark} ${room.boardCount} ${room.boardCount === 1 ? 'quadro' : 'quadros'}`, tone }
    case 'floors':
      return { text: `${mark} ${floorLabel(room.floor!)}`, tone }
    case 'avoidCorridorEnd':
      return { text: check.status === 'met' ? '✓ fora da extremidade' : '✗ na extremidade', tone }
  }
}

/** Capacidade em relação à turma inteira (D9): "50 lugares · sobram 5". */
export function capacityText(s: Pick<RoomSuggestion, 'capacity' | 'slack' | 'capacityStatus'>): string {
  if (s.capacityStatus === 'unknown' || s.slack === null) return `${s.capacity} lugares`
  if (s.slack < 0) return `${s.capacity} lugares · faltam ${-s.slack}`
  return s.slack === 0 ? `${s.capacity} lugares · exata` : `${s.capacity} lugares · sobram ${s.slack}`
}

/** Avisos para a sala escolhida no modal (a alocação manual permite, mas o gerente precisa saber). */
export function roomWarnings(s: RoomSuggestion, studentCount: number | null): string[] {
  const warnings: string[] = []
  if (!s.available) warnings.push('A sala está ocupada nesse horário — o salvamento será recusado.')
  if (s.capacityStatus === 'insufficient' && studentCount !== null) {
    warnings.push(`A sala comporta ${s.capacity} pessoas e a turma tem ${studentCount} alunos.`)
  }
  if (s.missingFeatures.length) {
    warnings.push(`A sala não tem: ${s.missingFeatures.map(featureLabel).join(', ')}.`)
  }
  return warnings
}
