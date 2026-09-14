<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import RoomForm from '../components/RoomForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { createRoom } from '../services/room.service'
import { useUiStore } from '@/stores/ui'
import type { RoomAttribute } from '@/types'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const buildingId = route.params.buildingId as string
const loading = ref(false)
const formRef = ref<InstanceType<typeof RoomForm> | null>(null)

async function onSubmit(values: { name: string; code: string; capacity: number; attributes: RoomAttribute[] }) {
  loading.value = true
  try {
    const room = await createRoom({ buildingId, ...values })
    ui.toast({ message: 'Sala criada com sucesso', variant: 'success' })
    router.push(`/rooms/${room.id}`)
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.code === 'ROOM_CODE_EXISTS') {
      formRef.value?.setServerError('code', 'Já existe uma sala com este código no prédio')
      return
    }
    ui.toast({ message: 'Erro ao criar sala.', variant: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500">
      <RouterLink to="/buildings" class="hover:underline">Prédios</RouterLink>
      <span> / </span>
      <RouterLink :to="`/buildings/${buildingId}/rooms`" class="hover:underline">Salas</RouterLink>
      <span> / Nova sala</span>
    </nav>
    <h1 class="text-2xl font-bold text-gray-800">Nova sala</h1>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <RoomForm ref="formRef" :loading="loading" submit-label="Criar sala" @submit="onSubmit">
        <template #actions>
          <AppButton variant="secondary" type="button" :disabled="loading" @click="router.push(`/buildings/${buildingId}/rooms`)">
            Cancelar
          </AppButton>
        </template>
      </RoomForm>
    </div>
  </div>
</template>
