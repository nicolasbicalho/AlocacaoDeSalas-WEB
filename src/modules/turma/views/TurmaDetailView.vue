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
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { ITurma } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const id = route.params.id as string
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
        code: turma.value.code,
        studentCount: turma.value.studentCount,
        professor: turma.value.professor,
        requiredAttributes: turma.value.requiredAttributes,
        schedule: turma.value.schedule,
      }
    : undefined,
)

onMounted(async () => {
  try {
    turma.value = await getTurma(id)
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      ui.toast({ message: 'Turma não encontrada.', variant: 'error' })
      router.push('/projects')
      return
    }
    if (isAxiosError(err) && err.response?.status === 403) {
      ui.toast({ message: 'Você não tem acesso a esta turma.', variant: 'error' })
      router.push('/projects')
      return
    }
    ui.toast({ message: 'Erro ao carregar a turma.', variant: 'error' })
  } finally {
    loadingPage.value = false
  }
})

async function onSubmit(values: TurmaUpdatePayload) {
  saving.value = true
  try {
    turma.value = await updateTurma(id, values)
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
    await deactivateTurma(id)
    ui.toast({ message: 'Turma desativada', variant: 'success' })
    if (turma.value) router.push(`/projects/${turma.value.projectId}/turmas`)
    else router.push('/projects')
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

  <div v-else-if="turma" class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/projects" class="hover:underline">Projetos</RouterLink>
      <span> / </span>
      <RouterLink :to="`/projects/${turma.projectId}/turmas`" class="hover:underline">Turmas</RouterLink>
      <span> / {{ turma.name }}</span>
    </nav>

    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ turma.name }}</h1>
      <AppBadge :variant="turma.active ? 'success' : 'neutral'" :label="turma.active ? 'Ativa' : 'Inativa'" />
    </div>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <TurmaForm
        ref="formRef"
        :initial-values="initialValues"
        :readonly="!canEdit"
        :loading="saving"
        submit-label="Salvar alterações"
        @submit="onSubmit"
      />
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
