<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import TurmaForm from '../components/TurmaForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { createTurma, type TurmaCreatePayload } from '../services/turma.service'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const projectId = route.params.projectId as string
const loading = ref(false)
const formRef = ref<InstanceType<typeof TurmaForm> | null>(null)

async function onSubmit(values: Omit<TurmaCreatePayload, 'projectId'>) {
  loading.value = true
  try {
    const turma = await createTurma({ projectId, ...values })
    ui.toast({ message: 'Turma criada com sucesso', variant: 'success' })
    router.push(`/turmas/${turma.id}`)
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.code === 'TURMA_CODE_EXISTS') {
      formRef.value?.setServerError('code', 'Já existe uma turma com este código no projeto')
      return
    }
    ui.toast({ message: 'Erro ao criar turma.', variant: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/projects" class="hover:underline">Projetos</RouterLink>
      <span> / </span>
      <RouterLink :to="`/projects/${projectId}/turmas`" class="hover:underline">Turmas</RouterLink>
      <span> / Nova turma</span>
    </nav>
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Nova turma</h1>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <TurmaForm ref="formRef" :loading="loading" submit-label="Criar turma" @submit="onSubmit">
        <template #actions>
          <AppButton variant="secondary" type="button" :disabled="loading" @click="router.push(`/projects/${projectId}/turmas`)">
            Cancelar
          </AppButton>
        </template>
      </TurmaForm>
    </div>
  </div>
</template>
