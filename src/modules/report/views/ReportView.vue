<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import AppButton from '@/shared/components/AppButton.vue'
import AppEmptyState from '@/shared/components/AppEmptyState.vue'
import OccupancySummary from '../components/OccupancySummary.vue'
import OccupancyChart from '../components/OccupancyChart.vue'
import OccupancyHeatmap from '../components/OccupancyHeatmap.vue'
import WeeklyScheduleTable from '../components/WeeklyScheduleTable.vue'
import ExportMenu, { type ExportKind } from '../components/ExportMenu.vue'
import { getOccupancy } from '../services/report.service'
import {
  formatHours,
  formatPct,
  professorSchedule,
  professorsWithTurmas,
  roomSchedule,
  roomSingleEvents,
  windowText,
} from '../helpers'
import { downloadOccupancy } from '../export'
import { printElement } from '../print'
import { downloadTimetable, fetchAllTurmas } from '@/modules/turma/timetable.export'
import { listAllocations } from '@/modules/allocation/services/allocation.service'
import { listRooms } from '@/modules/room/services/room.service'
import { listBuildings } from '@/modules/building/services/building.service'
import { listProfessors } from '@/modules/professor/services/professor.service'
import { formatDateBR } from '@/modules/allocation/helpers'
import { featureLabel } from '@/shared/constants/roomFeatures'
import { useProjectContext } from '@/modules/project/projectContext'
import { useUiStore } from '@/stores/ui'
import type { IAllocation, IBuilding, IProfessor, IRoom, ITurma, OccupancyReport } from '@/types'

type Tab = 'occupancy' | 'room' | 'professor'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const { project } = useProjectContext()

const projectId = route.params.projectId as string
const base = `/projects/${projectId}`
const queryText = (v: unknown) => (typeof v === 'string' ? v : '')

// estado na URL: dá para compartilhar o link e voltar com o navegador
const TABS: { value: Tab; label: string }[] = [
  { value: 'occupancy', label: 'Ocupação' },
  { value: 'room', label: 'Grade por sala' },
  { value: 'professor', label: 'Grade por professor' },
]
const initialTab = route.query.tab as Tab
const tab = ref<Tab>(TABS.some((t) => t.value === initialTab) ? initialTab : 'occupancy')
const buildingId = ref(queryText(route.query.building))
const saturday = ref(route.query.saturday === '1')
const roomId = ref(queryText(route.query.room))
const professorId = ref(queryText(route.query.professor))

function syncQuery() {
  router.replace({
    query: {
      ...(tab.value !== 'occupancy' ? { tab: tab.value } : {}),
      ...(buildingId.value ? { building: buildingId.value } : {}),
      ...(saturday.value ? { saturday: '1' } : {}),
      ...(tab.value === 'room' && roomId.value ? { room: roomId.value } : {}),
      ...(tab.value === 'professor' && professorId.value ? { professor: professorId.value } : {}),
    },
  })
}

// ---------------- ocupação ----------------

const buildings = ref<IBuilding[]>([])
const report = ref<OccupancyReport | null>(null)
const loadingReport = ref(false)
const reportError = ref(false)

const instituteBuildings = computed(() =>
  buildings.value
    .filter((b) => b.instituteId === project.value?.instituteId)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt', { numeric: true })),
)
const filterLabel = computed(
  () => instituteBuildings.value.find((b) => b.id === buildingId.value)?.name ?? 'Todos os prédios',
)

async function fetchReport() {
  loadingReport.value = true
  reportError.value = false
  try {
    report.value = await getOccupancy(projectId, { buildingId: buildingId.value || undefined, saturday: saturday.value })
  } catch (err) {
    if (!isAxiosError(err)) throw err
    reportError.value = true
    // prédio da URL que não existe mais: volta para "Todos"
    if (err.response?.data?.error?.code === 'BUILDING_NOT_FOUND') buildingId.value = ''
  } finally {
    loadingReport.value = false
  }
}

async function fetchBuildings() {
  try {
    buildings.value = (await listBuildings({ limit: 100 })).data
  } catch {
    buildings.value = []
  }
}

// ---------------- grades (dados carregados uma vez, ao abrir a primeira grade) ----------------

interface GridData {
  turmas: ITurma[]
  allocations: IAllocation[]
  rooms: IRoom[]
  professors: IProfessor[]
}
const grid = ref<GridData | null>(null)
const loadingGrid = ref(false)
const gridError = ref(false)

async function ensureGridData() {
  if (grid.value || loadingGrid.value) return
  loadingGrid.value = true
  gridError.value = false
  try {
    const [turmas, allocations, roomRes, professorRes] = await Promise.all([
      fetchAllTurmas(projectId),
      listAllocations(projectId),
      listRooms({ limit: 100 }),
      listProfessors({ limit: 100 }),
    ])
    grid.value = { turmas, allocations, rooms: roomRes.data, professors: professorRes.data }
  } catch (err) {
    if (!isAxiosError(err)) throw err
    gridError.value = true
  } finally {
    loadingGrid.value = false
  }
}

const buildingName = computed(() => new Map(buildings.value.map((b) => [b.id, b.name])))

/** Salas do instituto do projeto: ativas + inativas que têm eventos, por prédio e nome. */
const roomOptions = computed(() => {
  if (!grid.value) return []
  const withEvents = new Set(grid.value.allocations.map((a) => a.roomId))
  return grid.value.rooms
    .filter((r) => r.instituteId === project.value?.instituteId && (r.active || withEvents.has(r.id)))
    .map((r) => ({ room: r, building: buildingName.value.get(r.buildingId) ?? '' }))
    .sort(
      (a, b) =>
        a.building.localeCompare(b.building, 'pt', { numeric: true }) ||
        a.room.name.localeCompare(b.room.name, 'pt', { numeric: true }),
    )
})
const roomGroups = computed(() => {
  const groups = new Map<string, IRoom[]>()
  for (const { room, building } of roomOptions.value) groups.set(building, [...(groups.get(building) ?? []), room])
  return [...groups.entries()].map(([building, rooms]) => ({ building, rooms }))
})
const selectedRoom = computed(() => roomOptions.value.find((o) => o.room.id === roomId.value)?.room ?? null)
const selectedRoomOccupancy = computed(() => report.value?.rooms.find((r) => r.roomId === roomId.value) ?? null)
const roomSched = computed(() => (grid.value && roomId.value ? roomSchedule(roomId.value, grid.value.allocations, grid.value.turmas) : null))
const roomSingles = computed(() =>
  grid.value && roomId.value ? roomSingleEvents(roomId.value, grid.value.allocations, grid.value.turmas) : [],
)

const professorOptions = computed(() => (grid.value ? professorsWithTurmas(grid.value.professors, grid.value.turmas) : []))
const selectedProfessor = computed(() => professorOptions.value.find((p) => p.id === professorId.value) ?? null)
const professorSched = computed(() =>
  grid.value && professorId.value
    ? professorSchedule(professorId.value, grid.value.turmas, grid.value.allocations, grid.value.rooms)
    : null,
)
const turmasWithoutProfessor = computed(
  () => grid.value?.turmas.filter((t) => t.active && !t.professorId).length ?? 0,
)

// sem seleção (ou seleção inválida), a primeira opção da lista
watch(roomOptions, (opts) => {
  if (opts.length && !opts.some((o) => o.room.id === roomId.value)) roomId.value = opts[0].room.id
})
watch(professorOptions, (opts) => {
  if (opts.length && !opts.some((p) => p.id === professorId.value)) professorId.value = opts[0].id
})

// ---------------- navegação ----------------

watch(tab, (value) => {
  syncQuery()
  if (value !== 'occupancy') ensureGridData()
})
watch([buildingId, saturday], () => {
  syncQuery()
  fetchReport()
})
watch([roomId, professorId], () => syncQuery())

function openRoom(id: string) {
  roomId.value = id
  tab.value = 'room'
}

onMounted(() => {
  fetchBuildings()
  fetchReport()
  if (tab.value !== 'occupancy') ensureGridData()
})

const period = computed(() =>
  project.value?.startDate ? `${formatDateBR(project.value.startDate)} a ${formatDateBR(project.value.endDate)}` : '',
)

// ---------------- exportar e imprimir ----------------

const exporting = ref<ExportKind | null>(null)
async function onExport(kind: ExportKind) {
  if (!project.value) return
  exporting.value = kind
  try {
    if (kind === 'timetable') await downloadTimetable(project.value)
    else if (report.value) await downloadOccupancy(project.value, report.value, filterLabel.value)
  } catch {
    ui.toast({
      message: kind === 'timetable' ? 'Não foi possível gerar o quadro de horários.' : 'Não foi possível gerar a planilha de ocupação.',
      variant: 'error',
    })
  } finally {
    exporting.value = null
  }
}

const printArea = ref<HTMLElement | null>(null)
function onPrint() {
  if (printArea.value) printElement(printArea.value)
}

const selectClass =
  'rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-1" role="tablist" aria-label="Relatório">
        <button
          v-for="t in TABS"
          :key="t.value"
          type="button"
          role="tab"
          :aria-selected="tab === t.value"
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          :class="tab === t.value ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'"
          @click="tab = t.value"
        >
          {{ t.label }}
        </button>
      </div>
      <ExportMenu :busy="exporting" :occupancy-disabled="!report" @export="onExport" />
    </div>

    <!-- ================= Ocupação ================= -->
    <template v-if="tab === 'occupancy'">
      <div class="flex flex-wrap items-center gap-3">
        <select v-model="buildingId" aria-label="Filtrar por prédio" :class="selectClass">
          <option value="">Todos os prédios</option>
          <option v-for="b in instituteBuildings" :key="b.id" :value="b.id">{{ b.name }}</option>
        </select>
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input v-model="saturday" type="checkbox" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          Incluir sábado
        </label>
        <span v-if="report" class="text-xs text-gray-500 dark:text-gray-400">{{ windowText(report.window) }} · só aulas semanais</span>
      </div>

      <div v-if="loadingReport && !report" class="flex flex-col gap-3" aria-busy="true">
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div v-for="i in 4" :key="i" class="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        </div>
        <div class="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>

      <AppEmptyState v-else-if="reportError" title="Não foi possível carregar o relatório de ocupação.">
        <template #action><AppButton variant="secondary" @click="fetchReport">Tentar de novo</AppButton></template>
      </AppEmptyState>

      <template v-else-if="report">
        <AppEmptyState
          v-if="report.summary.rooms === 0"
          title="Nenhuma sala neste filtro"
          description="Cadastre as salas nos prédios do instituto para acompanhar a ocupação."
        >
          <template #action><AppButton variant="secondary" @click="router.push('/buildings')">Ver prédios</AppButton></template>
        </AppEmptyState>

        <AppEmptyState
          v-else-if="report.summary.recurringEvents === 0"
          title="Nenhuma aula semanal no cronograma ainda."
          description="A ocupação aparece aqui assim que as turmas tiverem sala — pela alocação manual ou automática."
        >
          <template #action><AppButton variant="secondary" @click="router.push(`${base}/allocation`)">Ir para o Cronograma</AppButton></template>
        </AppEmptyState>

        <div v-else class="flex flex-col gap-4" :class="loadingReport ? 'opacity-60 transition-opacity' : ''">
          <OccupancySummary :report="report" :turmas-path="`${base}/turmas`" />

          <section class="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <header class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Ocupação por sala</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                barra = horas com aula ÷ {{ formatHours(report.window.weeklyHours) }} da semana · à direita, aproveitamento de lugares · clique para ver a grade
              </p>
            </header>
            <OccupancyChart
              :rooms="report.rooms"
              :buildings="report.byBuilding"
              :weekly-hours="report.window.weeklyHours"
              @select="openRoom"
            />
          </section>

          <section class="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <header class="mb-3">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Salas ocupadas por dia e hora</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">quanto mais escuro, mais salas em uso ao mesmo tempo (de {{ report.summary.rooms }})</p>
            </header>
            <OccupancyHeatmap :heatmap="report.heatmap" :total-rooms="report.summary.rooms" />
          </section>
        </div>
      </template>
    </template>

    <!-- ================= Grades ================= -->
    <template v-else>
      <div v-if="loadingGrid" class="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" aria-busy="true" />

      <AppEmptyState v-else-if="gridError" title="Não foi possível carregar as grades.">
        <template #action><AppButton variant="secondary" @click="ensureGridData">Tentar de novo</AppButton></template>
      </AppEmptyState>

      <!-- por sala -->
      <template v-else-if="grid && tab === 'room'">
        <AppEmptyState v-if="roomOptions.length === 0" title="Nenhuma sala cadastrada no instituto." />
        <template v-else>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <select v-model="roomId" aria-label="Sala" :class="selectClass">
              <optgroup v-for="g in roomGroups" :key="g.building" :label="g.building || 'Sem prédio'">
                <option v-for="r in g.rooms" :key="r.id" :value="r.id">{{ r.name }}{{ r.active ? '' : ' (inativa)' }}</option>
              </optgroup>
            </select>
            <AppButton variant="secondary" @click="onPrint">Imprimir</AppButton>
          </div>

          <div v-if="selectedRoom && roomSched" ref="printArea" class="flex flex-col gap-3">
            <header>
              <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
                {{ selectedRoom.name }} · {{ buildingName.get(selectedRoom.buildingId) }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ project?.name }}{{ period ? ` · ${period}` : '' }} · {{ selectedRoom.capacity }} lugares
                <template v-if="selectedRoom.features.length"> · {{ selectedRoom.features.map(featureLabel).join(', ') }}</template>
                <template v-if="selectedRoomOccupancy">
                  · ocupação {{ formatPct(selectedRoomOccupancy.occupancy) }} ({{ formatHours(selectedRoomOccupancy.weeklyHours) }}/semana)
                </template>
              </p>
            </header>
            <WeeklyScheduleTable :schedule="roomSched" empty-message="Nenhuma aula semanal nesta sala." />

            <section v-if="roomSingles.length">
              <h4 class="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-200">Eventos únicos</h4>
              <ul class="flex flex-col gap-1 text-sm">
                <li v-for="e in roomSingles" :key="e.id">
                  <RouterLink
                    :to="{ path: `${base}/allocation`, query: { event: e.id } }"
                    class="text-gray-700 hover:text-primary-700 hover:underline dark:text-gray-200 dark:hover:text-primary-400"
                  >
                    <span class="tabular-nums">{{ formatDateBR(e.date) }} · {{ e.start }}–{{ e.end }}</span> · {{ e.label }}
                  </RouterLink>
                </li>
              </ul>
            </section>
          </div>
        </template>
      </template>

      <!-- por professor -->
      <template v-else-if="grid && tab === 'professor'">
        <AppEmptyState
          v-if="professorOptions.length === 0"
          title="Nenhuma turma do projeto está ligada ao cadastro de professores."
          description="Ao salvar uma turma com o nome do professor, ela é associada ao cadastro."
        />
        <template v-else>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <select v-model="professorId" aria-label="Professor" :class="selectClass">
              <option v-for="p in professorOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <AppButton variant="secondary" @click="onPrint">Imprimir</AppButton>
          </div>
          <p v-if="turmasWithoutProfessor" class="text-xs text-gray-500 dark:text-gray-400">
            {{ turmasWithoutProfessor }} turma(s) sem professor no cadastro não aparecem aqui (estão no quadro de horários).
          </p>

          <div v-if="selectedProfessor && professorSched" ref="printArea" class="flex flex-col gap-3">
            <header>
              <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
                <RouterLink :to="`/professors/${selectedProfessor.id}`" class="hover:text-primary-700 hover:underline dark:hover:text-primary-400">
                  {{ selectedProfessor.name }}
                </RouterLink>
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ project?.name }}{{ period ? ` · ${period}` : '' }} · "sem sala" em destaque = horário ainda não alocado
              </p>
            </header>
            <WeeklyScheduleTable :schedule="professorSched" empty-message="As turmas deste professor ainda não têm horários." />
          </div>
        </template>
      </template>
    </template>
  </div>
</template>
