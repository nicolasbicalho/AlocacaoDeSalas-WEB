<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import DepartmentForm from '../components/DepartmentForm.vue'
import DepartmentStatusBadge from '../components/DepartmentStatusBadge.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import {
  getDepartment,
  updateDepartment,
  deactivateDepartment,
} from '../services/department.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IDepartment } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const id = route.params.id as string
const department = ref<IDepartment | null>(null)
const loadingPage = ref(true)
const saving = ref(false)
const deactivating = ref(false)
const confirmOpen = ref(false)
const formRef = ref<InstanceType<typeof DepartmentForm> | null>(null)

const canEdit = computed(() => auth.isAdmin)
const initialValues = computed(() =>
  department.value ? { name: department.value.name, code: department.value.code } : undefined,
)

onMounted(async () => {
  try {
    department.value = await getDepartment(id)
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      ui.toast({ message: 'Departamento não encontrado.', variant: 'error' })
      router.push('/departments')
      return
    }
    ui.toast({ message: 'Erro ao carregar o departamento.', variant: 'error' })
  } finally {
    loadingPage.value = false
  }
})

async function onSubmit(values: { name: string; code: string }) {
  saving.value = true
  try {
    department.value = await updateDepartment(id, values)
    ui.toast({ message: 'Departamento atualizado com sucesso', variant: 'success' })
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
    ui.toast({ message: 'Erro ao salvar as alterações.', variant: 'error' })
  } finally {
    saving.value = false
  }
}

async function confirmDeactivate() {
  deactivating.value = true
  try {
    await deactivateDepartment(id)
    ui.toast({ message: 'Departamento desativado', variant: 'success' })
    router.push('/departments')
  } catch {
    ui.toast({ message: 'Erro ao desativar o departamento.', variant: 'error' })
  } finally {
    deactivating.value = false
    confirmOpen.value = false
  }
}
</script>

<template>
  <div v-if="loadingPage" class="flex justify-center py-16 text-gray-400">
    <AppSpinner size="lg" />
  </div>

  <div v-else-if="department" class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500">
      <RouterLink to="/departments" class="hover:underline">Departamentos</RouterLink>
      <span> / {{ department.name }}</span>
    </nav>

    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold text-gray-800">{{ department.name }}</h1>
      <DepartmentStatusBadge :active="department.active" />
    </div>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <DepartmentForm
        ref="formRef"
        :initial-values="initialValues"
        :readonly="!canEdit"
        :loading="saving"
        submit-label="Salvar alterações"
        @submit="onSubmit"
      />
      <p v-if="!canEdit" class="mt-2 text-sm text-gray-500">
        Você tem acesso somente leitura a este departamento.
      </p>
    </div>

    <div v-if="canEdit && department.active" class="rounded-xl border border-red-100 bg-red-50 p-6">
      <h2 class="text-sm font-semibold text-red-800">Zona de perigo</h2>
      <p class="mt-1 text-sm text-red-700">
        Desativar o departamento o torna indisponível para novos vínculos.
      </p>
      <AppButton variant="danger" size="sm" class="mt-3" @click="confirmOpen = true">
        Desativar departamento
      </AppButton>
    </div>

    <AppConfirmDialog
      :open="confirmOpen"
      title="Desativar departamento"
      :message="`Tem certeza que deseja desativar '${department.name}'? Ele deixará de aparecer para coordenadores e professores.`"
      confirm-label="Desativar"
      variant="danger"
      :loading="deactivating"
      @confirm="confirmDeactivate"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
