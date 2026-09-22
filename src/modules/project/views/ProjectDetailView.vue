<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import ProjectForm from '../components/ProjectForm.vue'
import ProjectStatusBadge from '../components/ProjectStatusBadge.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import {
  getProject,
  updateProject,
  activateProject,
  closeProject,
} from '../services/project.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IProject } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const id = route.params.id as string
const project = ref<IProject | null>(null)
const loadingPage = ref(true)
const saving = ref(false)
const transitioning = ref(false)
const confirmClose = ref(false)
const formRef = ref<InstanceType<typeof ProjectForm> | null>(null)

const canManage = computed(() => auth.isUser && project.value?.status !== 'closed')
const initialValues = computed(() =>
  project.value ? { name: project.value.name, semester: project.value.semester } : undefined,
)

onMounted(async () => {
  try {
    project.value = await getProject(id)
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      ui.toast({ message: 'Projeto não encontrado.', variant: 'error' })
      router.push('/projects')
      return
    }
    if (isAxiosError(err) && err.response?.status === 403) {
      ui.toast({ message: 'Você não tem acesso a este projeto.', variant: 'error' })
      router.push('/projects')
      return
    }
    ui.toast({ message: 'Erro ao carregar o projeto.', variant: 'error' })
  } finally {
    loadingPage.value = false
  }
})

async function onSubmit(values: { name: string; semester: string }) {
  saving.value = true
  try {
    project.value = await updateProject(id, values)
    ui.toast({ message: 'Projeto atualizado com sucesso', variant: 'success' })
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.code === 'PROJECT_SEMESTER_EXISTS') {
      formRef.value?.setServerError('semester', 'Já existe um projeto com este semestre no instituto')
      return
    }
    ui.toast({ message: 'Erro ao salvar as alterações.', variant: 'error' })
  } finally {
    saving.value = false
  }
}

async function onActivate() {
  transitioning.value = true
  try {
    project.value = await activateProject(id)
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
  transitioning.value = true
  try {
    project.value = await closeProject(id)
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
  <div v-if="loadingPage" class="flex justify-center py-16 text-gray-400 dark:text-gray-500">
    <AppSpinner size="lg" />
  </div>

  <div v-else-if="project" class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/projects" class="hover:underline">Projetos</RouterLink>
      <span> / {{ project.name }}</span>
    </nav>

    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ project.name }}</h1>
      <ProjectStatusBadge :status="project.status" />
    </div>

    <div class="flex">
      <AppButton variant="secondary" size="sm" @click="router.push(`/projects/${id}/turmas`)">Ver turmas</AppButton>
    </div>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
      <AppButton
        v-if="project.status === 'draft'"
        :loading="transitioning"
        @click="onActivate"
      >
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
