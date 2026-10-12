<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/shared/components/AppButton.vue'
import { DAY_OPTIONS, ROLE_LABELS } from '../helpers'
import { preferenceBadge, type Tone } from '../suggestions'
import { REASON_LABELS, STRATEGY_SHORT, METRIC_ROWS, percent, winners, unallocatedLink } from '../autoAllocation'
import type {
  AutoAllocationResult,
  AutoComparison,
  AutoMetrics,
  AutoStrategy,
  IBuilding,
  IProject,
  IRoom,
  ITurma,
  WeekDay,
} from '@/types'

const props = defineProps<{
  project: IProject
  turmas: ITurma[]
  rooms: IRoom[]
  buildings: IBuilding[]
  /** simulação ou resultado aplicado */
  result?: AutoAllocationResult | null
  /** comparação das estratégias (só métricas) */
  comparison?: AutoComparison | null
  applied?: boolean
  applying?: boolean
  canApply?: boolean
}>()

const emit = defineEmits<{ apply: []; discard: [] }>()

const turmaById = computed(() => new Map(props.turmas.map((t) => [t.id, t])))
const roomById = computed(() => new Map(props.rooms.map((r) => [r.id, r])))
const buildingById = computed(() => new Map(props.buildings.map((b) => [b.id, b.name])))
const dayShort = Object.fromEntries(DAY_OPTIONS.map((d) => [d.value, d.label])) as Record<WeekDay, string>

const showPlan = ref(false)

function turmaLabel(id: string): string {
  const t = turmaById.value.get(id)
  return t ? `${t.name}${t.code ? ` (${t.code})` : ''}` : '—'
}
function roleTag(turmaId: string, role?: string): string {
  return role && turmaById.value.get(turmaId)?.practice ? ` · ${ROLE_LABELS[role as 'teorica' | 'pratica']}` : ''
}
function roomLabel(id: string): string {
  const r = roomById.value.get(id)
  if (!r) return '—'
  const building = buildingById.value.get(r.buildingId)
  return `${r.name}${building ? ` · ${building}` : ''} (${r.capacity} lugares)`
}

const stats = computed(() => {
  const m = props.result?.metrics
  if (!m) return []
  return [
    { label: 'Horários alocados', value: `${m.allocated} de ${m.demands}` },
    { label: 'Ficam sem sala', value: String(m.unallocated), warn: m.unallocated > 0 },
    { label: 'Turmas puladas (sem nº de alunos)', value: String(m.skippedTurmas), warn: m.skippedTurmas > 0 },
    { label: 'Lugares desperdiçados', value: String(m.wastedSeats) },
    { label: 'Ocupação média', value: percent(m.averageOccupancy) },
    { label: 'Preferências atendidas', value: `${m.preferencesMet} de ${m.preferencesTotal}` },
  ]
})

const comparisonRows = computed(() => {
  if (!props.comparison) return []
  const by = Object.fromEntries(
    Object.entries(props.comparison).map(([s, v]) => [s, v.metrics]),
  ) as Record<AutoStrategy, AutoMetrics>
  return METRIC_ROWS.map((row) => ({
    ...row,
    winners: winners(by, row.key, row.better),
    values: (Object.keys(by) as AutoStrategy[]).map((s) => ({
      strategy: s,
      text: row.format ? row.format(by[s]) : String(by[s][row.key]),
    })),
  }))
})

const TONE_CLASSES: Record<Tone, string> = {
  ok: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  bad: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  unknown: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 7.3 comparação -->
    <section v-if="comparisonRows.length" aria-label="Comparação de estratégias" class="flex flex-col gap-2">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Comparação de estratégias</h3>
      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 text-left text-gray-600 dark:bg-gray-900/40 dark:text-gray-400">
            <tr>
              <th class="px-3 py-2 font-medium">Métrica</th>
              <th v-for="v in comparisonRows[0].values" :key="v.strategy" class="px-3 py-2 font-medium">{{ STRATEGY_SHORT[v.strategy] }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-gray-700 dark:divide-gray-700 dark:text-gray-200">
            <tr v-for="row in comparisonRows" :key="row.key">
              <td class="px-3 py-2">{{ row.label }}</td>
              <td
                v-for="v in row.values"
                :key="v.strategy"
                class="px-3 py-2"
                :class="row.winners.includes(v.strategy) ? 'font-semibold text-green-700 dark:text-green-400' : ''"
              >
                {{ v.text }}<span v-if="row.winners.includes(v.strategy)" class="ml-1" aria-label="melhor">✓</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400">Mesmos dados, só muda a ordem em que as turmas são processadas. Nada foi gravado.</p>
    </section>

    <!-- 7.2 resultado -->
    <section v-if="result" aria-label="Resultado da alocação automática" class="flex flex-col gap-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {{ applied ? 'Alocação aplicada' : 'Simulação' }} · {{ STRATEGY_SHORT[result.strategy] }}
        <span v-if="applied && result.removedAuto" class="font-normal text-gray-500 dark:text-gray-400">
          · {{ result.removedAuto }} automática(s) anteriores substituídas
        </span>
      </h3>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="s in stats"
          :key="s.label"
          class="rounded-lg border px-3 py-2"
          :class="s.warn ? 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30' : 'border-gray-200 dark:border-gray-700'"
        >
          <p class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ s.value }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</p>
        </div>
      </div>

      <div v-if="result.unallocated.length" class="flex flex-col gap-1">
        <h4 class="text-sm font-medium text-amber-800 dark:text-amber-300">
          Ficam sem sala ({{ result.metrics.unallocated }})<template v-if="result.metrics.skippedTurmas">
            · turmas puladas ({{ result.metrics.skippedTurmas }})</template>
        </h4>
        <ul class="divide-y divide-gray-100 rounded-lg border border-amber-200 text-sm dark:divide-gray-700 dark:border-amber-900/50">
          <li v-for="(u, i) in result.unallocated" :key="i" class="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 py-2">
            <span class="font-medium text-gray-800 dark:text-gray-100">{{ turmaLabel(u.turmaId) }}{{ roleTag(u.turmaId, u.role) }}</span>
            <span v-if="u.timeSlot" class="text-gray-500 dark:text-gray-400">{{ dayShort[u.timeSlot.day] }} {{ u.timeSlot.start }}–{{ u.timeSlot.end }}</span>
            <span class="text-amber-800 dark:text-amber-300">{{ REASON_LABELS[u.reason] }}</span>
            <RouterLink
              v-if="u.reason === 'NO_STUDENT_COUNT'"
              :to="`/projects/${project.id}/turmas`"
              class="ml-auto text-xs font-medium text-primary-700 hover:underline dark:text-primary-400"
            >
              Preencher na aba Turmas →
            </RouterLink>
            <RouterLink
              v-else-if="applied && unallocatedLink(project, u)"
              :to="unallocatedLink(project, u)!"
              class="ml-auto text-xs font-medium text-primary-700 hover:underline dark:text-primary-400"
            >
              Alocar →
            </RouterLink>
          </li>
        </ul>
      </div>
      <p v-else class="text-sm text-green-700 dark:text-green-400">✓ Todos os horários pendentes encontraram sala.</p>

      <div v-if="result.allocations.length" class="flex flex-col gap-1">
        <button
          type="button"
          class="w-fit text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
          :aria-expanded="showPlan"
          @click="showPlan = !showPlan"
        >
          {{ showPlan ? '▾' : '▸' }} {{ applied ? 'Alocados' : 'Vai alocar' }} ({{ result.allocations.length }})
        </button>
        <div v-if="showPlan" class="max-h-80 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table class="min-w-full text-sm">
            <tbody class="divide-y divide-gray-100 text-gray-700 dark:divide-gray-700 dark:text-gray-200">
              <tr v-for="(a, i) in result.allocations" :key="i">
                <td class="px-3 py-1.5 font-medium">{{ turmaLabel(a.turmaId) }}{{ roleTag(a.turmaId, a.role) }}</td>
                <td class="whitespace-nowrap px-3 py-1.5 text-gray-500 dark:text-gray-400">{{ dayShort[a.timeSlot.day] }} {{ a.timeSlot.start }}–{{ a.timeSlot.end }}</td>
                <td class="px-3 py-1.5">{{ roomLabel(a.roomId) }}</td>
                <td class="px-3 py-1.5">
                  <span class="flex flex-wrap gap-1">
                    <span
                      v-for="p in a.preferences"
                      :key="p.key"
                      class="rounded-full px-1.5 py-0.5 text-xs"
                      :class="TONE_CLASSES[preferenceBadge(p, roomById.get(a.roomId) ?? {}).tone]"
                    >
                      {{ preferenceBadge(p, roomById.get(a.roomId) ?? {}).text }}
                    </span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-2">
        <AppButton variant="secondary" :disabled="applying" @click="emit('discard')">{{ applied ? 'Fechar' : 'Descartar' }}</AppButton>
        <AppButton v-if="!applied && canApply" :disabled="result.allocations.length === 0" :loading="applying" @click="emit('apply')">
          Aplicar ({{ result.allocations.length }} evento{{ result.allocations.length === 1 ? '' : 's' }})
        </AppButton>
      </div>
    </section>
  </div>
</template>
