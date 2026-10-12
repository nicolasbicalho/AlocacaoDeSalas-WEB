<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { isAxiosError } from 'axios'
import AppTable from '@/shared/components/AppTable.vue'
import AppPagination from '@/shared/components/AppPagination.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppEmptyState from '@/shared/components/AppEmptyState.vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import StudentCountCell from '../components/StudentCountCell.vue'
import { listTurmas, getTurmaCounts } from '../services/turma.service'
import { summarizeTurmaRooms } from '../helpers'
import { listAllocations } from '@/modules/allocation/services/allocation.service'
import { listRooms } from '@/modules/room/services/room.service'
import { listProfessors } from '@/modules/professor/services/professor.service'
import { DAY_OPTIONS, todayISO } from '@/modules/allocation/helpers'
import { nextDateForWeekday, referenceDate } from '@/modules/dashboard/helpers'
import { TURMA_CATEGORIES, categoryLabel, categoryPillClass } from '@/shared/constants/turmaCategories'
import { useProjectContext } from '@/modules/project/projectContext'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { IAllocation, IProfessor, IRoom, ITurma, TurmaCategory, TurmaCounts, WeekDay } from '@/types'

type Tab = TurmaCategory | 'todas'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const { project } = useProjectContext()

const projectId = route.params.projectId as string
const allocationPath = `/projects/${projectId}/allocation`

// aba e busca ficam na URL: voltar do detalhe de uma turma mantém o filtro
const VALID_TABS: Tab[] = ['todas', 'graduacao', 'pos', 'externa']
const initialTab = route.query.categoria as Tab
const tab = ref<Tab>(VALID_TABS.includes(initialTab) ? initialTab : 'todas')
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const appliedSearch = ref(search.value.trim())
const professorId = ref(typeof route.query.professor === 'string' ? route.query.professor : '')
const professors = ref<IProfessor[]>([])

const rows = ref<ITurma[]>([])
const loading = ref(false)
const page = ref(1)
const limit = 50
const total = ref(0)
const totalPages = ref(1)
const counts = ref<TurmaCounts | null>(null)

const allocations = ref<IAllocation[]>([])
const rooms = ref<IRoom[]>([])

const tabs = computed(() => [
  { value: 'todas' as Tab, label: 'Todas', count: counts.value?.total },
  ...TURMA_CATEGORIES.map((c) => ({ value: c.value as Tab, label: c.plural, count: counts.value?.[c.value] })),
])

const columns = computed(() => [
  { key: 'name', label: 'Disciplina' },
  { key: 'code', label: 'Código' },
  ...(tab.value === 'todas' ? [{ key: 'category', label: 'Categoria' }] : []),
  { key: 'professor', label: 'Professor' },
  { key: 'sector', label: 'Setor' },
  { key: 'schedule', label: 'Horários' },
  { key: 'studentCount', label: 'Nº alunos' },
  { key: 'rooms', label: 'Sala(s)' },
  { key: 'active', label: 'Status' },
  { key: 'actions', label: '' },
])

const roomById = computed(() => new Map(rooms.value.map((r) => [r.id, r])))
const summaries = computed(() => summarizeTurmaRooms(rows.value, allocations.value))
const dayShort = Object.fromEntries(DAY_OPTIONS.map((d) => [d.value, d.label])) as Record<WeekDay, string>

function asTurma(row: Record<string, unknown>): ITurma {
  return row as unknown as ITurma
}
function roomName(id: string): string {
  const r = roomById.value.get(id)
  return r ? r.name : '—'
}

/** Atalho "Alocar": cronograma na próxima data do horário pendente, com o modal preenchido. */
function allocateLink(turma: ITurma): RouteLocationRaw | null {
  const slot = summaries.value.get(turma.id)?.firstPending
  const p = project.value
  if (!slot || !p?.startDate || !p.endDate) return null
  const date = nextDateForWeekday(referenceDate(p.startDate, p.endDate, todayISO()), slot.day, p.endDate)
  return {
    path: allocationPath,
    query: { ...(date ? { date } : {}), turma: turma.id, start: slot.start, end: slot.end },
  }
}

async function fetchTurmas() {
  loading.value = true
  try {
    const res = await listTurmas({
      projectId,
      page: page.value,
      limit,
      ...(appliedSearch.value ? { search: appliedSearch.value } : {}),
      ...(tab.value !== 'todas' ? { category: tab.value } : {}),
      ...(professorId.value ? { professorId: professorId.value } : {}),
    })
    rows.value = res.data
    total.value = res.pagination.total
    totalPages.value = Math.max(1, res.pagination.totalPages)
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar turmas.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

async function fetchCounts() {
  try {
    counts.value = await getTurmaCounts({
      projectId,
      ...(appliedSearch.value ? { search: appliedSearch.value } : {}),
      ...(professorId.value ? { professorId: professorId.value } : {}),
    })
  } catch {
    counts.value = null
  }
}

// seletor de professor: todos do cadastro (inclusive desativados, que ainda podem ter turmas)
async function fetchProfessors() {
  try {
    professors.value = (await listProfessors({ limit: 100 })).data
  } catch {
    professors.value = []
  }
}

// salas alocadas: eventos do projeto + nomes das salas (uma vez; a lista só lê)
async function fetchRoomsData() {
  try {
    const [allocs, roomRes] = await Promise.all([listAllocations(projectId), listRooms({ limit: 100 })])
    allocations.value = allocs
    rooms.value = roomRes.data
  } catch {
    // a coluna Sala(s) fica vazia; o restante da lista continua funcionando
  }
}

function syncQuery() {
  router.replace({
    query: {
      ...(tab.value !== 'todas' ? { categoria: tab.value } : {}),
      ...(appliedSearch.value ? { q: appliedSearch.value } : {}),
      ...(professorId.value ? { professor: professorId.value } : {}),
    },
  })
}

// o ProjectShell já validou o projeto (existência e acesso)
onMounted(() => {
  fetchTurmas()
  fetchCounts()
  fetchRoomsData()
  fetchProfessors()
})

watch(professorId, () => {
  page.value = 1
  syncQuery()
  fetchTurmas()
  fetchCounts()
})

watch(tab, () => {
  page.value = 1
  syncQuery()
  fetchTurmas()
})

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    appliedSearch.value = value.trim()
    page.value = 1
    syncQuery()
    fetchTurmas()
    fetchCounts()
  }, 300)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

function changePage(target: number) {
  page.value = target
  fetchTurmas()
}

function onCountUpdated(updated: ITurma) {
  const idx = rows.value.findIndex((t) => t.id === updated.id)
  if (idx >= 0) rows.value.splice(idx, 1, updated)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <!-- abas por categoria -->
      <div class="flex flex-wrap gap-1" role="tablist" aria-label="Categoria">
        <button
          v-for="t in tabs"
          :key="t.value"
          type="button"
          role="tab"
          :aria-selected="tab === t.value"
          class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          :class="tab === t.value ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'"
          @click="tab = t.value"
        >
          {{ t.label }}
          <span
            v-if="t.count != null"
            class="rounded-full px-1.5 text-xs"
            :class="tab === t.value ? 'bg-white/25' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200'"
          >
            {{ t.count }}
          </span>
        </button>
        <RouterLink
          :to="allocationPath"
          class="flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400"
          title="Eventos únicos (palestras, defesas, reposições) ficam no cronograma"
        >
          Eventos únicos →
        </RouterLink>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="professorId"
          aria-label="Filtrar por professor"
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Todos os professores</option>
          <option v-for="p in professors" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <input
          v-model="search"
          type="search"
          placeholder="Buscar disciplina, professor, código, setor"
          aria-label="Buscar turmas"
          class="w-80 max-w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <AppButton v-if="auth.isUser" @click="router.push(`/projects/${projectId}/turmas/new`)">Nova turma</AppButton>
      </div>
    </div>

    <AppEmptyState
      v-if="!loading && rows.length === 0 && !appliedSearch && !professorId && tab === 'todas'"
      title="Nenhuma turma neste projeto"
      :description="auth.isUser ? 'Cadastre a primeira turma do projeto.' : 'Nenhuma turma cadastrada.'"
    >
      <template #action>
        <AppButton v-if="auth.isUser" @click="router.push(`/projects/${projectId}/turmas/new`)">Nova turma</AppButton>
      </template>
    </AppEmptyState>

    <template v-else>
      <AppTable
        :columns="columns"
        :rows="rows"
        :loading="loading"
        :empty-message="appliedSearch ? `Nenhuma turma encontrada para “${appliedSearch}”.` : professorId ? 'Nenhuma turma deste professor nesta categoria.' : 'Nenhuma turma nesta categoria.'"
      >
        <template #cell-name="{ row }">
          <span class="font-medium text-gray-800 dark:text-gray-100">{{ asTurma(row).name }}</span>
          <span
            v-if="asTurma(row).notes"
            class="ml-1 cursor-help text-xs text-gray-400"
            :title="asTurma(row).notes"
            aria-label="Possui anotações"
          >📝</span>
        </template>
        <template #cell-code="{ row }">{{ asTurma(row).code || '—' }}</template>
        <template #cell-category="{ row }">
          <span class="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium" :class="categoryPillClass(asTurma(row).category)">
            {{ categoryLabel(asTurma(row).category) }}
          </span>
        </template>
        <template #cell-sector="{ row }">{{ asTurma(row).sector || '—' }}</template>
        <template #cell-schedule="{ row }">
          <div class="flex flex-col whitespace-nowrap text-xs text-gray-600 dark:text-gray-300">
            <span v-for="(s, i) in asTurma(row).schedule" :key="i">{{ dayShort[s.day] }} {{ s.start }}–{{ s.end }}</span>
            <span v-if="asTurma(row).schedule.length === 0" class="text-gray-400">—</span>
          </div>
        </template>
        <template #cell-studentCount="{ row }">
          <StudentCountCell :turma="asTurma(row)" :readonly="!auth.isUser" @updated="onCountUpdated" />
        </template>
        <template #cell-rooms="{ row }">
          <template v-for="s in [summaries.get(asTurma(row).id)]" :key="asTurma(row).id">
            <div v-if="s" class="flex flex-col gap-0.5 text-sm">
              <span v-if="s.total === 0" class="text-xs text-gray-400">sem horários</span>
              <template v-else>
                <span v-if="s.roomIds.length" class="text-gray-800 dark:text-gray-100">
                  {{ s.roomIds.map(roomName).join(', ') }}
                </span>
                <span class="flex items-center gap-2 whitespace-nowrap text-xs">
                  <span
                    class="rounded-full px-1.5 py-0.5 font-medium"
                    :class="s.covered === s.total
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'"
                  >
                    {{ s.covered === 0 ? 'sem sala' : `${s.covered}/${s.total} horários` }}
                  </span>
                  <RouterLink
                    v-if="auth.isUser && s.covered < s.total && allocateLink(asTurma(row))"
                    :to="allocateLink(asTurma(row))!"
                    class="font-medium text-primary-700 hover:underline dark:text-primary-400"
                  >
                    Alocar →
                  </RouterLink>
                </span>
              </template>
            </div>
          </template>
        </template>
        <template #cell-active="{ row }">
          <AppBadge :variant="asTurma(row).active ? 'success' : 'neutral'" :label="asTurma(row).active ? 'Ativa' : 'Inativa'" />
        </template>
        <template #cell-actions="{ row }">
          <AppButton variant="ghost" size="sm" @click="router.push(`/projects/${projectId}/turmas/${asTurma(row).id}`)">Ver</AppButton>
        </template>
      </AppTable>

      <AppPagination :page="page" :total-pages="totalPages" :total="total" @update:page="changePage" />
    </template>
  </div>
</template>
