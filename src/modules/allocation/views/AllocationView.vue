<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import AppButton from '@/shared/components/AppButton.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import AppEmptyState from '@/shared/components/AppEmptyState.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import ProjectStatusBadge from '@/modules/project/components/ProjectStatusBadge.vue'
import AllocationModal from '../components/AllocationModal.vue'
import { listAllocations, deleteAllocation } from '../services/allocation.service'
import { getProject } from '@/modules/project/services/project.service'
import { listTurmas } from '@/modules/turma/services/turma.service'
import { listRooms } from '@/modules/room/services/room.service'
import { DAY_OPTIONS, dayLabel, formatDateBR } from '../helpers'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IProject, ITurma, IRoom, IAllocation, WeekDay } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const projectId = route.params.projectId as string
const project = ref<IProject | null>(null)
const turmas = ref<ITurma[]>([])
const rooms = ref<IRoom[]>([])
const allocations = ref<IAllocation[]>([])
const loading = ref(true)

const modalOpen = ref(false)
const editing = ref<IAllocation | null>(null)
const confirmTarget = ref<IAllocation | null>(null)
const deleting = ref(false)

const canManage = computed(() => auth.isUser && project.value?.status !== 'closed')
const activeTurmas = computed(() => turmas.value.filter((t) => t.active))
const activeRooms = computed(() => rooms.value.filter((r) => r.active))

const turmaById = computed(() => new Map(turmas.value.map((t) => [t.id, t])))
const roomById = computed(() => new Map(rooms.value.map((r) => [r.id, r])))

const weeklyByDay = computed(() =>
  DAY_OPTIONS.map((d) => ({
    day: d.value as WeekDay,
    long: d.long,
    items: allocations.value
      .filter((a) => a.type === 'weekly' && a.timeSlot.day === d.value)
      .sort((a, b) => a.timeSlot.start.localeCompare(b.timeSlot.start)),
  })).filter((g) => g.items.length > 0),
)

const singleByDate = computed(() => {
  const groups = new Map<string, IAllocation[]>()
  for (const a of allocations.value.filter((x) => x.type === 'single' && x.date)) {
    const list = groups.get(a.date!) ?? []
    list.push(a)
    groups.set(a.date!, list)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({
      date,
      items: items.sort((a, b) => a.timeSlot.start.localeCompare(b.timeSlot.start)),
    }))
})

const stats = computed(() => ({
  total: allocations.value.length,
  rooms: new Set(allocations.value.map((a) => a.roomId)).size,
  turmas: new Set(allocations.value.map((a) => a.turmaId)).size,
  totalTurmas: activeTurmas.value.length,
}))

function turmaLabel(id: string): string {
  const t = turmaById.value.get(id)
  return t ? `${t.name} — ${t.professor}` : '—'
}
function roomLabel(id: string): string {
  const r = roomById.value.get(id)
  return r ? `${r.name} (${r.code})` : '—'
}
function slotLabel(a: IAllocation): string {
  return `${a.timeSlot.start}–${a.timeSlot.end}`
}

async function fetchAll() {
  loading.value = true
  try {
    const [proj, turmaRes, roomRes, allocs] = await Promise.all([
      getProject(projectId),
      listTurmas({ projectId, limit: 100 }),
      listRooms({ limit: 100 }),
      listAllocations(projectId),
    ])
    project.value = proj
    turmas.value = turmaRes.data
    rooms.value = roomRes.data
    allocations.value = allocs
  } catch (err) {
    if (isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 403)) {
      ui.toast({ message: 'Projeto não encontrado ou sem acesso.', variant: 'error' })
      router.push('/projects')
      return
    }
    ui.toast({ message: 'Erro ao carregar o cronograma.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)

function openCreate() {
  editing.value = null
  modalOpen.value = true
}
function openMove(a: IAllocation) {
  editing.value = a
  modalOpen.value = true
}
function onSaved(saved: IAllocation) {
  const idx = allocations.value.findIndex((a) => a.id === saved.id)
  if (idx >= 0) allocations.value.splice(idx, 1, saved)
  else allocations.value.push(saved)
  modalOpen.value = false
  ui.toast({ message: editing.value ? 'Utilização movida' : 'Utilização adicionada', variant: 'success' })
}

async function confirmDelete() {
  if (!confirmTarget.value) return
  deleting.value = true
  try {
    await deleteAllocation(projectId, confirmTarget.value.id)
    allocations.value = allocations.value.filter((a) => a.id !== confirmTarget.value!.id)
    ui.toast({ message: 'Utilização removida', variant: 'success' })
    confirmTarget.value = null
  } catch {
    ui.toast({ message: 'Erro ao remover a utilização.', variant: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="flex justify-center py-16 text-gray-400 dark:text-gray-500">
    <AppSpinner size="lg" />
  </div>

  <div v-else-if="project" class="flex flex-col gap-4">
    <nav class="text-sm text-gray-500 dark:text-gray-400">
      <RouterLink to="/projects" class="hover:underline">Projetos</RouterLink>
      <span> / {{ project.name }} / Cronograma</span>
    </nav>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Cronograma</h1>
        <ProjectStatusBadge :status="project.status" />
      </div>
      <AppButton v-if="canManage" @click="openCreate">Adicionar utilização</AppButton>
    </div>

    <!-- estatísticas -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ stats.total }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Utilizações</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ stats.rooms }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Salas usadas</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {{ stats.turmas }}<span class="text-base font-normal text-gray-400">/{{ stats.totalTurmas }}</span>
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Turmas com sala</p>
      </div>
      <div class="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ singleByDate.length }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Dias com uso único</p>
      </div>
    </div>

    <AppEmptyState
      v-if="allocations.length === 0"
      title="Cronograma vazio"
      :description="canManage ? 'Adicione a primeira utilização de sala do projeto.' : 'Nenhuma utilização cadastrada.'"
    >
      <template #action>
        <AppButton v-if="canManage" @click="openCreate">Adicionar utilização</AppButton>
      </template>
    </AppEmptyState>

    <template v-else>
      <!-- semanal -->
      <section v-if="weeklyByDay.length" class="flex flex-col gap-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Semanal</h2>
        <div
          v-for="g in weeklyByDay"
          :key="g.day"
          class="overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800"
        >
          <h3 class="border-b border-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
            {{ g.long }}
          </h3>
          <ul class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="a in g.items" :key="a.id" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
              <span class="w-24 font-mono text-gray-600 dark:text-gray-300">{{ slotLabel(a) }}</span>
              <span class="text-gray-800 dark:text-gray-100">{{ roomLabel(a.roomId) }}</span>
              <span class="text-gray-500 dark:text-gray-400">{{ turmaLabel(a.turmaId) }}</span>
              <span v-if="canManage" class="ml-auto flex gap-1">
                <AppButton variant="ghost" size="sm" @click="openMove(a)">Mover</AppButton>
                <AppButton variant="ghost" size="sm" @click="confirmTarget = a">Remover</AppButton>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <!-- dia único -->
      <section v-if="singleByDate.length" class="flex flex-col gap-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Dia único</h2>
        <div
          v-for="g in singleByDate"
          :key="g.date"
          class="overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800"
        >
          <h3 class="flex items-center gap-2 border-b border-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
            {{ formatDateBR(g.date) }}
            <AppBadge variant="neutral" :label="dayLabel(g.items[0].timeSlot.day)" />
          </h3>
          <ul class="divide-y divide-gray-100 dark:divide-gray-700">
            <li v-for="a in g.items" :key="a.id" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
              <span class="w-24 font-mono text-gray-600 dark:text-gray-300">{{ slotLabel(a) }}</span>
              <span class="text-gray-800 dark:text-gray-100">{{ roomLabel(a.roomId) }}</span>
              <span class="text-gray-500 dark:text-gray-400">{{ turmaLabel(a.turmaId) }}</span>
              <span v-if="canManage" class="ml-auto flex gap-1">
                <AppButton variant="ghost" size="sm" @click="openMove(a)">Mover</AppButton>
                <AppButton variant="ghost" size="sm" @click="confirmTarget = a">Remover</AppButton>
              </span>
            </li>
          </ul>
        </div>
      </section>
    </template>

    <p v-if="canManage && activeTurmas.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
      Cadastre turmas no projeto antes de montar o cronograma.
    </p>

    <AllocationModal
      :open="modalOpen"
      :project-id="projectId"
      :turmas="activeTurmas"
      :rooms="activeRooms"
      :editing="editing"
      @saved="onSaved"
      @close="modalOpen = false"
    />

    <AppConfirmDialog
      :open="!!confirmTarget"
      title="Remover utilização"
      message="Tem certeza que deseja remover esta utilização do cronograma?"
      confirm-label="Remover"
      variant="danger"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="confirmTarget = null"
    />
  </div>
</template>
