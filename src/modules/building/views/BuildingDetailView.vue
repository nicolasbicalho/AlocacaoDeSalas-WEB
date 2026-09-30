<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import BuildingForm from '../components/BuildingForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import { updateBuilding, deactivateBuilding, type BuildingPayload } from '../services/building.service'
import { useBuildingContext } from '../buildingContext'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

// aba "Dados" do BuildingShell: o prédio já vem carregado pelo contexto
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const { building, setBuilding } = useBuildingContext()

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

async function onSubmit(values: BuildingPayload) {
  if (!building.value) return
  saving.value = true
  try {
    setBuilding(await updateBuilding(building.value.id, values))
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
  if (!building.value) return
  deactivating.value = true
  try {
    await deactivateBuilding(building.value.id)
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
  <div v-if="building" class="flex max-w-lg flex-col gap-4">
    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Dados do prédio</h2>
      <BuildingForm
        ref="formRef"
        :initial-values="initialValues"
        :readonly="!canEdit"
        :loading="saving"
        submit-label="Salvar alterações"
        @submit="onSubmit"
      />
      <p v-if="!canEdit" class="mt-2 text-sm text-gray-500 dark:text-gray-400">Você tem acesso somente leitura a este prédio.</p>
    </div>

    <div v-if="canEdit && building.active" class="rounded-xl border border-red-100 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
      <h2 class="text-sm font-semibold text-red-800 dark:text-red-300">Zona de perigo</h2>
      <p class="mt-1 text-sm text-red-700 dark:text-red-400">Desativar o prédio o torna indisponível para novas salas e alocações.</p>
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
