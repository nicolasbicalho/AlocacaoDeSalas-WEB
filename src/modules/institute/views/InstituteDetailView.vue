<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import InstituteForm from '../components/InstituteForm.vue'
import InstituteStatusBadge from '../components/InstituteStatusBadge.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import {
  getInstitute,
  updateInstitute,
  deactivateInstitute,
} from '../services/institute.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IInstitute } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const id = route.params.id as string
const institute = ref<IInstitute | null>(null)
const loadingPage = ref(true)
const saving = ref(false)
const deactivating = ref(false)
const confirmOpen = ref(false)
const formRef = ref<InstanceType<typeof InstituteForm> | null>(null)

const canEdit = computed(() => auth.isAdmin)
const initialValues = computed(() =>
  institute.value ? { name: institute.value.name, code: institute.value.code } : undefined,
)

onMounted(async () => {
  try {
    institute.value = await getInstitute(id)
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      ui.toast({ message: 'Instituto não encontrado.', variant: 'error' })
      router.push('/institutes')
      return
    }
    ui.toast({ message: 'Erro ao carregar o instituto.', variant: 'error' })
  } finally {
    loadingPage.value = false
  }
})

async function onSubmit(values: { name: string; code: string }) {
  saving.value = true
  try {
    institute.value = await updateInstitute(id, values)
    ui.toast({ message: 'Instituto atualizado com sucesso', variant: 'success' })
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
    ui.toast({ message: 'Erro ao salvar as alterações.', variant: 'error' })
  } finally {
    saving.value = false
  }
}

async function confirmDeactivate() {
  deactivating.value = true
  try {
    await deactivateInstitute(id)
    ui.toast({ message: 'Instituto desativado', variant: 'success' })
    router.push('/institutes')
  } catch {
    ui.toast({ message: 'Erro ao desativar o instituto.', variant: 'error' })
  } finally {
    deactivating.value = false
    confirmOpen.value = false
  }
}
</script>

<template>
  <div v-if="loadingPage" class="flex justify-center py-16 text-gray-400 dark:text-gray-500">
    <AppSpinner size="lg" />
  </div>

  <div v-else-if="institute" class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/institutes" class="hover:underline">Institutos</RouterLink>
      <span> / {{ institute.name }}</span>
    </nav>

    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ institute.name }}</h1>
      <InstituteStatusBadge :active="institute.active" />
    </div>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <InstituteForm
        ref="formRef"
        :initial-values="initialValues"
        :readonly="!canEdit"
        :loading="saving"
        submit-label="Salvar alterações"
        @submit="onSubmit"
      />
      <p v-if="!canEdit" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Você tem acesso somente leitura a este instituto.
      </p>
    </div>

    <div v-if="canEdit && institute.active" class="rounded-xl border border-red-100 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
      <h2 class="text-sm font-semibold text-red-800 dark:text-red-300">Zona de perigo</h2>
      <p class="mt-1 text-sm text-red-700 dark:text-red-400">
        Desativar o instituto o torna indisponível para novos vínculos.
      </p>
      <AppButton variant="danger" size="sm" class="mt-3" @click="confirmOpen = true">
        Desativar instituto
      </AppButton>
    </div>

    <AppConfirmDialog
      :open="confirmOpen"
      title="Desativar instituto"
      :message="`Tem certeza que deseja desativar '${institute.name}'? Ele deixará de aparecer para os gerentes do instituto.`"
      confirm-label="Desativar"
      variant="danger"
      :loading="deactivating"
      @confirm="confirmDeactivate"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
