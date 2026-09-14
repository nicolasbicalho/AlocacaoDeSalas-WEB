<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import BuildingForm from '../components/BuildingForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import {
  getBuilding,
  updateBuilding,
  deactivateBuilding,
  type BuildingPayload,
} from '../services/building.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IBuilding } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const id = route.params.id as string
const building = ref<IBuilding | null>(null)
const loadingPage = ref(true)
const saving = ref(false)
const deactivating = ref(false)
const confirmOpen = ref(false)
const formRef = ref<InstanceType<typeof BuildingForm> | null>(null)

const canEdit = computed(() => auth.isUser)
const initialValues = computed(() =>
  building.value
    ? {
        name: building.value.name,
        code: building.value.code,
        latitude: building.value.latitude,
        longitude: building.value.longitude,
      }
    : undefined,
)

onMounted(async () => {
  try {
    building.value = await getBuilding(id)
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      ui.toast({ message: 'Prédio não encontrado.', variant: 'error' })
      router.push('/buildings')
      return
    }
    if (isAxiosError(err) && err.response?.status === 403) {
      ui.toast({ message: 'Você não tem acesso a este prédio.', variant: 'error' })
      router.push('/buildings')
      return
    }
    ui.toast({ message: 'Erro ao carregar o prédio.', variant: 'error' })
  } finally {
    loadingPage.value = false
  }
})

async function onSubmit(values: BuildingPayload) {
  saving.value = true
  try {
    building.value = await updateBuilding(id, values)
    ui.toast({ message: 'Prédio atualizado com sucesso', variant: 'success' })
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.code === 'BUILDING_CODE_EXISTS') {
      formRef.value?.setServerError('code', 'Já existe um prédio com este código no instituto')
      return
    }
    ui.toast({ message: 'Erro ao salvar as alterações.', variant: 'error' })
  } finally {
    saving.value = false
  }
}

async function confirmDeactivate() {
  deactivating.value = true
  try {
    await deactivateBuilding(id)
    ui.toast({ message: 'Prédio desativado', variant: 'success' })
    router.push('/buildings')
  } catch {
    ui.toast({ message: 'Erro ao desativar o prédio.', variant: 'error' })
  } finally {
    deactivating.value = false
    confirmOpen.value = false
  }
}
</script>

<template>
  <div v-if="loadingPage" class="flex justify-center py-16 text-gray-400">
    <AppSpinner size="lg" />
  </div>

  <div v-else-if="building" class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500">
      <RouterLink to="/buildings" class="hover:underline">Prédios</RouterLink>
      <span> / {{ building.name }}</span>
    </nav>

    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold text-gray-800">{{ building.name }}</h1>
      <AppBadge :variant="building.active ? 'success' : 'neutral'" :label="building.active ? 'Ativo' : 'Inativo'" />
    </div>

    <div class="flex">
      <AppButton variant="secondary" size="sm" @click="router.push(`/buildings/${id}/rooms`)">Ver salas</AppButton>
    </div>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <BuildingForm
        ref="formRef"
        :initial-values="initialValues"
        :readonly="!canEdit"
        :loading="saving"
        submit-label="Salvar alterações"
        @submit="onSubmit"
      />
      <p v-if="!canEdit" class="mt-2 text-sm text-gray-500">Você tem acesso somente leitura a este prédio.</p>
    </div>

    <div v-if="canEdit && building.active" class="rounded-xl border border-red-100 bg-red-50 p-6">
      <h2 class="text-sm font-semibold text-red-800">Zona de perigo</h2>
      <p class="mt-1 text-sm text-red-700">Desativar o prédio o torna indisponível para novas salas e alocações.</p>
      <AppButton variant="danger" size="sm" class="mt-3" @click="confirmOpen = true">Desativar prédio</AppButton>
    </div>

    <AppConfirmDialog
      :open="confirmOpen"
      title="Desativar prédio"
      :message="`Tem certeza que deseja desativar '${building.name}'?`"
      confirm-label="Desativar"
      variant="danger"
      :loading="deactivating"
      @confirm="confirmDeactivate"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
