<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import { getTurma } from '../services/turma.service'
import { useUiStore } from '@/stores/ui'

// compatibilidade com a URL antiga `/turmas/:id`: descobre o projeto e vai para a rota aninhada
const route = useRoute()
const router = useRouter()
const ui = useUiStore()

onMounted(async () => {
  try {
    const turma = await getTurma(route.params.id as string)
    router.replace(`/projects/${turma.projectId}/turmas/${turma.id}`)
  } catch {
    ui.toast({ message: 'Turma não encontrada ou sem acesso.', variant: 'error' })
    router.replace('/projects')
  }
})
</script>

<template>
  <div class="flex justify-center py-16 text-gray-400 dark:text-gray-500"><AppSpinner size="lg" /></div>
</template>
