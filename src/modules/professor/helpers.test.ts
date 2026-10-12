import { describe, it, expect } from 'vitest'
import { preferenceItems, parseFloors, formatFloors, nameKey } from './helpers'

describe('preferenceItems', () => {
  it('descreve as preferências informadas', () => {
    expect(preferenceItems({ floors: [0, 1], minBoards: 2, avoidCorridorEnd: true })).toEqual([
      'Térreo ou 1º andar',
      '≥ 2 quadros',
      'evita extremidade do corredor',
    ])
  })

  it('sem preferências → lista vazia', () => {
    expect(preferenceItems({})).toEqual([])
    expect(preferenceItems(null)).toEqual([])
    expect(preferenceItems({ minBoards: 1 })).toEqual(['≥ 1 quadro'])
  })
})

describe('parseFloors / formatFloors', () => {
  it('aceita vírgula ou espaço, ordena e remove repetidos', () => {
    expect(parseFloors('2, 0 1, 2')).toEqual([0, 1, 2])
    expect(parseFloors('')).toEqual([])
    expect(parseFloors('-1')).toEqual([-1])
  })

  it('rejeita texto e andares fora do intervalo', () => {
    expect(parseFloors('térreo')).toBeNull()
    expect(parseFloors('1.5')).toBeNull()
    expect(parseFloors('101')).toBeNull()
  })

  it('formata para o campo de texto', () => {
    expect(formatFloors([0, 1])).toBe('0, 1')
    expect(formatFloors(undefined)).toBe('')
  })
})

describe('nameKey', () => {
  it('ignora acentos, maiúsculas e espaços extras', () => {
    expect(nameKey('  Dra.  Sílvia ')).toBe(nameKey('dra. silvia'))
  })
})
