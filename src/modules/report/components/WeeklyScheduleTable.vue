<script setup lang="ts">
import { DAY_OPTIONS } from '@/modules/allocation/helpers'
import type { WeeklySchedule } from '../helpers'
import type { WeekDay } from '@/types'

/** Grade semanal: faixas de horário nas linhas, dias nas colunas (como o quadro de horários). */
defineProps<{ schedule: WeeklySchedule; emptyMessage: string }>()

const long = Object.fromEntries(DAY_OPTIONS.map((d) => [d.value, d.long])) as Record<WeekDay, string>
</script>

<template>
  <p
    v-if="schedule.bands.length === 0"
    class="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400"
  >
    {{ emptyMessage }}
  </p>
  <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
    <table class="w-full min-w-[48rem] table-fixed border-collapse text-sm">
      <thead class="bg-gray-50 dark:bg-gray-900/40">
        <tr>
          <th scope="col" class="w-28 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Horário</th>
          <th
            v-for="day in schedule.days"
            :key="day"
            scope="col"
            class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            {{ long[day] }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="band in schedule.bands" :key="`${band.start}-${band.end}`" class="border-t border-gray-100 align-top dark:border-gray-700">
          <th scope="row" class="whitespace-nowrap px-3 py-2 text-left font-medium tabular-nums text-gray-700 dark:text-gray-200">
            {{ band.start }}–{{ band.end }}
          </th>
          <td v-for="day in schedule.days" :key="day" class="px-2 py-1.5">
            <div
              v-for="(entry, i) in band.cells[day]"
              :key="i"
              class="mb-1 rounded-md border px-2 py-1 last:mb-0"
              :class="entry.missing
                ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                : 'border-primary-100 bg-primary-50 dark:border-primary-900 dark:bg-primary-900/20'"
            >
              <p class="font-medium leading-snug text-gray-800 dark:text-gray-100">{{ entry.title }}</p>
              <p
                class="text-xs"
                :class="entry.missing ? 'text-amber-800 dark:text-amber-300' : 'text-gray-600 dark:text-gray-300'"
              >
                <span v-if="entry.missing" aria-hidden="true">⚠ </span>{{ entry.detail || '—' }}
              </p>
              <p v-if="entry.tag || entry.auto" class="mt-0.5 flex gap-1">
                <span v-if="entry.tag" class="rounded bg-white px-1 text-[10px] font-medium uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-300">{{ entry.tag }}</span>
                <span
                  v-if="entry.auto"
                  class="rounded bg-white px-1 text-[10px] font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  title="Gerado pela alocação automática"
                >Auto</span>
              </p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
