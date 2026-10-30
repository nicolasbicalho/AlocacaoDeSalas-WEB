/**
 * Imprime só um trecho da página (a grade), em paisagem e com tinta escura — substitui o PDF.
 * Copia o HTML do trecho para fora do app e, só durante a impressão, esconde o resto da página.
 */
const PRINT_CSS = `
@media screen { .report-print { display: none !important; } }
@media print {
  @page { size: landscape; margin: 12mm; }
  html, body { background: #fff !important; } /* no tema escuro o body é escuro */
  body > *:not(.report-print) { display: none !important; }
  .report-print { display: block !important; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  .report-print, .report-print * {
    color: #111827 !important;
    background: transparent !important;
    border-color: #d1d5db !important;
    box-shadow: none !important;
    overflow: visible !important;
  }
  .report-print table { min-width: 0 !important; }
  .report-print tr { break-inside: avoid; }
}
`

export function printElement(el: HTMLElement): void {
  const style = document.createElement('style')
  style.textContent = PRINT_CSS
  const container = document.createElement('div')
  container.className = 'report-print'
  container.innerHTML = el.outerHTML
  document.body.append(style, container)

  const cleanup = () => {
    style.remove()
    container.remove()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}
