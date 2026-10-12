import { describe, it, expect } from 'vitest'
import { parseCsv } from './spreadsheet'
import { guessMapping, detectHeaderRow, buildImportRows, columnLetter, normalizeHeader } from './mapping'

describe('parseCsv', () => {
  it('detecta ponto e vírgula (Excel em português) e respeita aspas', () => {
    const text = '﻿Nome;Código;Anotações\r\nCálculo I;MAT101;"prefere térreo; quadro grande"\r\n"Física ""Geral""";FIS110;\r\n'
    expect(parseCsv(text)).toEqual([
      ['Nome', 'Código', 'Anotações'],
      ['Cálculo I', 'MAT101', 'prefere térreo; quadro grande'],
      ['Física "Geral"', 'FIS110', ''],
    ])
  })

  it('aceita vírgula e quebra de linha dentro de aspas', () => {
    expect(parseCsv('a,b\n"linha 1\nlinha 2",x')).toEqual([
      ['a', 'b'],
      ['linha 1\nlinha 2', 'x'],
    ])
  })
})

describe('mapeamento de colunas', () => {
  const headers = ['Nome da disciplina', 'Código da turma', 'Dia da semana e horário', 'Setor', 'Professor', 'Anotações']

  it('reconhece as colunas da planilha do gerente', () => {
    expect(guessMapping(headers)).toEqual({
      name: 0,
      code: 1,
      schedule: 2,
      sector: 3,
      professor: 4,
      notes: 5,
      studentCount: null,
      category: null,
    })
  })

  it('reconhece variações e não usa a mesma coluna duas vezes', () => {
    const m = guessMapping(['Disciplina', 'Turma', 'Horário', 'Departamento', 'Docente', 'Obs.', 'Nº de alunos', 'Nível'])
    expect(m).toEqual({ name: 0, code: 1, schedule: 2, sector: 3, professor: 4, notes: 5, studentCount: 6, category: 7 })
  })

  it('normaliza títulos', () => {
    expect(normalizeHeader('  Nº de Alunos ')).toBe('n de alunos')
  })

  it('acha a linha de títulos abaixo de um título de planilha', () => {
    const rows = [
      { line: 1, cells: ['Oferta 2027.1 — Instituto de Ciências', '', ''] },
      { line: 2, cells: ['', '', ''] },
      { line: 3, cells: ['Disciplina', 'Código', 'Professor'] },
      { line: 4, cells: ['Cálculo I', 'MAT101', 'Ana'] },
    ]
    expect(detectHeaderRow(rows)).toBe(2)
  })

  it('monta as linhas de importação com o número da linha e pula as vazias', () => {
    const rows = [
      { line: 1, cells: headers },
      { line: 2, cells: ['Cálculo I', 'MAT101', 'SEG 08-10', 'DMAT', 'Ana', ''] },
      { line: 3, cells: ['', '', '', '', '', ''] },
      { line: 4, cells: ['Física', 'FIS110', '', '', 'Diego', 'obs'] },
    ]
    const result = buildImportRows(rows, 0, guessMapping(headers))
    expect(result.map((r) => r.line)).toEqual([2, 4])
    expect(result[0]).toEqual({ line: 2, name: 'Cálculo I', code: 'MAT101', schedule: 'SEG 08-10', sector: 'DMAT', professor: 'Ana', notes: '' })
  })

  it('letras de coluna como no Excel', () => {
    expect([0, 25, 26, 27].map(columnLetter)).toEqual(['A', 'Z', 'AA', 'AB'])
  })
})
