import type { Worksheet } from 'exceljs'
import { listTurmas } from './services/turma.service'
import { listAllocations } from '@/modules/allocation/services/allocation.service'
import { listRooms } from '@/modules/room/services/room.service'
import { listBuildings } from '@/modules/building/services/building.service'
import { DAY_OPTIONS, formatDateBR } from '@/modules/allocation/helpers'
import { buildTimetable, WEEK } from './timetable'
import { downloadBlob, fileSlug, XLSX_MIME } from '@/shared/utils/download'
import type { IProject, ITurma } from '@/types'

/** Todas as turmas do projeto (a API pagina em até 100). */
async function fetchAllTurmas(projectId: string): Promise<ITurma[]> {
  const all: ITurma[] = []
  for (let page = 1; ; page++) {
    const res = await listTurmas({ projectId, page, limit: 100 })
    all.push(...res.data)
    if (page >= res.pagination.totalPages) return all
  }
}

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } } as const
const BORDER = {
  top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
} as const

function styleTable(ws: Worksheet, headerRow: number) {
  ws.getRow(headerRow).eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = HEADER_FILL
  })
  ws.eachRow((row, n) => {
    if (n < headerRow) return
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = BORDER
      cell.alignment = { vertical: 'top', wrapText: true }
    })
  })
  ws.views = [{ state: 'frozen', ySplit: headerRow }]
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
}

/**
 * Baixa o quadro de horários semanal do semestre em XLSX:
 * "Quadro semanal" (faixas de horário × dias), "Turmas" (lista filtrável) e "Salas" (ocupação).
 */
export async function downloadTimetable(project: IProject): Promise<void> {
  const [turmas, allocations, roomRes, buildingRes, { default: ExcelJS }] = await Promise.all([
    fetchAllTurmas(project.id),
    listAllocations(project.id),
    listRooms({ limit: 100 }),
    listBuildings({ limit: 100 }),
    import('exceljs'),
  ])
  const tt = buildTimetable(turmas, allocations, roomRes.data, buildingRes.data)
  const days = DAY_OPTIONS.map((d) => d.long)
  const period = project.startDate ? `${formatDateBR(project.startDate)} a ${formatDateBR(project.endDate)}` : ''

  const wb = new ExcelJS.Workbook()
  wb.creator = 'AlocaçãoDeSalas'
  wb.created = new Date()

  // 1) quadro semanal: uma linha por faixa de horário, uma coluna por dia
  const grid = wb.addWorksheet('Quadro semanal')
  grid.addRow([`Quadro de horários — ${project.name}`]).font = { bold: true, size: 14 }
  grid.addRow([`Semestre ${project.semester}${period ? ` · ${period}` : ''} · gerado em ${new Date().toLocaleString('pt-BR')}`]).font = {
    color: { argb: 'FF6B7280' },
  }
  grid.addRow([])
  grid.addRow(['Horário', ...days])
  for (const band of tt.bands) {
    grid.addRow([`${band.start}–${band.end}`, ...WEEK.map((d) => band.cells[d].join('\n'))])
  }
  if (tt.bands.length === 0) grid.addRow(['As turmas ainda não têm horários na grade.'])
  grid.columns = [{ width: 13 }, ...WEEK.map(() => ({ width: 42 }))]
  styleTable(grid, 4)

  // 2) lista: uma linha por turma e horário, com filtro
  const list = wb.addWorksheet('Turmas')
  list.addRow(['Dia', 'Início', 'Fim', 'Disciplina', 'Código', 'Categoria', 'Professor', 'Setor', 'Nº de alunos', 'Sala teórica', 'Sala de prática', 'Situação'])
  const dayLong = Object.fromEntries(DAY_OPTIONS.map((d) => [d.value, d.long]))
  for (const r of tt.rows) {
    list.addRow([
      r.day ? dayLong[r.day] : '—',
      r.start,
      r.end,
      r.name,
      r.code,
      r.category,
      r.professor,
      r.sector,
      r.studentCount ?? 'a definir',
      r.theoryRoom,
      r.practiceRoom,
      r.status,
    ])
  }
  list.columns = [12, 8, 8, 34, 12, 18, 24, 12, 12, 18, 18, 14].map((width) => ({ width }))
  list.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 12 } }
  styleTable(list, 1)

  // 3) ocupação por sala (aulas recorrentes)
  const byRoom = wb.addWorksheet('Salas')
  byRoom.addRow(['Sala', ...days])
  for (const r of tt.rooms) byRoom.addRow([r.label, ...WEEK.map((d) => r.cells[d].join('\n'))])
  byRoom.columns = [{ width: 30 }, ...WEEK.map(() => ({ width: 36 }))]
  styleTable(byRoom, 1)

  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(new Blob([buffer], { type: XLSX_MIME }), `quadro-de-horarios-${fileSlug(project.name)}.xlsx`)
}

/** Modelo para importação: as colunas da planilha do gerente, com dois exemplos. */
export async function downloadImportTemplate(): Promise<void> {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Turmas')
  ws.addRow(['Nome da disciplina', 'Código da turma', 'Dia da semana e horário', 'Setor', 'Professor', 'Anotações', 'Nº de alunos', 'Categoria'])
  ws.addRow(['Cálculo I', 'MAT101-A', 'SEG 08-10, QUA 08-10', 'DMAT', 'Ana Ribeiro', 'Prefere térreo', '', 'Graduação'])
  ws.addRow(['Tópicos em Otimização', 'PGC801', 'Qui 14h às 17h', 'DCC', 'Carla Dias', '', '18', 'Pós-graduação'])
  ws.columns = [28, 16, 26, 10, 22, 30, 12, 16].map((width) => ({ width }))
  styleTable(ws, 1)
  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(new Blob([buffer], { type: XLSX_MIME }), 'modelo-importacao-turmas.xlsx')
}
