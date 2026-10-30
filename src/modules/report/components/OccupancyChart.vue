<script setup lang="ts">
import { computed } from 'vue'
import AppBadge from '@/shared/components/AppBadge.vue'
import { SHIFT_LABELS, formatHours, formatPct } from '../helpers'
import type { BuildingOccupancy, RoomOccupancy, ShiftKey } from '@/types'

/**
 * Ocupação de horário por sala: barras horizontais de uma só cor numa escala fixa de 0 a 100%
 * da janela, agrupadas por prédio e da mais para a menos ocupada.
 */
const props = defineProps<{ rooms: RoomOccupancy[]; buildings: BuildingOccupancy[]; weeklyHours: number }>()
const emit = defineEmits<{ select: [roomId: string] }>()

const groups = computed(() =>
  props.buildings.map((b) => ({
    ...b,
    rooms: props.rooms
      .filter((r) => r.buildingId === b.buildingId)
      .sort((x, y) => y.occupancy - x.occupancy || x.roomName.localeCompare(y.roomName, 'pt', { numeric: true })),
  })),
)

const SHIFTS: ShiftKey[] = ['manha', 'tarde', 'noite']

function describe(r: RoomOccupancy): string {
  const shifts = SHIFTS.map((k) => `${SHIFT_LABELS[k]} ${formatPct(r.byShift[k])}`).join(' · ')
  const seat = r.seatUsage == null ? '' : ` · ${formatPct(r.seatUsage)} dos lugares`
  return `${r.roomName} (${r.buildingName}, ${r.capacity} lugares): ${formatPct(r.occupancy)} — ${formatHours(r.weeklyHours)} de ${formatHours(props.weeklyHours)} · ${shifts}${seat}`
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <section v-for="g in groups" :key="g.buildingId" :aria-label="`Salas do prédio ${g.buildingName}`">
      <h4 class="mb-2 flex items-baseline justify-between gap-2 border-b border-gray-100 pb-1 text-sm dark:border-gray-700">
        <span class="font-semibold text-gray-700 dark:text-gray-200">{{ g.buildingName || 'Sem prédio' }}</span>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          {{ g.rooms.length }} sala(s) · {{ formatPct(g.occupancy) }} de ocupação · {{ formatPct(g.seatUsage) }} dos lugares
        </span>
      </h4>

      <ul class="flex flex-col">
        <li v-for="r in g.rooms" :key="r.roomId">
          <button
            type="button"
            class="grid w-full grid-cols-[minmax(8rem,14rem)_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-gray-700/50"
            :title="describe(r)"
            :aria-label="`${describe(r)}. Abrir a grade da sala.`"
            @click="emit('select', r.roomId)"
          >
            <span class="flex min-w-0 items-center gap-1.5">
              <span class="truncate text-sm text-gray-800 dark:text-gray-100">{{ r.roomName }}</span>
              <span class="shrink-0 text-xs text-gray-400">{{ r.capacity }} lug.</span>
              <AppBadge v-if="!r.active" label="Inativa" />
              <AppBadge v-else-if="r.weeklyHours === 0" variant="warning" label="Ociosa" />
            </span>

            <!-- barra: escala fixa 0–100% da janela; o valor fica na ponta -->
            <span class="flex items-center gap-2">
              <span
                v-if="r.occupancy > 0"
                class="h-2.5 shrink-0 rounded-r bg-primary-500"
                :style="{ width: `calc((100% - 6.5rem) * ${Math.min(1, r.occupancy)})`, minWidth: '2px' }"
              />
              <span class="whitespace-nowrap text-xs tabular-nums text-gray-600 dark:text-gray-300">
                <span class="font-semibold text-gray-800 dark:text-gray-100">{{ formatPct(r.occupancy) }}</span>
                · {{ formatHours(r.weeklyHours) }}
              </span>
            </span>

            <span class="w-24 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
              {{ r.seatUsage == null ? '—' : `${formatPct(r.seatUsage)} lug.` }}
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
