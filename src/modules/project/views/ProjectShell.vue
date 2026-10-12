<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import AppContextHeader from '@/shared/components/AppContextHeader.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import type { Crumb, ContextTab } from '@/shared/components/navigation'
import ProjectStatusBadge from '../components/ProjectStatusBadge.vue'
import { getProject } from '../services/project.service'
import { listTurmas } from '@/modules/turma/services/turma.service'
import { formatDateBR } from '@/modules/allocation/helpers'
import { provideProjectContext } from '../projectContext'
import { useUiStore } from '@/stores/ui'
import type { IProject } from '@/types'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const projectId = computed(() => route.params.projectId as string)
const project = ref<IProject | null>(null)
const loading = ref(true)
const turmaCount = ref<number | null>(null)
const leafLabel = ref('')

async function loadProject(id: string) {
  loading.value = true
  project.value = null
  try {
    project.value = await getProject(id)
  } catch (err) {
    const status = isAxiosError(err) ? err.response?.status : undefined
    ui.toast({
      message: status === 404 || status === 403 ? 'Projeto não encontrado ou sem acesso.' : 'Erro ao carregar o projeto.',
      variant: 'error',
    })
    router.replace('/projects')
  } finally {
    loading.value = false
  }
}

async function refreshCounts() {
  try {
    turmaCount.value = (await listTurmas({ projectId: projectId.value, limit: 1 })).pagination.total
  } catch {
    turmaCount.value = null
  }
}

watch(projectId, (id) => { if (id) { loadProject(id); refreshCounts() } }, { immediate: true })
// contadores e rótulo da folha acompanham a navegação entre as abas
watch(() => route.path, () => refreshCounts())
watch(() => route.params.turmaId, () => (leafLabel.value = ''))

provideProjectContext({
  project,
  setProject: (p) => (project.value = p),
  leafLabel,
  refreshCounts,
})

const base = computed(() => `/projects/${projectId.value}`)
const section = computed(() => route.meta.section ?? 'overview')

const tabs = computed<ContextTab[]>(() => [
  { label: 'Visão geral', to: base.value, active: section.value === 'overview' },
  { label: 'Turmas', to: `${base.value}/turmas`, active: section.value === 'turmas', count: turmaCount.value },
  { label: 'Cronograma', to: `${base.value}/allocation`, active: section.value === 'allocation' },
])

const crumbs = computed<Crumb[]>(() => {
  const items: Crumb[] = [
    { label: 'Projetos', to: '/projects' },
    { label: project.value?.name ?? '…', to: base.value },
  ]
  if (section.value === 'turmas') {
    items.push({ label: 'Turmas', to: `${base.value}/turmas` })
    if (route.meta.leaf === 'new') items.push({ label: 'Nova turma' })
    if (route.meta.leaf === 'import') items.push({ label: 'Importar planilha' })
    if (route.meta.leaf === 'detail') items.push({ label: leafLabel.value || '…' })
  }
  if (section.value === 'allocation') items.push({ label: 'Cronograma' })
  return items
})

// a turma aberta muda o componente; trocar só a query (deep link do cronograma) não
const childKey = computed(() => `${projectId.value}:${route.params.turmaId ?? ''}`)
</script>

<template>
  <div v-if="loading" class="flex justify-center py-16 text-gray-400 dark:text-gray-500">
    <AppSpinner size="lg" />
  </div>

  <div v-else-if="project" class="flex flex-col gap-5">
    <AppContextHeader :title="project.name" :crumbs="crumbs" :tabs="tabs">
      <template #badge><ProjectStatusBadge :status="project.status" /></template>
      <template #meta>
        <template v-if="project.startDate && project.endDate">
          {{ formatDateBR(project.startDate) }} – {{ formatDateBR(project.endDate) }}
        </template>
      </template>
    </AppContextHeader>

    <RouterView :key="childKey" />
  </div>
</template>
