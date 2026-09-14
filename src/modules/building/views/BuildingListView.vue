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
import AppBadge from '@/shared/components/AppBadge.vue'
import { listBuildings } from '../services/building.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IBuilding } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'code', label: 'Código' },
  { key: 'active', label: 'Status' },
  { key: 'actions', label: 'Ações' },
]

const rows = ref<IBuilding[]>([])
const loading = ref(false)
const search = ref('')
const page = ref(1)
const limit = 20
const total = ref(0)
const totalPages = ref(1)

function asBuilding(row: Record<string, unknown>): IBuilding {
  return row as unknown as IBuilding
}

async function fetchBuildings() {
  loading.value = true
  try {
    const res = await listBuildings({ page: page.value, limit, search: search.value || undefined })
    rows.value = res.data
    total.value = res.pagination.total
    totalPages.value = res.pagination.totalPages
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar prédios.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchBuildings)

watchDebounced(
  search,
  () => {
    page.value = 1
    fetchBuildings()
  },
  { debounce: 300 },
)

function changePage(target: number) {
  page.value = target
  fetchBuildings()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">Prédios</h1>
      <AppButton v-if="auth.isUser" @click="router.push('/buildings/new')">Novo prédio</AppButton>
    </div>

    <AppInput v-model="search" placeholder="Buscar por nome ou código..." />

    <AppEmptyState
      v-if="!loading && rows.length === 0"
      title="Nenhum prédio encontrado"
      :description="search ? 'Tente ajustar a busca.' : (auth.isUser ? 'Cadastre o primeiro prédio do seu instituto.' : 'Nenhum prédio cadastrado.')"
    >
      <template #action>
        <AppButton v-if="auth.isUser && !search" @click="router.push('/buildings/new')">Novo prédio</AppButton>
      </template>
    </AppEmptyState>

    <template v-else>
      <AppTable :columns="columns" :rows="rows" :loading="loading">
        <template #cell-active="{ row }">
          <AppBadge :variant="asBuilding(row).active ? 'success' : 'neutral'" :label="asBuilding(row).active ? 'Ativo' : 'Inativo'" />
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-2">
            <AppButton variant="ghost" size="sm" @click="router.push(`/buildings/${asBuilding(row).id}`)">Ver</AppButton>
            <AppButton variant="ghost" size="sm" @click="router.push(`/buildings/${asBuilding(row).id}/rooms`)">Salas</AppButton>
          </div>
        </template>
      </AppTable>

      <AppPagination :page="page" :total-pages="totalPages" :total="total" @update:page="changePage" />
    </template>
  </div>
</template>
