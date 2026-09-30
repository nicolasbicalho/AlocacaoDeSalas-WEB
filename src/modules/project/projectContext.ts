import { inject, provide, type InjectionKey, type Ref } from 'vue'
import type { IProject } from '@/types'

/**
 * Contexto fornecido pelo `ProjectShell` às abas do projeto (Visão geral, Turmas, Cronograma).
 * O shell só renderiza as abas depois de carregar o projeto, então `project.value` já está preenchido.
 */
export interface ProjectContext {
  project: Ref<IProject | null>
  /** atualiza o cabeçalho após salvar/ativar/encerrar */
  setProject(project: IProject): void
  /** rótulo do último item do breadcrumb em páginas de detalhe (ex.: nome da turma) */
  leafLabel: Ref<string>
  /** recarrega os contadores das abas (ex.: após criar/desativar turma) */
  refreshCounts(): void
}

const KEY: InjectionKey<ProjectContext> = Symbol('projectContext')

export function provideProjectContext(ctx: ProjectContext): void {
  provide(KEY, ctx)
}

export function useProjectContext(): ProjectContext {
  const ctx = inject(KEY)
  if (!ctx) throw new Error('useProjectContext() precisa estar dentro do ProjectShell')
  return ctx
}
