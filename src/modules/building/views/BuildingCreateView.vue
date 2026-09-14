<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import BuildingForm from '../components/BuildingForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { createBuilding, type BuildingPayload } from '../services/building.service'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const ui = useUiStore()

const loading = ref(false)
const formRef = ref<InstanceType<typeof BuildingForm> | null>(null)

async function onSubmit(values: BuildingPayload) {
  loading.value = true
  try {
    const building = await createBuilding(values)
    ui.toast({ message: 'Prédio criado com sucesso', variant: 'success' })
    router.push(`/buildings/${building.id}`)
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.code === 'BUILDING_CODE_EXISTS') {
      formRef.value?.setServerError('code', 'Já existe um prédio com este código no instituto')
      return
    }
    ui.toast({ message: 'Erro ao criar prédio.', variant: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/buildings" class="hover:underline">Prédios</RouterLink>
      <span> / Novo prédio</span>
    </nav>
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Novo prédio</h1>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <BuildingForm ref="formRef" :loading="loading" submit-label="Criar prédio" @submit="onSubmit">
        <template #actions>
          <AppButton variant="secondary" type="button" :disabled="loading" @click="router.push('/buildings')">
            Cancelar
          </AppButton>
        </template>
      </BuildingForm>
    </div>
  </div>
</template>
