import type { Workbook } from 'exceljs'
import { occupancyRows, type Sheet } from './helpers'
import { downloadBlob, fileSlug, XLSX_MIME } from '@/shared/utils/download'
import type { IProject, OccupancyReport } from '@/types'

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } } as const
const NUM_FMT = { pct: '0%', hours: '0.0', plain: undefined } as const

function addSheet(wb: Workbook, name: string, sheet: Sheet, widths: number[]) {
  const ws = wb.addWorksheet(name)
  ws.addRow(sheet.header).eachCell((cell) => {
    cell.font = { bold: true }
    cell.fill = HEADER_FILL
  })
  for (const row of sheet.rows) ws.addRow(row.map((v) => v ?? '—'))
  sheet.formats.forEach((format, i) => {
    const numFmt = NUM_FMT[format]
    if (numFmt) ws.getColumn(i + 1).numFmt = numFmt
  })
  ws.columns.forEach((col, i) => (col.width = widths[i] ?? widths[widths.length - 1]))
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  return ws
}

/** Baixa a ocupação das salas em XLSX ("Resumo", "Salas", "Mapa de calor"), com os filtros da tela. */
export async function downloadOccupancy(project: IProject, report: OccupancyReport, filterLabel: string): Promise<void> {
  const { default: ExcelJS } = await import('exceljs')
  const sheets = occupancyRows(report, filterLabel)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'AlocaçãoDeSalas'
  wb.created = new Date()

  addSheet(wb, 'Resumo', sheets.summary, [52, 48])
  const rooms = addSheet(wb, 'Salas', sheets.rooms, [20, 22, 11, 10, 15, 11, 9, 9, 9, 16, 14, 14])
  rooms.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheets.rooms.header.length } }
  addSheet(wb, 'Mapa de calor', sheets.heatmap, [12, 6])

  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(new Blob([buffer], { type: XLSX_MIME }), `ocupacao-${fileSlug(project.name)}.xlsx`)
}
