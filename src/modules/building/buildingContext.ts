import { inject, provide, type InjectionKey, type Ref } from 'vue'
import type { IBuilding } from '@/types'

/**
 * Contexto fornecido pelo `BuildingShell` às abas do prédio (Dados, Salas).
 * O shell só renderiza as abas depois de carregar o prédio, então `building.value` já está preenchido.
 */
export interface BuildingContext {
  building: Ref<IBuilding | null>
  setBuilding(building: IBuilding): void
  /** rótulo do último item do breadcrumb em páginas de detalhe (ex.: nome da sala) */
  leafLabel: Ref<string>
  refreshCounts(): void
}

const KEY: InjectionKey<BuildingContext> = Symbol('buildingContext')

export function provideBuildingContext(ctx: BuildingContext): void {
  provide(KEY, ctx)
}

export function useBuildingContext(): BuildingContext {
  const ctx = inject(KEY)
  if (!ctx) throw new Error('useBuildingContext() precisa estar dentro do BuildingShell')
  return ctx
}
