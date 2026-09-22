<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TimeSlot, WeekDay } from '@/types'

const props = withDefaults(defineProps<{ modelValue: TimeSlot[]; readonly?: boolean }>(), {
  readonly: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: TimeSlot[]] }>()

const dayOptions: { value: WeekDay; label: string }[] = [
  { value: 'mon', label: 'Seg' },
  { value: 'tue', label: 'Ter' },
  { value: 'wed', label: 'Qua' },
  { value: 'thu', label: 'Qui' },
  { value: 'fri', label: 'Sex' },
  { value: 'sat', label: 'Sáb' },
]

const inputClass =
  'rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700'

const rows = ref<TimeSlot[]>(props.modelValue.map((s) => ({ ...s })))

function toModel(rs: TimeSlot[]): TimeSlot[] {
  return rs.filter((r) => r.start && r.end).map((r) => ({ day: r.day, start: r.start, end: r.end }))
}

watch(
  () => props.modelValue,
  (v) => {
    if (JSON.stringify(toModel(rows.value)) !== JSON.stringify(v)) rows.value = v.map((s) => ({ ...s }))
  },
)
watch(rows, () => emit('update:modelValue', toModel(rows.value)), { deep: true })

function addRow() {
  rows.value.push({ day: 'mon', start: '08:00', end: '10:00' })
}
function removeRow(index: number) {
  rows.value.splice(index, 1)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Horários semanais</span>
    <p v-if="rows.length === 0" class="text-sm text-gray-400 dark:text-gray-500">
      Nenhum horário. Adicione as faixas semanais em que a turma precisa de sala.
    </p>

    <div v-for="(row, i) in rows" :key="i" class="flex items-center gap-2">
      <select v-model="row.day" :disabled="readonly" :class="inputClass">
        <option v-for="d in dayOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
      </select>
      <input v-model="row.start" :disabled="readonly" type="time" :class="inputClass" />
      <span class="text-gray-400 dark:text-gray-500">–</span>
      <input v-model="row.end" :disabled="readonly" type="time" :class="inputClass" />
      <button
        v-if="!readonly"
        type="button"
        class="px-2 text-red-600 hover:text-red-700"
        aria-label="Remover horário"
        @click="removeRow(i)"
      >
        ✕
      </button>
    </div>

    <button
      v-if="!readonly"
      type="button"
      class="self-start text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
      @click="addRow"
    >
      + Adicionar horário
    </button>
  </div>
</template>
