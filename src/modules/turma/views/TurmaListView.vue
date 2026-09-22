<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import AppTable from '@/shared/components/AppTable.vue'
import AppPagination from '@/shared/components/AppPagination.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppEmptyState from '@/shared/components/AppEmptyState.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import { listTurmas } from '../services/turma.service'
import { getProject } from '@/modules/project/services/project.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { ITurma } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const projectId = route.params.projectId as string
const projectName = ref('')

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'code', label: 'Código' },
  { key: 'studentCount', label: 'Nº alunos' },
  { key: 'professor', label: 'Professor' },
  { key: 'schedule', label: 'Horários' },
  { key: 'active', label: 'Status' },
  { key: 'actions', label: 'Ações' },
]

const rows = ref<ITurma[]>([])
const loading = ref(false)
const page = ref(1)
const limit = 20
const total = ref(0)
const totalPages = ref(1)

function asTurma(row: Record<string, unknown>): ITurma {
  return row as unknown as ITurma
}

async function fetchTurmas() {
  loading.value = true
  try {
    const res = await listTurmas({ projectId, page: page.value, limit })
    rows.value = res.data
    total.value = res.pagination.total
    totalPages.value = res.pagination.totalPages
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar turmas.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    projectName.value = (await getProject(projectId)).name
  } catch (err) {
    if (isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 403)) {
      ui.toast({ message: 'Projeto não encontrado ou sem acesso.', variant: 'error' })
      router.push('/projects')
      return
    }
  }
  await fetchTurmas()
})

function changePage(target: number) {
  page.value = target
  fetchTurmas()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <nav class="text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/projects" class="hover:underline">Projetos</RouterLink>
      <span> / {{ projectName || '...' }} / Turmas</span>
    </nav>

    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Turmas</h1>
      <AppButton v-if="auth.isUser" @click="router.push(`/projects/${projectId}/turmas/new`)">Nova turma</AppButton>
    </div>

    <AppEmptyState
      v-if="!loading && rows.length === 0"
      title="Nenhuma turma neste projeto"
      :description="auth.isUser ? 'Cadastre a primeira turma do projeto.' : 'Nenhuma turma cadastrada.'"
    >
      <template #action>
        <AppButton v-if="auth.isUser" @click="router.push(`/projects/${projectId}/turmas/new`)">Nova turma</AppButton>
      </template>
    </AppEmptyState>

    <template v-else>
      <AppTable :columns="columns" :rows="rows" :loading="loading">
        <template #cell-code="{ row }">{{ asTurma(row).code || '—' }}</template>
        <template #cell-schedule="{ row }">{{ asTurma(row).schedule.length }}</template>
        <template #cell-active="{ row }">
          <AppBadge :variant="asTurma(row).active ? 'success' : 'neutral'" :label="asTurma(row).active ? 'Ativa' : 'Inativa'" />
        </template>
        <template #cell-actions="{ row }">
          <AppButton variant="ghost" size="sm" @click="router.push(`/turmas/${asTurma(row).id}`)">Ver</AppButton>
        </template>
      </AppTable>

      <AppPagination :page="page" :total-pages="totalPages" :total="total" @update:page="changePage" />
    </template>
  </div>
</template>
