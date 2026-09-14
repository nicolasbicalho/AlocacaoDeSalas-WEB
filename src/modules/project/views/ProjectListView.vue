<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import ProjectCard from '../components/ProjectCard.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppEmptyState from '@/shared/components/AppEmptyState.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import AppPagination from '@/shared/components/AppPagination.vue'
import { listProjects } from '../services/project.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IProject, ProjectStatus } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const rows = ref<IProject[]>([])
const loading = ref(false)
const status = ref<'' | ProjectStatus>('')
const page = ref(1)
const limit = 20
const total = ref(0)
const totalPages = ref(1)

const statusOptions: { value: '' | ProjectStatus; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'active', label: 'Ativo' },
  { value: 'closed', label: 'Encerrado' },
]

async function fetchProjects() {
  loading.value = true
  try {
    const res = await listProjects({
      page: page.value,
      limit,
      status: status.value || undefined,
    })
    rows.value = res.data
    total.value = res.pagination.total
    totalPages.value = res.pagination.totalPages
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar projetos.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

function applyFilter(value: '' | ProjectStatus) {
  status.value = value
  page.value = 1
  fetchProjects()
}

function changePage(target: number) {
  page.value = target
  fetchProjects()
}

onMounted(fetchProjects)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Projetos</h1>
      <AppButton v-if="auth.isUser" @click="router.push('/projects/new')">Novo projeto</AppButton>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        type="button"
        class="rounded-full border px-3 py-1 text-sm transition"
        :class="status === opt.value
          ? 'border-primary-700 bg-white font-medium text-primary-700 dark:border-primary-400 dark:bg-gray-800 dark:text-primary-400'
          : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'"
        @click="applyFilter(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-16 text-gray-400 dark:text-gray-500">
      <AppSpinner size="lg" />
    </div>

    <AppEmptyState
      v-else-if="rows.length === 0"
      title="Nenhum projeto encontrado"
      :description="auth.isUser ? 'Crie o primeiro projeto para começar.' : 'Nenhum projeto neste filtro.'"
    >
      <template #action>
        <AppButton v-if="auth.isUser" @click="router.push('/projects/new')">Novo projeto</AppButton>
      </template>
    </AppEmptyState>

    <template v-else>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectCard
          v-for="p in rows"
          :key="p.id"
          :project="p"
          @open="router.push(`/projects/${$event}`)"
        />
      </div>
      <AppPagination
        :page="page"
        :total-pages="totalPages"
        :total="total"
        @update:page="changePage"
      />
    </template>
  </div>
</template>
