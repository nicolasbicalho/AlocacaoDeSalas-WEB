<script setup lang="ts">
import { ref, computed } from 'vue'
import { isAxiosError } from 'axios'
import ProjectForm from '../components/ProjectForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import {
  updateProject,
  activateProject,
  closeProject,
  type ProjectPayload,
} from '../services/project.service'
import { useProjectContext } from '../projectContext'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

// aba "Visão geral" do ProjectShell: o projeto já vem carregado pelo contexto
const auth = useAuthStore()
const ui = useUiStore()
const { project, setProject } = useProjectContext()

const saving = ref(false)
const transitioning = ref(false)
const confirmClose = ref(false)
const formRef = ref<InstanceType<typeof ProjectForm> | null>(null)

const canManage = computed(() => auth.isUser && project.value?.status !== 'closed')
const initialValues = computed<ProjectPayload | undefined>(() =>
  project.value
    ? {
        name: project.value.name,
        semester: project.value.semester,
        startDate: project.value.startDate ?? '',
        endDate: project.value.endDate ?? '',
      }
    : undefined,
)

async function onSubmit(values: ProjectPayload) {
  if (!project.value) return
  saving.value = true
  try {
    setProject(await updateProject(project.value.id, values))
    ui.toast({ message: 'Projeto atualizado com sucesso', variant: 'success' })
  } catch (err) {
    const code = isAxiosError(err) ? err.response?.data?.error?.code : undefined
    if (code === 'PROJECT_SEMESTER_EXISTS') {
      formRef.value?.setServerError('semester', 'Já existe um projeto com este semestre no instituto')
      return
    }
    if (code === 'PROJECT_DATES_CONFLICT') {
      formRef.value?.setServerError(
        'endDate',
        'Há eventos únicos fora deste período. Mova-os no cronograma antes de alterar as datas.',
      )
      return
    }
    ui.toast({ message: 'Erro ao salvar as alterações.', variant: 'error' })
  } finally {
    saving.value = false
  }
}

async function onActivate() {
  if (!project.value) return
  transitioning.value = true
  try {
    setProject(await activateProject(project.value.id))
    ui.toast({ message: 'Projeto ativado', variant: 'success' })
  } catch (err) {
    const code = isAxiosError(err) ? err.response?.data?.error?.code : undefined
    ui.toast({
      message:
        code === 'PROJECT_ACTIVE_EXISTS'
          ? 'O instituto já possui um projeto ativo.'
          : 'Erro ao ativar o projeto.',
      variant: 'error',
    })
  } finally {
    transitioning.value = false
  }
}

async function onCloseProject() {
  if (!project.value) return
  transitioning.value = true
  try {
    setProject(await closeProject(project.value.id))
    ui.toast({ message: 'Projeto encerrado', variant: 'success' })
  } catch {
    ui.toast({ message: 'Erro ao encerrar o projeto.', variant: 'error' })
  } finally {
    transitioning.value = false
    confirmClose.value = false
  }
}
</script>

<template>
  <div v-if="project" class="flex max-w-lg flex-col gap-4">
    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Dados do projeto</h2>
      <ProjectForm
        ref="formRef"
        :initial-values="initialValues"
        :readonly="!canManage"
        :loading="saving"
        submit-label="Salvar alterações"
        @submit="onSubmit"
      />
      <p v-if="!auth.isUser" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Você tem acesso somente leitura a este projeto.
      </p>
    </div>

    <div v-if="auth.isUser && project.status !== 'closed'" class="flex flex-wrap gap-3">
      <AppButton v-if="project.status === 'draft'" :loading="transitioning" @click="onActivate">
        Ativar projeto
      </AppButton>
      <AppButton
        v-if="project.status === 'active'"
        variant="secondary"
        :loading="transitioning"
        @click="confirmClose = true"
      >
        Encerrar projeto
      </AppButton>
    </div>

    <AppConfirmDialog
      :open="confirmClose"
      title="Encerrar projeto"
      :message="`Tem certeza que deseja encerrar '${project.name}'? Um projeto encerrado não pode mais ser editado.`"
      confirm-label="Encerrar"
      variant="warning"
      :loading="transitioning"
      @confirm="onCloseProject"
      @cancel="confirmClose = false"
    />
  </div>
</template>
