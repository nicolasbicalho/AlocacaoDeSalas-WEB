<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'

export type ExportKind = 'timetable' | 'occupancy'

defineProps<{ busy: ExportKind | null; occupancyDisabled?: boolean }>()
const emit = defineEmits<{ export: [kind: ExportKind] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function choose(kind: ExportKind) {
  open.value = false
  emit('export', kind)
}
function onDocumentClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKey)
})

const items: { kind: ExportKind; label: string; hint: string }[] = [
  { kind: 'timetable', label: 'Quadro de horários (XLSX)', hint: 'Quadro semanal, turmas e salas — o mesmo da aba Turmas' },
  { kind: 'occupancy', label: 'Ocupação (XLSX)', hint: 'Resumo, salas e mapa de calor, com os filtros atuais' },
]
</script>

<template>
  <div ref="root" class="relative">
    <AppButton variant="secondary" :loading="busy !== null" aria-haspopup="menu" :aria-expanded="open" @click="open = !open">
      Exportar ▾
    </AppButton>
    <ul
      v-if="open"
      role="menu"
      class="absolute right-0 z-20 mt-1 w-72 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <li v-for="item in items" :key="item.kind" role="none">
        <button
          type="button"
          role="menuitem"
          class="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700"
          :disabled="busy !== null || (item.kind === 'occupancy' && occupancyDisabled)"
          @click="choose(item.kind)"
        >
          <span class="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-100">
            {{ item.label }}<AppSpinner v-if="busy === item.kind" size="sm" />
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.hint }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
