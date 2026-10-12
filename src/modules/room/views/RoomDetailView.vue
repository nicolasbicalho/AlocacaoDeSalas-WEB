<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import RoomForm, { type RoomValues } from '../components/RoomForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import { getRoom, updateRoom, deactivateRoom } from '../services/room.service'
import { useBuildingContext } from '@/modules/building/buildingContext'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IRoom } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const { leafLabel } = useBuildingContext()

const buildingId = route.params.buildingId as string
const roomId = route.params.roomId as string
const listPath = `/buildings/${buildingId}/rooms`

const room = ref<IRoom | null>(null)
const loadingPage = ref(true)
const saving = ref(false)
const deactivating = ref(false)
const confirmOpen = ref(false)
const formRef = ref<InstanceType<typeof RoomForm> | null>(null)

const canEdit = computed(() => auth.isUser)
const initialValues = computed(() =>
  room.value
    ? {
        name: room.value.name,
        code: room.value.code,
        capacity: room.value.capacity,
        features: room.value.features,
        floor: room.value.floor ?? null,
        boardCount: room.value.boardCount ?? null,
        corridorEnd: room.value.corridorEnd ?? null,
      }
    : undefined,
)

onMounted(async () => {
  try {
    const loaded = await getRoom(roomId)
    // URL com o prédio errado: corrige para o prédio real da sala
    if (loaded.buildingId !== buildingId) {
      router.replace(`/buildings/${loaded.buildingId}/rooms/${loaded.id}`)
      return
    }
    room.value = loaded
    leafLabel.value = loaded.name
  } catch (err) {
    const status = isAxiosError(err) ? err.response?.status : undefined
    ui.toast({
      message: status === 404 || status === 403 ? 'Sala não encontrada ou sem acesso.' : 'Erro ao carregar a sala.',
      variant: 'error',
    })
    router.replace(listPath)
  } finally {
    loadingPage.value = false
  }
})

async function onSubmit(values: RoomValues) {
  saving.value = true
  try {
    room.value = await updateRoom(roomId, values)
    leafLabel.value = room.value.name
    ui.toast({ message: 'Sala atualizada com sucesso', variant: 'success' })
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.code === 'ROOM_CODE_EXISTS') {
      formRef.value?.setServerError('code', 'Já existe uma sala com este código no prédio')
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
    await deactivateRoom(roomId)
    ui.toast({ message: 'Sala desativada', variant: 'success' })
    router.push(listPath)
  } catch {
    ui.toast({ message: 'Erro ao desativar a sala.', variant: 'error' })
  } finally {
    deactivating.value = false
    confirmOpen.value = false
  }
}
</script>

<template>
  <div v-if="loadingPage" class="flex justify-center py-16 text-gray-400 dark:text-gray-500">
    <AppSpinner size="lg" />
  </div>

  <div v-else-if="room" class="flex max-w-lg flex-col gap-4">
    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="mb-4 flex items-center gap-3">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ room.name }}</h2>
        <AppBadge :variant="room.active ? 'success' : 'neutral'" :label="room.active ? 'Ativa' : 'Inativa'" />
      </div>
      <RoomForm
        ref="formRef"
        :initial-values="initialValues"
        :readonly="!canEdit"
        :loading="saving"
        submit-label="Salvar alterações"
        @submit="onSubmit"
      >
        <template #actions>
          <AppButton variant="secondary" type="button" :disabled="saving" @click="router.push(listPath)">
            Voltar
          </AppButton>
        </template>
      </RoomForm>
      <p v-if="!canEdit" class="mt-2 text-sm text-gray-500 dark:text-gray-400">Você tem acesso somente leitura a esta sala.</p>
    </div>

    <div v-if="canEdit && room.active" class="rounded-xl border border-red-100 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
      <h2 class="text-sm font-semibold text-red-800 dark:text-red-300">Zona de perigo</h2>
      <p class="mt-1 text-sm text-red-700 dark:text-red-400">Desativar a sala a torna indisponível para alocações.</p>
      <AppButton variant="danger" size="sm" class="mt-3" @click="confirmOpen = true">Desativar sala</AppButton>
    </div>

    <AppConfirmDialog
      :open="confirmOpen"
      title="Desativar sala"
      :message="`Tem certeza que deseja desativar '${room.name}'?`"
      confirm-label="Desativar"
      variant="danger"
      :loading="deactivating"
      @confirm="confirmDeactivate"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
