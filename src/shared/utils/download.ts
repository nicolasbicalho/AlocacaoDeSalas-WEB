/** Dispara o download de um arquivo gerado no navegador. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // o navegador já copiou a referência; libera a memória logo depois
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** "IC 2027.1" → "IC-2027.1" (nome de arquivo sem espaços nem acentos). */
export function fileSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
