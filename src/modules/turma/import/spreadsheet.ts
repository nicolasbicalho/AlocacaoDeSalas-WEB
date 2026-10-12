/**
 * Leitura da planilha de turmas no navegador (fase 4): XLSX pela exceljs (carregada só aqui)
 * e CSV por um leitor próprio. O resultado é texto puro, linha a linha, com o número da
 * linha no arquivo — a API recebe as células como texto e faz a interpretação.
 */

export interface SheetRow {
  /** número da linha no arquivo (1 = primeira), usado nas mensagens da prévia */
  line: number
  cells: string[]
}

export interface Sheet {
  name: string
  rows: SheetRow[]
}

/** Lê CSV com aspas ("a;""b""") e detecta o separador: ; (Excel em português), vírgula ou tab. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? ''
  const count = (ch: string) => firstLine.split(ch).length - 1
  const delimiter = [';', ',', '\t'].sort((a, b) => count(b) - count(a))[0]

  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === delimiter) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += ch
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

/** CSV salvo pelo Excel costuma vir em Windows-1252; UTF-8 inválido denuncia isso. */
function decodeCsv(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8').decode(buffer)
  return utf8.includes('�') ? new TextDecoder('windows-1252').decode(buffer) : utf8
}

function toRows(matrix: string[][]): SheetRow[] {
  return matrix.map((cells, i) => ({ line: i + 1, cells: cells.map((c) => c.trim()) }))
}

export class UnsupportedFileError extends Error {}

export async function readSpreadsheet(file: File): Promise<Sheet[]> {
  const name = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    return [{ name: file.name, rows: toRows(parseCsv(decodeCsv(buffer))) }]
  }
  if (!name.endsWith('.xlsx')) {
    throw new UnsupportedFileError('Use um arquivo .xlsx ou .csv (no Excel: Salvar como → Pasta de Trabalho do Excel).')
  }

  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  return workbook.worksheets.map((ws) => {
    const rows: SheetRow[] = []
    for (let r = 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r)
      const cells: string[] = []
      for (let c = 1; c <= ws.columnCount; c++) cells.push((row.getCell(c).text ?? '').trim())
      rows.push({ line: r, cells })
    }
    return { name: ws.name, rows }
  })
}
