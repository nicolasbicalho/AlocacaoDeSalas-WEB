<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import AppContextHeader from '@/shared/components/AppContextHeader.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import type { Crumb, ContextTab } from '@/shared/components/navigation'
import { getBuilding } from '../services/building.service'
import { listRooms } from '@/modules/room/services/room.service'
import { provideBuildingContext } from '../buildingContext'
import { useUiStore } from '@/stores/ui'
import type { IBuilding } from '@/types'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const buildingId = computed(() => route.params.buildingId as string)
const building = ref<IBuilding | null>(null)
const loading = ref(true)
const roomCount = ref<number | null>(null)
const leafLabel = ref('')

async function loadBuilding(id: string) {
  loading.value = true
  building.value = null
  try {
    building.value = await getBuilding(id)
  } catch (err) {
    const status = isAxiosError(err) ? err.response?.status : undefined
    ui.toast({
      message: status === 404 || status === 403 ? 'Prédio não encontrado ou sem acesso.' : 'Erro ao carregar o prédio.',
      variant: 'error',
    })
    router.replace('/buildings')
  } finally {
    loading.value = false
  }
}

async function refreshCounts() {
  try {
    roomCount.value = (await listRooms({ buildingId: buildingId.value, limit: 1 })).pagination.total
  } catch {
    roomCount.value = null
  }
}

watch(buildingId, (id) => { if (id) { loadBuilding(id); refreshCounts() } }, { immediate: true })
watch(() => route.path, () => refreshCounts())
watch(() => route.params.roomId, () => (leafLabel.value = ''))

provideBuildingContext({
  building,
  setBuilding: (b) => (building.value = b),
  leafLabel,
  refreshCounts,
})

const base = computed(() => `/buildings/${buildingId.value}`)
const section = computed(() => route.meta.section ?? 'overview')

const tabs = computed<ContextTab[]>(() => [
  { label: 'Dados', to: base.value, active: section.value === 'overview' },
  { label: 'Salas', to: `${base.value}/rooms`, active: section.value === 'rooms', count: roomCount.value },
])

const crumbs = computed<Crumb[]>(() => {
  const items: Crumb[] = [
    { label: 'Prédios', to: '/buildings' },
    { label: building.value?.name ?? '…', to: base.value },
  ]
  if (section.value === 'rooms') {
    items.push({ label: 'Salas', to: `${base.value}/rooms` })
    if (route.meta.leaf === 'new') items.push({ label: 'Nova sala' })
    if (route.meta.leaf === 'detail') items.push({ label: leafLabel.value || '…' })
  }
  return items
})

const childKey = computed(() => `${buildingId.value}:${route.params.roomId ?? ''}`)
</script>

<template>
  <div v-if="loading" class="flex justify-center py-16 text-gray-400 dark:text-gray-500">
    <AppSpinner size="lg" />
  </div>

  <div v-else-if="building" class="flex flex-col gap-5">
    <AppContextHeader :title="building.name" :crumbs="crumbs" :tabs="tabs">
      <template #badge>
        <AppBadge :variant="building.active ? 'success' : 'neutral'" :label="building.active ? 'Ativo' : 'Inativo'" />
      </template>
      <template #meta>Código {{ building.code }}</template>
    </AppContextHeader>

    <RouterView :key="childKey" />
  </div>
</template>
