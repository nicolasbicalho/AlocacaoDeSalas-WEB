<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import RoomForm from '../components/RoomForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import { getRoom, updateRoom, deactivateRoom } from '../services/room.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IRoom, RoomAttribute } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const id = route.params.id as string
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
        attributes: room.value.attributes,
      }
    : undefined,
)

onMounted(async () => {
  try {
    room.value = await getRoom(id)
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      ui.toast({ message: 'Sala não encontrada.', variant: 'error' })
      router.push('/buildings')
      return
    }
    if (isAxiosError(err) && err.response?.status === 403) {
      ui.toast({ message: 'Você não tem acesso a esta sala.', variant: 'error' })
      router.push('/buildings')
      return
    }
    ui.toast({ message: 'Erro ao carregar a sala.', variant: 'error' })
  } finally {
    loadingPage.value = false
  }
})

async function onSubmit(values: { name: string; code: string; capacity: number; attributes: RoomAttribute[] }) {
  saving.value = true
  try {
    room.value = await updateRoom(id, values)
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
    await deactivateRoom(id)
    ui.toast({ message: 'Sala desativada', variant: 'success' })
    if (room.value) router.push(`/buildings/${room.value.buildingId}/rooms`)
    else router.push('/buildings')
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

  <div v-else-if="room" class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/buildings" class="hover:underline">Prédios</RouterLink>
      <span> / </span>
      <RouterLink :to="`/buildings/${room.buildingId}/rooms`" class="hover:underline">Salas</RouterLink>
      <span> / {{ room.name }}</span>
    </nav>

    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ room.name }}</h1>
      <AppBadge :variant="room.active ? 'success' : 'neutral'" :label="room.active ? 'Ativa' : 'Inativa'" />
    </div>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <RoomForm
        ref="formRef"
        :initial-values="initialValues"
        :readonly="!canEdit"
        :loading="saving"
        submit-label="Salvar alterações"
        @submit="onSubmit"
      />
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
