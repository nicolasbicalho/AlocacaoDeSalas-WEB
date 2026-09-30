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
const listPath = `/projects/${projectId}/turmas`
const loading = ref(false)
const formRef = ref<InstanceType<typeof TurmaForm> | null>(null)

async function onSubmit(values: Omit<TurmaCreatePayload, 'projectId'>) {
  loading.value = true
  try {
    const turma = await createTurma({ projectId, ...values })
    ui.toast({ message: `Turma "${turma.name}" criada`, variant: 'success' })
    // volta para a aba Turmas, onde a turma nova aparece na lista
    router.push(listPath)
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
  <div class="flex max-w-lg flex-col gap-4">
    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Nova turma</h2>
      <TurmaForm ref="formRef" :loading="loading" submit-label="Criar turma" @submit="onSubmit">
        <template #actions>
          <AppButton variant="secondary" type="button" :disabled="loading" @click="router.push(listPath)">
            Cancelar
          </AppButton>
        </template>
      </TurmaForm>
    </div>
  </div>
</template>
