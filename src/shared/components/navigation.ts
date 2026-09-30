import type { RouteLocationRaw } from 'vue-router'

/** Item do breadcrumb; sem `to`, é a página atual (não clicável). */
export interface Crumb {
  label: string
  to?: RouteLocationRaw
}

/** Aba de contexto (ex.: Visão geral / Turmas / Cronograma dentro de um projeto). */
export interface ContextTab {
  label: string
  to: RouteLocationRaw
  active: boolean
  count?: number | null
}
