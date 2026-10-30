<script setup lang="ts">
import { computed } from 'vue'
import StatCard from '@/modules/dashboard/components/StatCard.vue'
import { SHIFT_LABELS, formatHours, formatPct } from '../helpers'
import type { OccupancyReport } from '@/types'

const props = defineProps<{ report: OccupancyReport; turmasPath: string }>()

const s = computed(() => props.report.summary)
const availableHours = computed(() => props.report.window.weeklyHours * s.value.rooms)
</script>

<template>
  <section class="flex flex-col gap-4" aria-label="Resumo da ocupação">
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard :value="formatPct(s.occupancy)" label="Ocupação de horário" />
      <StatCard :value="formatPct(s.seatUsage)" label="Aproveitamento de lugares" />
      <StatCard :value="`${s.usedRooms} de ${s.rooms}`" :label="s.idleRooms ? `Salas em uso · ${s.idleRooms} ociosa(s)` : 'Salas em uso'" />
      <StatCard :value="s.singleEvents" label="Eventos únicos (fora dos percentuais)" />
    </div>
    <p class="text-xs text-gray-500 dark:text-gray-400">
      {{ formatHours(s.weeklyHoursUsed) }} ocupadas de {{ formatHours(availableHours) }} disponíveis por semana ·
      {{ s.recurringEvents }} aula(s) semanal(is). O aproveitamento compara o nº de alunos com a capacidade da sala,
      ponderado pelas horas.
    </p>

    <p
      v-if="s.unknownStudentEvents > 0"
      class="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
    >
      <span aria-hidden="true">⚠</span>
      {{ s.unknownStudentEvents }} aula(s) de turmas sem nº de alunos ficaram fora do aproveitamento.
      <RouterLink :to="turmasPath" class="font-medium underline hover:no-underline">Preencher →</RouterLink>
    </p>

    <div class="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Por turno</h3>
      <ul class="grid gap-3 sm:grid-cols-3">
        <li v-for="shift in report.byShift" :key="shift.key" class="flex flex-col gap-1.5">
          <div class="flex items-baseline justify-between text-sm">
            <span class="text-gray-700 dark:text-gray-200">
              {{ SHIFT_LABELS[shift.key] }}
              <span class="text-xs text-gray-400">{{ shift.start }}–{{ shift.end }}</span>
            </span>
            <span class="font-semibold tabular-nums text-gray-800 dark:text-gray-100">{{ formatPct(shift.occupancy) }}</span>
          </div>
          <div
            class="h-2 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-950"
            role="meter"
            :aria-label="`Ocupação no turno ${SHIFT_LABELS[shift.key].toLowerCase()}`"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="Math.round(shift.occupancy * 100)"
          >
            <div class="h-full rounded-full bg-primary-500" :style="{ width: `${Math.min(100, shift.occupancy * 100)}%` }" />
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
