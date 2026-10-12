import type { SheetRow } from './spreadsheet'

/** Campos que a importação entende — as colunas da planilha que o gerente recebe, mais duas opcionais. */
export type ImportField = 'name' | 'code' | 'schedule' | 'sector' | 'professor' | 'notes' | 'studentCount' | 'category'

export const IMPORT_FIELDS: { key: ImportField; label: string; required: boolean; hints: string[] }[] = [
  { key: 'name', label: 'Nome da disciplina', required: true, hints: ['nome da disciplina', 'disciplina', 'nome'] },
  { key: 'code', label: 'Código da turma', required: true, hints: ['codigo da turma', 'codigo', 'cod', 'turma'] },
  { key: 'schedule', label: 'Dia da semana e horário', required: false, hints: ['dia da semana e horario', 'horario', 'dia', 'horarios'] },
  { key: 'sector', label: 'Setor (departamento)', required: false, hints: ['setor', 'departamento', 'depto'] },
  { key: 'professor', label: 'Professor', required: true, hints: ['professor', 'docente', 'prof'] },
  { key: 'notes', label: 'Anotações', required: false, hints: ['anotacoes', 'anotacao', 'observacoes', 'observacao', 'obs'] },
  { key: 'studentCount', label: 'Nº de alunos', required: false, hints: ['n de alunos', 'numero de alunos', 'alunos', 'vagas', 'matriculados'] },
  { key: 'category', label: 'Categoria', required: false, hints: ['categoria', 'nivel', 'tipo'] },
]

export type ColumnMapping = Record<ImportField, number | null>

/** Sem acentos, minúsculo, só letras/números/espaços ("Nº de alunos" → "n de alunos"). */
export function normalizeHeader(text: string): string {
  return text
    .replace(/[ºª°]/g, '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function score(header: string, hints: string[]): number {
  const h = normalizeHeader(header)
  if (!h) return 0
  // o primeiro termo é o mais específico; igualdade vale mais que "contém"
  for (let i = 0; i < hints.length; i++) {
    if (h === hints[i]) return 100 - i
    if (h.includes(hints[i])) return 50 - i
  }
  return 0
}

/** Escolhe a melhor coluna para cada campo, sem usar a mesma coluna duas vezes. */
export function guessMapping(headers: string[]): ColumnMapping {
  const candidates: { field: ImportField; column: number; score: number }[] = []
  for (const f of IMPORT_FIELDS) {
    headers.forEach((header, column) => {
      const s = score(header, f.hints)
      if (s > 0) candidates.push({ field: f.key, column, score: s })
    })
  }
  candidates.sort((a, b) => b.score - a.score)
  const mapping = Object.fromEntries(IMPORT_FIELDS.map((f) => [f.key, null])) as ColumnMapping
  const used = new Set<number>()
  for (const c of candidates) {
    if (mapping[c.field] !== null || used.has(c.column)) continue
    mapping[c.field] = c.column
    used.add(c.column)
  }
  return mapping
}

/** Linha de títulos: entre as 10 primeiras, a que mais se parece com os nomes esperados. */
export function detectHeaderRow(rows: SheetRow[]): number {
  let best = rows.findIndex((r) => r.cells.some(Boolean))
  let bestScore = 1
  rows.slice(0, 10).forEach((row, index) => {
    const recognized = Object.values(guessMapping(row.cells)).filter((c) => c !== null).length
    if (recognized > bestScore) {
      best = index
      bestScore = recognized
    }
  })
  return Math.max(best, 0)
}

export interface ImportRowPayload {
  line: number
  name?: string
  code?: string
  schedule?: string
  sector?: string
  professor?: string
  notes?: string
  studentCount?: string
  category?: string
}

/** Linhas abaixo dos títulos, já com os campos mapeados; linhas vazias ficam de fora. */
export function buildImportRows(rows: SheetRow[], headerIndex: number, mapping: ColumnMapping): ImportRowPayload[] {
  const result: ImportRowPayload[] = []
  for (const row of rows.slice(headerIndex + 1)) {
    const payload: ImportRowPayload = { line: row.line }
    let filled = false
    for (const f of IMPORT_FIELDS) {
      const column = mapping[f.key]
      if (column === null) continue
      const value = (row.cells[column] ?? '').trim()
      payload[f.key] = value
      if (value) filled = true
    }
    if (filled) result.push(payload)
  }
  return result
}

/** "A", "B", … "AA" — para mostrar as colunas como no Excel. */
export function columnLetter(index: number): string {
  let n = index + 1
  let letters = ''
  while (n > 0) {
    const rest = (n - 1) % 26
    letters = String.fromCharCode(65 + rest) + letters
    n = Math.floor((n - 1) / 26)
  }
  return letters
}
