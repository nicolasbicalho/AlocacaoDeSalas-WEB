import { describe, it, expect } from 'vitest'
import { preferenceBadge, capacityText, roomWarnings } from './suggestions'
import type { RoomSuggestion } from '@/types'

const suggestion = (over: Partial<RoomSuggestion> = {}): RoomSuggestion => ({
  roomId: 'r1',
  name: 'Sala 101',
  code: '101',
  buildingId: 'b1',
  capacity: 40,
  features: [],
  available: true,
  fits: true,
  capacityStatus: 'ok',
  slack: 5,
  missingFeatures: [],
  preferences: [],
  ...over,
})

describe('preferenceBadge', () => {
  const room = { floor: 1, boardCount: 1, corridorEnd: true }

  it('descreve preferências atendidas e não atendidas com o dado da sala', () => {
    expect(preferenceBadge({ key: 'floors', status: 'met' }, room)).toEqual({ text: '✓ 1º andar', tone: 'ok' })
    expect(preferenceBadge({ key: 'minBoards', status: 'unmet' }, room)).toEqual({ text: '✗ 1 quadro', tone: 'bad' })
    expect(preferenceBadge({ key: 'avoidCorridorEnd', status: 'unmet' }, room)).toEqual({
      text: '✗ na extremidade',
      tone: 'bad',
    })
  })

  it('preferência sem o dado da sala fica "desconhecida"', () => {
    expect(preferenceBadge({ key: 'floors', status: 'unknown' }, {})).toEqual({
      text: '? andar não informado',
      tone: 'unknown',
    })
  })
})

describe('capacityText', () => {
  it('mostra sobra, falta ou só a capacidade', () => {
    expect(capacityText({ capacity: 50, slack: 5, capacityStatus: 'ok' })).toBe('50 lugares · sobram 5')
    expect(capacityText({ capacity: 40, slack: -5, capacityStatus: 'insufficient' })).toBe('40 lugares · faltam 5')
    expect(capacityText({ capacity: 40, slack: null, capacityStatus: 'unknown' })).toBe('40 lugares')
  })
})

describe('roomWarnings', () => {
  it('sala adequada não gera aviso', () => {
    expect(roomWarnings(suggestion(), 35)).toEqual([])
  })

  it('avisa ocupação, capacidade e características faltando', () => {
    const warnings = roomWarnings(
      suggestion({ available: false, capacityStatus: 'insufficient', slack: -5, missingFeatures: ['camera'] }),
      45,
    )
    expect(warnings).toHaveLength(3)
    expect(warnings[1]).toBe('A sala comporta 40 pessoas e a turma tem 45 alunos.')
    expect(warnings[2]).toBe('A sala não tem: Câmera (transmissão).')
  })
})
