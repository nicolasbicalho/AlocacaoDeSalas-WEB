<script setup lang="ts">
import AppBreadcrumb from '@/shared/components/AppBreadcrumb.vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import ProfessorForm from '../components/ProfessorForm.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import { getProfessor, updateProfessor, setProfessorActive, type ProfessorPayload } from '../services/professor.service'
import { listTurmas } from '@/modules/turma/services/turma.service'
import { listProjects } from '@/modules/project/services/project.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IProfessor, IProject, ITurma } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const id = route.params.professorId as string
const professor = ref<IProfessor | null>(null)
const turmas = ref<ITurma[]>([])
const projects = ref<IProject[]>([])
const loadingPage = ref(true)
const saving = ref(false)
const toggling = ref(false)
const confirmOpen = ref(false)
const formRef = ref<InstanceType<typeof ProfessorForm> | null>(null)

const canEdit = computed(() => auth.isUser)
const initialValues = computed(() =>
  professor.value
    ? { name: professor.value.name, preferences: professor.value.preferences, notes: professor.value.notes }
    : undefined,
)
const projectName = computed(() => new Map(projects.value.map((p) => [p.id, p.name])))

onMounted(async () => {
  try {
    professor.value = await getProfessor(id)
  } catch (err) {
    const status = isAxiosError(err) ? err.response?.status : undefined
    ui.toast({
      message: status === 404 || status === 403 ? 'Professor não encontrado ou sem acesso.' : 'Erro ao carregar o professor.',
      variant: 'error',
    })
    router.replace('/professors')
    return
  } finally {
    loadingPage.value = false
  }
  // turmas do professor em todos os semestres (a lista é informativa: falhas não bloqueiam a página)
  try {
    const [turmaRes, projectRes] = await Promise.all([
      listTurmas({ professorId: id, limit: 100 }),
      listProjects({ limit: 100 }),
    ])
    turmas.value = turmaRes.data
    projects.value = projectRes.data
  } catch {
    turmas.value = []
  }
})

async function onSubmit(values: ProfessorPayload) {
  saving.value = true
  try {
    const renamed = professor.value?.name !== values.name
    professor.value = await updateProfessor(id, values)
    if (renamed) turmas.value = turmas.value.map((t) => ({ ...t, professor: values.name }))
    ui.toast({
      message: renamed ? 'Professor atualizado — o nome também mudou nas turmas dele' : 'Professor atualizado com sucesso',
      variant: 'success',
    })
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.code === 'PROFESSOR_NAME_EXISTS') {
      formRef.value?.setServerError('name', 'Já existe um professor com este nome (acentos e maiúsculas não diferenciam)')
      return
    }
    ui.toast({ message: 'Erro ao salvar as alterações.', variant: 'error' })
  } finally {
    saving.value = false
  }
}

async function toggleActive(active: boolean) {
  toggling.value = true
  try {
    professor.value = await setProfessorActive(id, active)
    ui.toast({ message: active ? 'Professor reativado' : 'Professor desativado', variant: 'success' })
  } catch {
    ui.toast({ message: 'Erro ao alterar o status do professor.', variant: 'error' })
  } finally {
    toggling.value = false
    confirmOpen.value = false
  }
}
</script>

<template>
  <div v-if="loadingPage" class="flex justify-center py-16 text-gray-400 dark:text-gray-500">
    <AppSpinner size="lg" />
  </div>

  <div v-else-if="professor" class="mx-auto flex max-w-2xl flex-col gap-4">
    <AppBreadcrumb :items="[{ label: 'Professores', to: '/professors' }, { label: professor.name }]" />

    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ professor.name }}</h1>
      <AppBadge :variant="professor.active ? 'success' : 'neutral'" :label="professor.active ? 'Ativo' : 'Desativado'" />
    </div>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <ProfessorForm
        ref="formRef"
        :initial-values="initialValues"
        :readonly="!canEdit"
        :loading="saving"
        submit-label="Salvar alterações"
        @submit="onSubmit"
      >
        <template #actions>
          <AppButton variant="secondary" type="button" :disabled="saving" @click="router.push('/professors')">
            Voltar
          </AppButton>
        </template>
      </ProfessorForm>
      <p v-if="!canEdit" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Você tem acesso somente leitura a este professor.
      </p>
    </div>

    <div class="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Turmas ({{ turmas.length }})
      </h2>
      <p v-if="turmas.length === 0" class="text-sm text-gray-400 dark:text-gray-500">Nenhuma turma com este professor.</p>
      <ul v-else class="divide-y divide-gray-100 text-sm dark:divide-gray-700">
        <li v-for="t in turmas" :key="t.id" class="flex items-center justify-between gap-3 py-2">
          <RouterLink
            :to="`/projects/${t.projectId}/turmas/${t.id}`"
            class="font-medium text-primary-700 hover:underline dark:text-primary-400"
          >
            {{ t.name }}<span v-if="t.code" class="font-normal text-gray-500 dark:text-gray-400"> ({{ t.code }})</span>
          </RouterLink>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ projectName.get(t.projectId) ?? '' }}</span>
        </li>
      </ul>
    </div>

    <div v-if="canEdit && professor.active" class="rounded-xl border border-red-100 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
      <h2 class="text-sm font-semibold text-red-800 dark:text-red-300">Zona de perigo</h2>
      <p class="mt-1 text-sm text-red-700 dark:text-red-400">
        Desativar tira o professor do autocompletar das turmas. As turmas atuais continuam com ele, e salvar uma turma
        com o nome dele o reativa.
      </p>
      <AppButton variant="danger" size="sm" class="mt-3" @click="confirmOpen = true">Desativar professor</AppButton>
    </div>
    <div v-else-if="canEdit" class="flex justify-end">
      <AppButton variant="secondary" size="sm" :loading="toggling" @click="toggleActive(true)">Reativar professor</AppButton>
    </div>

    <AppConfirmDialog
      :open="confirmOpen"
      title="Desativar professor"
      :message="`Tem certeza que deseja desativar '${professor.name}'?`"
      confirm-label="Desativar"
      variant="danger"
      :loading="toggling"
      @confirm="toggleActive(false)"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
