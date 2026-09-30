<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import { getRoom } from '../services/room.service'
import { useUiStore } from '@/stores/ui'

// compatibilidade com a URL antiga `/rooms/:id`: descobre o prédio e vai para a rota aninhada
const route = useRoute()
const router = useRouter()
const ui = useUiStore()

onMounted(async () => {
  try {
    const room = await getRoom(route.params.id as string)
    router.replace(`/buildings/${room.buildingId}/rooms/${room.id}`)
  } catch {
    ui.toast({ message: 'Sala não encontrada ou sem acesso.', variant: 'error' })
    router.replace('/buildings')
  }
})
</script>

<template>
  <div class="flex justify-center py-16 text-gray-400 dark:text-gray-500"><AppSpinner size="lg" /></div>
</template>
