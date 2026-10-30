<script setup lang="ts">
import { computed } from 'vue'
import { DAY_OPTIONS } from '@/modules/allocation/helpers'
import { heatIntensity } from '../helpers'
import type { OccupancyReport, WeekDay } from '@/types'

/** Salas ocupadas por dia × hora (aulas semanais): mostra o pico e onde há folga. */
const props = defineProps<{ heatmap: OccupancyReport['heatmap']; totalRooms: number }>()

const short = Object.fromEntries(DAY_OPTIONS.map((d) => [d.value, d.label])) as Record<WeekDay, string>
const long = Object.fromEntries(DAY_OPTIONS.map((d) => [d.value, d.long])) as Record<WeekDay, string>
const max = computed(() => Math.max(0, ...props.heatmap.busyRooms.flat()))
const hh = (h: number) => String(h).padStart(2, '0')

// primary-500 (#3b82f6) com opacidade proporcional: some contra a superfície nos dois temas
function cellStyle(value: number) {
  const alpha = heatIntensity(value, max.value)
  return alpha > 0 ? { backgroundColor: `rgb(59 130 246 / ${alpha.toFixed(2)})` } : {}
}
function cellLabel(day: WeekDay, hour: number, value: number) {
  return `${long[day]} ${hh(hour)}h–${hh(hour + 1)}h · ${value} de ${props.totalRooms} salas ocupadas`
}
const legend = [0.25, 0.5, 0.75, 1]
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="overflow-x-auto">
      <div
        class="grid min-w-[40rem] gap-0.5"
        :style="{ gridTemplateColumns: `2.5rem repeat(${heatmap.hours.length}, minmax(1.75rem, 1fr))` }"
        role="img"
        :aria-label="`Mapa de calor: salas ocupadas por dia e hora; no pico, ${max} de ${totalRooms} salas`"
      >
        <span />
        <span v-for="h in heatmap.hours" :key="`h${h}`" class="pb-1 text-center text-[11px] tabular-nums text-gray-400">{{ hh(h) }}</span>
        <template v-for="(day, d) in heatmap.days" :key="day">
          <span class="flex items-center text-xs text-gray-500 dark:text-gray-400">{{ short[day] }}</span>
          <span
            v-for="(h, i) in heatmap.hours"
            :key="`${day}${h}`"
            class="h-7 rounded bg-gray-100 dark:bg-gray-700/40"
            :style="cellStyle(heatmap.busyRooms[d][i])"
            :title="cellLabel(day, h, heatmap.busyRooms[d][i])"
          />
        </template>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
      <span class="flex items-center gap-1.5">
        Nenhuma
        <span class="h-3 w-5 rounded-sm bg-gray-100 dark:bg-gray-700/40" />
        <span v-for="a in legend" :key="a" class="h-3 w-5 rounded-sm" :style="{ backgroundColor: `rgb(59 130 246 / ${0.15 + 0.85 * a})` }" />
        {{ max }} sala(s) — pico
      </span>
      <details class="group">
        <summary class="cursor-pointer select-none hover:text-primary-600 dark:hover:text-primary-400">Ver como tabela</summary>
        <div class="mt-2 max-w-full overflow-x-auto">
          <table class="text-xs tabular-nums">
            <thead>
              <tr>
                <th class="px-1.5 py-1 text-left font-medium">Dia</th>
                <th v-for="h in heatmap.hours" :key="h" class="px-1.5 py-1 font-medium">{{ hh(h) }}h</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(day, d) in heatmap.days" :key="day" class="border-t border-gray-100 dark:border-gray-700">
                <th class="px-1.5 py-1 text-left font-medium">{{ short[day] }}</th>
                <td v-for="(h, i) in heatmap.hours" :key="h" class="px-1.5 py-1 text-center">{{ heatmap.busyRooms[d][i] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  </div>
</template>
