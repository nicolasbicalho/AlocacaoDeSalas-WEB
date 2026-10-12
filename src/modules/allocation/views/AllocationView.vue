<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import AppButton from '@/shared/components/AppButton.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import AppEmptyState from '@/shared/components/AppEmptyState.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import AllocationModal from '../components/AllocationModal.vue'
import ScheduleGrid from '../components/ScheduleGrid.vue'
import WeekStrip from '../components/WeekStrip.vue'
import { listAllocations, deleteAllocation } from '../services/allocation.service'
import { listTurmas } from '@/modules/turma/services/turma.service'
import { listRooms } from '@/modules/room/services/room.service'
import { listBuildings } from '@/modules/building/services/building.service'
import {
  dayLabel,
  categoryClasses,
  eventClasses,
  eventsOnDate,
  firstSchoolDay,
  formatDateBR,
  todayISO,
  weekDates,
  ROLE_LABELS,
  roleOf,
} from '../helpers'
import { useProjectContext } from '@/modules/project/projectContext'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { ITurma, IRoom, IBuilding, IAllocation, TurmaCategory, AllocationRole } from '@/types'
import { TURMA_CATEGORIES } from '@/shared/constants/turmaCategories'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const projectId = route.params.projectId as string
const { project } = useProjectContext()
const turmas = ref<ITurma[]>([])
const rooms = ref<IRoom[]>([])
const buildings = ref<IBuilding[]>([])
const allocations = ref<IAllocation[]>([])
const loading = ref(true)

const selectedDate = ref('')
const selectedBuilding = ref('')
const highlightId = ref<string | null>(null)
let highlightTimer: ReturnType<typeof setTimeout> | undefined

const modalOpen = ref(false)
const editing = ref<IAllocation | null>(null)
const prefill = ref<{
  turmaId?: string
  roomId?: string
  date?: string
  start?: string
  end?: string
  role?: AllocationRole
} | null>(null)
const confirmTarget = ref<IAllocation | null>(null)
const deleting = ref(false)

const semester = computed(() =>
  project.value?.startDate && project.value?.endDate
    ? { startDate: project.value.startDate, endDate: project.value.endDate }
    : null,
)

const canManage = computed(() => auth.isUser && project.value?.status !== 'closed')
const activeTurmas = computed(() => turmas.value.filter((t) => t.active))
const activeRooms = computed(() => rooms.value.filter((r) => r.active))

const turmaById = computed(() => new Map(turmas.value.map((t) => [t.id, t])))
const roomById = computed(() => new Map(rooms.value.map((r) => [r.id, r])))

const gridRooms = computed(() =>
  selectedBuilding.value
    ? activeRooms.value.filter((r) => r.buildingId === selectedBuilding.value)
    : activeRooms.value,
)

// filtro "Mostrar": todas, uma categoria de turma, ou só os eventos únicos
type ShowFilter = 'todas' | TurmaCategory | 'unicos'
const showFilter = ref<ShowFilter>('todas')

function matchesShowFilter(a: IAllocation): boolean {
  if (showFilter.value === 'todas') return true
  if (showFilter.value === 'unicos') return a.type === 'single'
  // categoria: eventos (recorrentes ou reposições) de turmas daquela categoria
  return !!a.turmaId && turmaById.value.get(a.turmaId)?.category === showFilter.value
}

// grade: eventos da data (recorrentes do dia da semana + únicos da data), conforme o filtro
const eventsForDate = computed(() =>
  semester.value && selectedDate.value
    ? eventsOnDate(allocations.value, selectedDate.value, semester.value).filter(matchesShowFilter)
    : [],
)

const countsForWeek = computed(() => {
  const counts: Record<string, number> = {}
  if (!semester.value || !selectedDate.value) return counts
  for (const d of weekDates(selectedDate.value)) {
    counts[d.date] = eventsOnDate(allocations.value, d.date, semester.value).filter(matchesShowFilter).length
  }
  return counts
})

// lista abaixo da grade: só os eventos únicos
const singles = computed(() =>
  allocations.value
    .filter((a) => a.type === 'single' && a.date)
    .sort((a, b) => (a.date! + a.timeSlot.start).localeCompare(b.date! + b.timeSlot.start)),
)

const stats = computed(() => ({
  weekly: allocations.value.filter((a) => a.type === 'weekly').length,
  single: singles.value.length,
  rooms: new Set(allocations.value.map((a) => a.roomId)).size,
  turmas: new Set(allocations.value.filter((a) => a.turmaId).map((a) => a.turmaId)).size,
  totalTurmas: activeTurmas.value.length,
}))

function eventTitle(a: IAllocation): string {
  if (a.turmaId) {
    const t = turmaById.value.get(a.turmaId)
    if (!t) return '—'
    // reposição só da prática (ou da teoria) numa turma com aula prática
    const role = t.practice ? ` (${ROLE_LABELS[roleOf(a)].toLowerCase()})` : ''
    return `${t.name}${role} — ${t.professor}`
  }
  return a.title ?? '—'
}
function roomLabel(id: string): string {
  const r = roomById.value.get(id)
  return r ? `${r.name} (${r.code})` : '—'
}

function initialDate(s: { startDate: string; endDate: string }): string {
  const today = todayISO()
  const base = today >= s.startDate && today <= s.endDate ? today : s.startDate
  return firstSchoolDay(base, s.endDate)
}

async function fetchAll() {
  loading.value = true
  try {
    // o projeto vem do ProjectShell (já validado); aqui só os dados do cronograma
    const [turmaRes, roomRes, buildingRes, allocs] = await Promise.all([
      listTurmas({ projectId, limit: 100 }),
      listRooms({ limit: 100 }),
      listBuildings({ limit: 100 }),
      listAllocations(projectId),
    ])
    turmas.value = turmaRes.data
    rooms.value = roomRes.data
    buildings.value = buildingRes.data
    allocations.value = allocs
    if (semester.value) selectedDate.value = initialDate(semester.value)
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar o cronograma.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

const queryString = (v: unknown) => (typeof v === 'string' && v ? v : undefined)

/**
 * Deep link (ex.: vindo da página inicial):
 * - `?event=<id>` → leva a grade até o evento único e o destaca
 * - `?date=YYYY-MM-DD` → seleciona a data
 * - `?turma=<id>&start=HH:MM&end=HH:MM` (+ date) → abre o modal para alocar aquele horário
 * A query é limpa depois, para não reabrir o modal ao recarregar.
 */
async function applyDeepLink() {
  const q = route.query
  const s = semester.value
  if (!s || Object.keys(q).length === 0) return

  const target = allocations.value.find((a) => a.id === queryString(q.event))
  const date = queryString(q.date)
  if (target) {
    await goToEvent(target)
  } else if (date && date >= s.startDate && date <= s.endDate) {
    selectedDate.value = firstSchoolDay(date, s.endDate)
  }

  const turmaId = queryString(q.turma)
  if (turmaId && canManage.value) {
    openCreate({
      turmaId,
      start: queryString(q.start),
      end: queryString(q.end),
      ...(queryString(q.role) === 'pratica' ? { role: 'pratica' as const } : {}),
    })
  }
  router.replace({ query: {} })
}

onMounted(async () => {
  await fetchAll()
  await nextTick()
  await applyDeepLink()
})
onBeforeUnmount(() => clearTimeout(highlightTimer))

/** Leva a grade até o evento único: seleciona a data, mostra todos os prédios e destaca. */
async function goToEvent(a: IAllocation) {
  if (!a.date) return
  selectedDate.value = a.date
  selectedBuilding.value = ''
  highlightId.value = a.id
  await nextTick()
  document
    .getElementById(`event-${a.id}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => (highlightId.value = null), 2200)
}

function openCreate(pf?: { turmaId?: string; roomId?: string; start?: string; end?: string; role?: AllocationRole }) {
  editing.value = null
  prefill.value = { date: selectedDate.value, ...pf }
  modalOpen.value = true
}
function openEdit(a: IAllocation) {
  editing.value = a
  prefill.value = { date: selectedDate.value }
  modalOpen.value = true
}

function onSaved(saved: IAllocation) {
  const wasEditing = !!editing.value
  const idx = allocations.value.findIndex((a) => a.id === saved.id)
  if (idx >= 0) allocations.value.splice(idx, 1, saved)
  else allocations.value.push(saved)
  modalOpen.value = false

  // mantém o evento salvo visível na grade
  if (saved.type === 'single' && saved.date) {
    selectedDate.value = saved.date
  } else if (semester.value) {
    const sameWeek = weekDates(selectedDate.value).find((d) => d.day === saved.timeSlot.day)
    if (sameWeek && sameWeek.date >= semester.value.startDate && sameWeek.date <= semester.value.endDate) {
      selectedDate.value = sameWeek.date
    }
  }
  ui.toast({ message: wasEditing ? 'Evento atualizado' : 'Evento adicionado', variant: 'success' })
}

async function confirmDelete() {
  if (!confirmTarget.value) return
  deleting.value = true
  try {
    await deleteAllocation(projectId, confirmTarget.value.id)
    allocations.value = allocations.value.filter((a) => a.id !== confirmTarget.value!.id)
    ui.toast({ message: 'Evento removido', variant: 'success' })
    confirmTarget.value = null
  } catch {
    ui.toast({ message: 'Erro ao remover o evento.', variant: 'error' })
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
    <AppEmptyState
      v-if="!semester"
      title="Semestre sem datas"
      description="Defina a data de início e de término do semestre no projeto para montar o cronograma."
    >
      <template #action>
        <AppButton variant="secondary" @click="router.push(`/projects/${project.id}`)">Abrir projeto</AppButton>
      </template>
    </AppEmptyState>

    <template v-else>
      <!-- estatísticas -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ stats.weekly }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Eventos recorrentes</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ stats.single }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Eventos únicos</p>
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
      </div>

      <!-- navegação + filtro -->
      <div class="flex flex-wrap items-end justify-between gap-3">
        <WeekStrip
          v-model="selectedDate"
          :start-date="semester.startDate"
          :end-date="semester.endDate"
          :counts="countsForWeek"
        />
        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model="showFilter"
            aria-label="Mostrar eventos"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="todas">Todos os eventos</option>
            <option v-for="c in TURMA_CATEGORIES" :key="c.value" :value="c.value">{{ c.plural }}</option>
            <option value="unicos">Só eventos únicos</option>
          </select>
          <select
            v-model="selectedBuilding"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Todos os prédios</option>
            <option v-for="b in buildings" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
          <AppButton v-if="canManage" @click="openCreate()">Adicionar evento</AppButton>
        </div>
      </div>

      <AppEmptyState
        v-if="gridRooms.length === 0"
        title="Nenhuma sala"
        description="Cadastre salas (e prédios) para montar o cronograma."
      />
      <template v-else>
        <ScheduleGrid
          :rooms="gridRooms"
          :buildings="buildings"
          :events="eventsForDate"
          :turma-by-id="turmaById"
          :can-manage="canManage"
          :group-by-building="!selectedBuilding"
          :highlight-id="highlightId"
          @add-at="openCreate($event)"
          @open="openEdit"
          @remove="confirmTarget = $event"
        />
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span v-for="c in TURMA_CATEGORIES" :key="c.value" class="flex items-center gap-1.5">
            <span class="h-3 w-3 rounded-sm" :class="categoryClasses(c.value).swatch" /> {{ c.plural }}
          </span>
          <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-sm bg-gradient-to-r from-amber-400 via-rose-500 to-sky-500" /> Único (cor escolhida)</span>
          <span v-if="canManage">Clique numa célula vazia para adicionar; clique num evento para editar.</span>
        </div>
      </template>

      <!-- lista: só eventos únicos -->
      <section class="flex flex-col gap-2">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Eventos únicos</h2>
        <p v-if="singles.length === 0" class="text-sm text-gray-400 dark:text-gray-500">
          Nenhum evento único no semestre.
        </p>
        <ul
          v-else
          class="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800"
        >
          <li v-for="a in singles" :key="a.id">
            <div
              role="button"
              tabindex="0"
              class="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:hover:bg-gray-700/50 dark:focus:bg-gray-700/50"
              :class="selectedDate === a.date ? 'bg-gray-50 dark:bg-gray-700/40' : ''"
              :title="'Ver na grade'"
              @click="goToEvent(a)"
              @keydown.enter="goToEvent(a)"
            >
              <span class="h-3 w-3 shrink-0 rounded-full" :class="eventClasses(a).swatch" />
              <span class="w-36 text-gray-700 dark:text-gray-200">
                {{ formatDateBR(a.date!) }} <span class="text-gray-400 dark:text-gray-500">{{ dayLabel(a.timeSlot.day).slice(0, 3) }}</span>
              </span>
              <span class="w-24 font-mono text-gray-600 dark:text-gray-300">{{ a.timeSlot.start }}–{{ a.timeSlot.end }}</span>
              <span class="font-medium text-gray-800 dark:text-gray-100">{{ eventTitle(a) }}</span>
              <span class="text-gray-500 dark:text-gray-400">{{ roomLabel(a.roomId) }}</span>
              <span v-if="canManage" class="ml-auto flex gap-1">
                <AppButton variant="ghost" size="sm" @click.stop="openEdit(a)">Editar</AppButton>
                <AppButton variant="ghost" size="sm" @click.stop="confirmTarget = a">Remover</AppButton>
              </span>
            </div>
          </li>
        </ul>
      </section>

      <p v-if="canManage && activeTurmas.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
        Sem turmas cadastradas: por enquanto só é possível criar eventos únicos de texto livre.
      </p>

      <AllocationModal
        :open="modalOpen"
        :project-id="projectId"
        :turmas="activeTurmas"
        :rooms="activeRooms"
        :buildings="buildings"
        :semester="semester"
        :editing="editing"
        :prefill="prefill"
        @saved="onSaved"
        @close="modalOpen = false"
      />
    </template>

    <AppConfirmDialog
      :open="!!confirmTarget"
      title="Remover evento"
      message="Tem certeza que deseja remover este evento do cronograma?"
      confirm-label="Remover"
      variant="danger"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="confirmTarget = null"
    />
  </div>
</template>
