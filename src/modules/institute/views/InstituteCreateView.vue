<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import InstituteForm from '../components/InstituteForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { createInstitute } from '../services/institute.service'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const ui = useUiStore()

const loading = ref(false)
const formRef = ref<InstanceType<typeof InstituteForm> | null>(null)

async function onSubmit(values: { name: string; code: string }) {
  loading.value = true
  try {
    await createInstitute(values)
    ui.toast({ message: 'Instituto criado com sucesso', variant: 'success' })
    router.push('/institutes')
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err.response?.data?.error?.code
      if (code === 'INSTITUTE_NAME_EXISTS') {
        formRef.value?.setServerError('name', 'Já existe um instituto com este nome')
        return
      }
      if (code === 'INSTITUTE_CODE_EXISTS') {
        formRef.value?.setServerError('code', 'Já existe um instituto com este código')
        return
      }
    }
    ui.toast({ message: 'Erro ao criar instituto.', variant: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500">
      <RouterLink to="/institutes" class="hover:underline">Institutos</RouterLink>
      <span> / Novo instituto</span>
    </nav>
    <h1 class="text-2xl font-bold text-gray-800">Novo instituto</h1>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <InstituteForm ref="formRef" :loading="loading" submit-label="Salvar" @submit="onSubmit">
        <template #actions>
          <AppButton
            variant="secondary"
            type="button"
            :disabled="loading"
            @click="router.push('/institutes')"
          >
            Cancelar
          </AppButton>
        </template>
      </InstituteForm>
    </div>
  </div>
</template>
