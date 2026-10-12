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
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { featureLabel, floorLabel } from '@/shared/constants/roomFeatures'
import type { IRoom } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const buildingId = route.params.buildingId as string

const columns = [
  { key: 'name', label: 'Nome' },
  { key: 'code', label: 'Código' },
  { key: 'capacity', label: 'Capacidade' },
  { key: 'floor', label: 'Andar' },
  { key: 'boardCount', label: 'Quadros' },
  { key: 'features', label: 'Características' },
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

// o BuildingShell já validou o prédio (existência e acesso)
onMounted(fetchRooms)

function changePage(target: number) {
  page.value = target
  fetchRooms()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-500 dark:text-gray-400">Salas do prédio, com capacidade e características.</p>
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
        <template #cell-floor="{ row }">
          <span class="whitespace-nowrap">
            {{ asRoom(row).floor != null ? floorLabel(asRoom(row).floor!) : '—' }}
          </span>
          <span
            v-if="asRoom(row).corridorEnd"
            class="ml-1 whitespace-nowrap rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
            title="Fica na extremidade do corredor"
          >extremidade</span>
        </template>
        <template #cell-boardCount="{ row }">{{ asRoom(row).boardCount ?? '—' }}</template>
        <template #cell-features="{ row }">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="f in asRoom(row).features"
              :key="f"
              class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            >
              {{ featureLabel(f) }}
            </span>
            <span v-if="asRoom(row).features.length === 0" class="text-gray-400 dark:text-gray-500">—</span>
          </div>
        </template>
        <template #cell-active="{ row }">
          <AppBadge :variant="asRoom(row).active ? 'success' : 'neutral'" :label="asRoom(row).active ? 'Ativa' : 'Inativa'" />
        </template>
        <template #cell-actions="{ row }">
          <AppButton variant="ghost" size="sm" @click="router.push(`/buildings/${buildingId}/rooms/${asRoom(row).id}`)">Ver</AppButton>
        </template>
      </AppTable>

      <AppPagination :page="page" :total-pages="totalPages" :total="total" @update:page="changePage" />
    </template>
  </div>
</template>
