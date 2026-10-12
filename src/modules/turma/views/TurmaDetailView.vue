<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import TurmaForm from '../components/TurmaForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import { getTurma, updateTurma, deactivateTurma, type TurmaUpdatePayload } from '../services/turma.service'
import { useProjectContext } from '@/modules/project/projectContext'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { ITurma } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const { leafLabel } = useProjectContext()

const projectId = route.params.projectId as string
const turmaId = route.params.turmaId as string
const listPath = `/projects/${projectId}/turmas`

const turma = ref<ITurma | null>(null)
const loadingPage = ref(true)
const saving = ref(false)
const deactivating = ref(false)
const confirmOpen = ref(false)
const formRef = ref<InstanceType<typeof TurmaForm> | null>(null)

const canEdit = computed(() => auth.isUser)
const initialValues = computed(() =>
  turma.value
    ? {
        name: turma.value.name,
        code: turma.value.code ?? '',
        category: turma.value.category,
        sector: turma.value.sector,
        notes: turma.value.notes,
        studentCount: turma.value.studentCount,
        professor: turma.value.professor,
        requiredFeatures: turma.value.requiredFeatures,
        schedule: turma.value.schedule,
      }
    : undefined,
)

onMounted(async () => {
  try {
    const loaded = await getTurma(turmaId)
    // URL com o projeto errado: corrige para o projeto real da turma
    if (loaded.projectId !== projectId) {
      router.replace(`/projects/${loaded.projectId}/turmas/${loaded.id}`)
      return
    }
    turma.value = loaded
    leafLabel.value = loaded.name
  } catch (err) {
    const status = isAxiosError(err) ? err.response?.status : undefined
    ui.toast({
      message: status === 404 || status === 403 ? 'Turma não encontrada ou sem acesso.' : 'Erro ao carregar a turma.',
      variant: 'error',
    })
    router.replace(listPath)
  } finally {
    loadingPage.value = false
  }
})

async function onSubmit(values: TurmaUpdatePayload) {
  saving.value = true
  try {
    turma.value = await updateTurma(turmaId, values)
    leafLabel.value = turma.value.name
    ui.toast({ message: 'Turma atualizada com sucesso', variant: 'success' })
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.code === 'TURMA_CODE_EXISTS') {
      formRef.value?.setServerError('code', 'Já existe uma turma com este código no projeto')
      return
    }
    ui.toast({ message: 'Erro ao salvar as alterações.', variant: 'error' })
  } finally {
    saving.value = false
  }
}

async function confirmDeactivate() {
  deactivating.value = true
  try {
    await deactivateTurma(turmaId)
    ui.toast({ message: 'Turma desativada', variant: 'success' })
    router.push(listPath)
  } catch {
    ui.toast({ message: 'Erro ao desativar a turma.', variant: 'error' })
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

  <div v-else-if="turma" class="flex max-w-lg flex-col gap-4">
    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="mb-4 flex items-center gap-3">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ turma.name }}</h2>
        <AppBadge :variant="turma.active ? 'success' : 'neutral'" :label="turma.active ? 'Ativa' : 'Inativa'" />
      </div>
      <TurmaForm
        ref="formRef"
        :initial-values="initialValues"
        :readonly="!canEdit"
        :loading="saving"
        submit-label="Salvar alterações"
        @submit="onSubmit"
      >
        <template #actions>
          <AppButton variant="secondary" type="button" :disabled="saving" @click="router.push(listPath)">
            Voltar
          </AppButton>
        </template>
      </TurmaForm>
      <p v-if="!canEdit" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Você tem acesso somente leitura a esta turma.
      </p>
    </div>

    <div v-if="canEdit && turma.active" class="rounded-xl border border-red-100 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
      <h2 class="text-sm font-semibold text-red-800 dark:text-red-300">Zona de perigo</h2>
      <p class="mt-1 text-sm text-red-700 dark:text-red-400">Desativar a turma a remove das alocações.</p>
      <AppButton variant="danger" size="sm" class="mt-3" @click="confirmOpen = true">Desativar turma</AppButton>
    </div>

    <AppConfirmDialog
      :open="confirmOpen"
      title="Desativar turma"
      :message="`Tem certeza que deseja desativar '${turma.name}'?`"
      confirm-label="Desativar"
      variant="danger"
      :loading="deactivating"
      @confirm="confirmDeactivate"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
