<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { watchDebounced } from '@vueuse/core'
import { isAxiosError } from 'axios'
import AppTable from '@/shared/components/AppTable.vue'
import AppPagination from '@/shared/components/AppPagination.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppInput from '@/shared/components/AppInput.vue'
import AppEmptyState from '@/shared/components/AppEmptyState.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import { listProfessors } from '../services/professor.service'
import { preferenceItems } from '../helpers'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IProfessor } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'preferences', label: 'Preferências de sala' },
  { key: 'active', label: 'Status' },
  { key: 'actions', label: '' },
]

const rows = ref<IProfessor[]>([])
const loading = ref(false)
const search = ref('')
const showInactive = ref(false)
const page = ref(1)
const limit = 50
const total = ref(0)
const totalPages = ref(1)

function asProfessor(row: Record<string, unknown>): IProfessor {
  return row as unknown as IProfessor
}

async function fetchProfessors() {
  loading.value = true
  try {
    const res = await listProfessors({
      page: page.value,
      limit,
      ...(search.value.trim() ? { search: search.value.trim() } : {}),
      ...(showInactive.value ? {} : { active: true }),
    })
    rows.value = res.data
    total.value = res.pagination.total
    totalPages.value = Math.max(1, res.pagination.totalPages)
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar professores.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfessors)

watchDebounced(
  search,
  () => {
    page.value = 1
    fetchProfessors()
  },
  { debounce: 300 },
)
watch(showInactive, () => {
  page.value = 1
  fetchProfessors()
})

function changePage(target: number) {
  page.value = target
  fetchProfessors()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Professores</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Cadastro do instituto, válido em todos os semestres. As preferências colocam as salas certas no topo das
          sugestões do cronograma.
        </p>
      </div>
      <AppButton v-if="auth.isUser" @click="router.push('/professors/new')">Novo professor</AppButton>
    </div>

    <div class="flex flex-wrap items-center gap-4">
      <div class="w-80 max-w-full">
        <AppInput v-model="search" placeholder="Buscar por nome..." />
      </div>
      <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <input v-model="showInactive" type="checkbox" class="h-4 w-4 accent-primary-600" />
        Mostrar desativados
      </label>
    </div>

    <AppEmptyState
      v-if="!loading && rows.length === 0 && !search && !showInactive"
      title="Nenhum professor cadastrado"
      description="Os professores entram no cadastro ao salvar uma turma, ou podem ser cadastrados aqui."
    >
      <template #action>
        <AppButton v-if="auth.isUser" @click="router.push('/professors/new')">Novo professor</AppButton>
      </template>
    </AppEmptyState>

    <template v-else>
      <AppTable
        :columns="columns"
        :rows="rows"
        :loading="loading"
        :empty-message="search ? `Nenhum professor encontrado para “${search}”.` : 'Nenhum professor.'"
      >
        <template #cell-name="{ row }">
          <span class="font-medium text-gray-800 dark:text-gray-100">{{ asProfessor(row).name }}</span>
          <span
            v-if="asProfessor(row).notes"
            class="ml-1 cursor-help text-xs text-gray-400"
            :title="asProfessor(row).notes"
            aria-label="Possui anotações"
          >📝</span>
        </template>
        <template #cell-preferences="{ row }">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="item in preferenceItems(asProfessor(row).preferences)"
              :key="item"
              class="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-800 dark:bg-primary-950/40 dark:text-primary-200"
            >
              {{ item }}
            </span>
            <span v-if="preferenceItems(asProfessor(row).preferences).length === 0" class="text-gray-400 dark:text-gray-500">
              sem preferências
            </span>
          </div>
        </template>
        <template #cell-active="{ row }">
          <AppBadge :variant="asProfessor(row).active ? 'success' : 'neutral'" :label="asProfessor(row).active ? 'Ativo' : 'Desativado'" />
        </template>
        <template #cell-actions="{ row }">
          <AppButton variant="ghost" size="sm" @click="router.push(`/professors/${asProfessor(row).id}`)">Ver</AppButton>
        </template>
      </AppTable>

      <AppPagination :page="page" :total-pages="totalPages" :total="total" @update:page="changePage" />
    </template>
  </div>
</template>
