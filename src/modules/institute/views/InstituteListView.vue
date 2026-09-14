<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { watchDebounced } from '@vueuse/core'
import { isAxiosError } from 'axios'
import AppTable from '@/shared/components/AppTable.vue'
import AppPagination from '@/shared/components/AppPagination.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppInput from '@/shared/components/AppInput.vue'
import AppEmptyState from '@/shared/components/AppEmptyState.vue'
import InstituteStatusBadge from '../components/InstituteStatusBadge.vue'
import { listInstitutes } from '../services/institute.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IInstitute } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'code', label: 'Código' },
  { key: 'active', label: 'Status' },
  { key: 'actions', label: 'Ações' },
]

const rows = ref<IInstitute[]>([])
const loading = ref(false)
const search = ref('')
const page = ref(1)
const limit = 20
const total = ref(0)
const totalPages = ref(1)

function asInstitute(row: Record<string, unknown>): IInstitute {
  return row as unknown as IInstitute
}

async function fetchInstitutes() {
  loading.value = true
  try {
    const res = await listInstitutes({
      page: page.value,
      limit,
      search: search.value || undefined,
    })
    rows.value = res.data
    total.value = res.pagination.total
    totalPages.value = res.pagination.totalPages
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar institutos.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchInstitutes)

// busca textual com debounce de 300ms — volta para a primeira página
watchDebounced(
  search,
  () => {
    page.value = 1
    fetchInstitutes()
  },
  { debounce: 300 },
)

function changePage(target: number) {
  page.value = target
  fetchInstitutes()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Institutos</h1>
      <AppButton v-if="auth.isAdmin" @click="router.push('/institutes/new')">
        Novo instituto
      </AppButton>
    </div>

    <AppInput v-model="search" placeholder="Buscar por nome ou código..." />

    <AppEmptyState
      v-if="!loading && rows.length === 0"
      title="Nenhum instituto encontrado"
      :description="search ? 'Tente ajustar a busca.' : 'Crie o primeiro instituto para começar.'"
    >
      <template #action>
        <AppButton v-if="auth.isAdmin && !search" @click="router.push('/institutes/new')">
          Novo instituto
        </AppButton>
      </template>
    </AppEmptyState>

    <template v-else>
      <AppTable :columns="columns" :rows="rows" :loading="loading">
        <template #cell-active="{ row }">
          <InstituteStatusBadge :active="asInstitute(row).active" />
        </template>
        <template #cell-actions="{ row }">
          <AppButton variant="ghost" size="sm" @click="router.push(`/institutes/${asInstitute(row).id}`)">
            Ver
          </AppButton>
        </template>
      </AppTable>

      <AppPagination
        :page="page"
        :total-pages="totalPages"
        :total="total"
        @update:page="changePage"
      />
    </template>
  </div>
</template>
