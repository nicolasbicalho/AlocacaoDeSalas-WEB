<script setup lang="ts">
import AppBreadcrumb from '@/shared/components/AppBreadcrumb.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import ProfessorForm from '../components/ProfessorForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { createProfessor, type ProfessorPayload } from '../services/professor.service'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const ui = useUiStore()

const loading = ref(false)
const formRef = ref<InstanceType<typeof ProfessorForm> | null>(null)

async function onSubmit(values: ProfessorPayload) {
  loading.value = true
  try {
    const professor = await createProfessor(values)
    ui.toast({ message: `Professor "${professor.name}" cadastrado`, variant: 'success' })
    router.push('/professors')
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.code === 'PROFESSOR_NAME_EXISTS') {
      formRef.value?.setServerError('name', 'Já existe um professor com este nome (acentos e maiúsculas não diferenciam)')
      return
    }
    ui.toast({ message: 'Erro ao cadastrar o professor.', variant: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-lg flex-col gap-4">
    <AppBreadcrumb :items="[{ label: 'Professores', to: '/professors' }, { label: 'Novo professor' }]" />
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Novo professor</h1>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <ProfessorForm ref="formRef" :loading="loading" submit-label="Cadastrar professor" @submit="onSubmit">
        <template #actions>
          <AppButton variant="secondary" type="button" :disabled="loading" @click="router.push('/professors')">
            Cancelar
          </AppButton>
        </template>
      </ProfessorForm>
    </div>
  </div>
</template>
