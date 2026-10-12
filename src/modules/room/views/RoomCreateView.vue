<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import RoomForm, { type RoomValues } from '../components/RoomForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { createRoom } from '../services/room.service'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const buildingId = route.params.buildingId as string
const listPath = `/buildings/${buildingId}/rooms`
const loading = ref(false)
const formRef = ref<InstanceType<typeof RoomForm> | null>(null)

async function onSubmit(values: RoomValues) {
  loading.value = true
  try {
    const room = await createRoom({ buildingId, ...values })
    ui.toast({ message: `Sala "${room.name}" criada`, variant: 'success' })
    // volta para a aba Salas, onde a sala nova aparece na lista
    router.push(listPath)
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
  <div class="flex max-w-lg flex-col gap-4">
    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Nova sala</h2>
      <RoomForm ref="formRef" :loading="loading" submit-label="Criar sala" @submit="onSubmit">
        <template #actions>
          <AppButton variant="secondary" type="button" :disabled="loading" @click="router.push(listPath)">
            Cancelar
          </AppButton>
        </template>
      </RoomForm>
    </div>
  </div>
</template>
