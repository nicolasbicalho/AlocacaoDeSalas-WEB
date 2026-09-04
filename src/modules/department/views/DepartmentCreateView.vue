<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import DepartmentForm from '../components/DepartmentForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { createDepartment } from '../services/department.service'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const ui = useUiStore()

const loading = ref(false)
const formRef = ref<InstanceType<typeof DepartmentForm> | null>(null)

async function onSubmit(values: { name: string; code: string }) {
  loading.value = true
  try {
    await createDepartment(values)
    ui.toast({ message: 'Departamento criado com sucesso', variant: 'success' })
    router.push('/departments')
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err.response?.data?.error?.code
      if (code === 'DEPARTMENT_NAME_EXISTS') {
        formRef.value?.setServerError('name', 'Já existe um departamento com este nome')
        return
      }
      if (code === 'DEPARTMENT_CODE_EXISTS') {
        formRef.value?.setServerError('code', 'Já existe um departamento com este código')
        return
      }
    }
    ui.toast({ message: 'Erro ao criar departamento.', variant: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500">
      <RouterLink to="/departments" class="hover:underline">Departamentos</RouterLink>
      <span> / Novo departamento</span>
    </nav>
    <h1 class="text-2xl font-bold text-gray-800">Novo departamento</h1>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <DepartmentForm ref="formRef" :loading="loading" submit-label="Salvar" @submit="onSubmit">
        <template #actions>
          <AppButton
            variant="secondary"
            type="button"
            :disabled="loading"
            @click="router.push('/departments')"
          >
            Cancelar
          </AppButton>
        </template>
      </DepartmentForm>
    </div>
  </div>
</template>
