<script setup lang="ts">
import { computed } from 'vue'
import { addDays, clampDate, firstSchoolDay, formatDateBR, formatDayMonth, mondayOf, todayISO, weekDates } from '../helpers'

const props = defineProps<{
  /** data selecionada ('YYYY-MM-DD') */
  modelValue: string
  startDate: string
  endDate: string
  /** nº de eventos por data (só as datas da semana visível importam) */
  counts: Record<string, number>
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const days = computed(() => weekDates(props.modelValue))
const inRange = (d: string) => d >= props.startDate && d <= props.endDate
const weekLabel = computed(() => `${formatDayMonth(days.value[0].date)} – ${formatDateBR(days.value[5].date)}`)

const hasPrev = computed(() => addDays(mondayOf(props.modelValue), -1) >= props.startDate)
const hasNext = computed(() => addDays(mondayOf(props.modelValue), 7) <= props.endDate)

const today = todayISO()
const todayInRange = computed(() => inRange(today))

function select(date: string) {
  if (inRange(date)) emit('update:modelValue', date)
}

// troca de semana mantendo o dia da semana (ajustado ao semestre)
function shiftWeek(delta: number) {
  const target = clampDate(addDays(props.modelValue, delta * 7), props.startDate, props.endDate)
  emit('update:modelValue', firstSchoolDay(target, props.endDate))
}

function onPick(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (!value) return
  const target = clampDate(value, props.startDate, props.endDate)
  emit('update:modelValue', firstSchoolDay(target, props.endDate))
}

const navBtn =
  'rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" :class="navBtn" :disabled="!hasPrev" aria-label="Semana anterior" @click="shiftWeek(-1)">◀</button>
      <span class="min-w-[9.5rem] text-center text-sm font-medium text-gray-700 dark:text-gray-200">{{ weekLabel }}</span>
      <button type="button" :class="navBtn" :disabled="!hasNext" aria-label="Próxima semana" @click="shiftWeek(1)">▶</button>
      <button v-if="todayInRange" type="button" :class="navBtn" @click="select(firstSchoolDay(today, endDate))">Hoje</button>
      <input
        type="date"
        :value="modelValue"
        :min="startDate"
        :max="endDate"
        aria-label="Ir para a data"
        class="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        @change="onPick"
      />
    </div>

    <div class="flex flex-wrap gap-1">
      <button
        v-for="d in days"
        :key="d.date"
        type="button"
        :disabled="!inRange(d.date)"
        class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35"
        :class="
          modelValue === d.date
            ? 'bg-primary-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        "
        @click="select(d.date)"
      >
        {{ d.label }} {{ formatDayMonth(d.date) }}
        <span
          v-if="counts[d.date]"
          class="rounded-full px-1.5 text-xs"
          :class="modelValue === d.date ? 'bg-white/25' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200'"
        >
          {{ counts[d.date] }}
        </span>
      </button>
    </div>
  </div>
</template>
