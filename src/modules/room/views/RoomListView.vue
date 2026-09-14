<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import AppTable from '@/shared/components/AppTable.vue'
import AppPagination from '@/shared/components/AppPagination.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppEmptyState from '@/shared/components/AppEmptyState.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import { listRooms } from '../services/room.service'
import { getBuilding } from '@/modules/building/services/building.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IRoom } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const buildingId = route.params.buildingId as string
const buildingName = ref('')

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'code', label: 'Código' },
  { key: 'capacity', label: 'Capacidade' },
  { key: 'attributes', label: 'Atributos' },
  { key: 'active', label: 'Status' },
  { key: 'actions', label: 'Ações' },
]

const rows = ref<IRoom[]>([])
const loading = ref(false)
const page = ref(1)
const limit = 20
const total = ref(0)
const totalPages = ref(1)

function asRoom(row: Record<string, unknown>): IRoom {
  return row as unknown as IRoom
}

async function fetchRooms() {
  loading.value = true
  try {
    const res = await listRooms({ buildingId, page: page.value, limit })
    rows.value = res.data
    total.value = res.pagination.total
    totalPages.value = res.pagination.totalPages
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar salas.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    buildingName.value = (await getBuilding(buildingId)).name
  } catch (err) {
    if (isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 403)) {
      ui.toast({ message: 'Prédio não encontrado ou sem acesso.', variant: 'error' })
      router.push('/buildings')
      return
    }
  }
  await fetchRooms()
})

function changePage(target: number) {
  page.value = target
  fetchRooms()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <nav class="text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/buildings" class="hover:underline">Prédios</RouterLink>
      <span> / {{ buildingName || '...' }} / Salas</span>
    </nav>

    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Salas</h1>
      <AppButton v-if="auth.isUser" @click="router.push(`/buildings/${buildingId}/rooms/new`)">Nova sala</AppButton>
    </div>

    <AppEmptyState
      v-if="!loading && rows.length === 0"
      title="Nenhuma sala neste prédio"
      :description="auth.isUser ? 'Cadastre a primeira sala do prédio.' : 'Nenhuma sala cadastrada.'"
    >
      <template #action>
        <AppButton v-if="auth.isUser" @click="router.push(`/buildings/${buildingId}/rooms/new`)">Nova sala</AppButton>
      </template>
    </AppEmptyState>

    <template v-else>
      <AppTable :columns="columns" :rows="rows" :loading="loading">
        <template #cell-attributes="{ row }">{{ asRoom(row).attributes.length }}</template>
        <template #cell-active="{ row }">
          <AppBadge :variant="asRoom(row).active ? 'success' : 'neutral'" :label="asRoom(row).active ? 'Ativa' : 'Inativa'" />
        </template>
        <template #cell-actions="{ row }">
          <AppButton variant="ghost" size="sm" @click="router.push(`/rooms/${asRoom(row).id}`)">Ver</AppButton>
        </template>
      </AppTable>

      <AppPagination :page="page" :total-pages="totalPages" :total="total" @update:page="changePage" />
    </template>
  </div>
</template>
