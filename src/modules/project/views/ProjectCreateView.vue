<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import ProjectForm from '../components/ProjectForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { createProject } from '../services/project.service'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const ui = useUiStore()

const loading = ref(false)
const formRef = ref<InstanceType<typeof ProjectForm> | null>(null)

async function onSubmit(values: { name: string; semester: string }) {
  loading.value = true
  try {
    const project = await createProject(values)
    ui.toast({ message: 'Projeto criado com sucesso', variant: 'success' })
    router.push(`/projects/${project.id}`)
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.code === 'PROJECT_SEMESTER_EXISTS') {
      formRef.value?.setServerError('semester', 'Já existe um projeto com este semestre no instituto')
      return
    }
    ui.toast({ message: 'Erro ao criar projeto.', variant: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-lg flex-col gap-4">
    <nav class="text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/projects" class="hover:underline">Projetos</RouterLink>
      <span> / Novo projeto</span>
    </nav>
    <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Novo projeto</h1>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <ProjectForm ref="formRef" :loading="loading" submit-label="Criar projeto" @submit="onSubmit">
        <template #actions>
          <AppButton
            variant="secondary"
            type="button"
            :disabled="loading"
            @click="router.push('/projects')"
          >
            Cancelar
          </AppButton>
        </template>
      </ProjectForm>
    </div>
  </div>
</template>
