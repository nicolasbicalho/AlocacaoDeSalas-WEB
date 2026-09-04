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
import DepartmentStatusBadge from '../components/DepartmentStatusBadge.vue'
import { listDepartments } from '../services/department.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IDepartment } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'code', label: 'Código' },
  { key: 'active', label: 'Status' },
  { key: 'actions', label: 'Ações' },
]

const rows = ref<IDepartment[]>([])
const loading = ref(false)
const search = ref('')
const page = ref(1)
const limit = 20
const total = ref(0)
const totalPages = ref(1)

function asDept(row: Record<string, unknown>): IDepartment {
  return row as unknown as IDepartment
}

async function fetchDepartments() {
  loading.value = true
  try {
    const res = await listDepartments({
      page: page.value,
      limit,
      search: search.value || undefined,
    })
    rows.value = res.data
    total.value = res.pagination.total
    totalPages.value = res.pagination.totalPages
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar departamentos.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchDepartments)

// busca textual com debounce de 300ms — volta para a primeira página
watchDebounced(
  search,
  () => {
    page.value = 1
    fetchDepartments()
  },
  { debounce: 300 },
)

function changePage(target: number) {
  page.value = target
  fetchDepartments()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">Departamentos</h1>
      <AppButton v-if="auth.isAdmin" @click="router.push('/departments/new')">
        Novo departamento
      </AppButton>
    </div>

    <AppInput v-model="search" placeholder="Buscar por nome ou código..." />

    <AppEmptyState
      v-if="!loading && rows.length === 0"
      title="Nenhum departamento encontrado"
      :description="search ? 'Tente ajustar a busca.' : 'Crie o primeiro departamento para começar.'"
    >
      <template #action>
        <AppButton v-if="auth.isAdmin && !search" @click="router.push('/departments/new')">
          Novo departamento
        </AppButton>
      </template>
    </AppEmptyState>

    <template v-else>
      <AppTable :columns="columns" :rows="rows" :loading="loading">
        <template #cell-active="{ row }">
          <DepartmentStatusBadge :active="asDept(row).active" />
        </template>
        <template #cell-actions="{ row }">
          <AppButton variant="ghost" size="sm" @click="router.push(`/departments/${asDept(row).id}`)">
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
