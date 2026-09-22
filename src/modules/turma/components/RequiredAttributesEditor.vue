<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{ modelValue: string[]; readonly?: boolean }>(), {
  readonly: false,
})
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const keys = ref<string[]>([...props.modelValue])
const draft = ref('')

watch(
  () => props.modelValue,
  (v) => {
    if (JSON.stringify(keys.value) !== JSON.stringify(v)) keys.value = [...v]
  },
)
watch(keys, () => emit('update:modelValue', [...keys.value]), { deep: true })

function add() {
  const key = draft.value.trim().toLowerCase()
  if (key && /^[a-z0-9_]+$/.test(key) && !keys.value.includes(key)) {
    keys.value.push(key)
  }
  draft.value = ''
}
function remove(index: number) {
  keys.value.splice(index, 1)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Requisitos da sala (características)</span>

    <div v-if="keys.length" class="flex flex-wrap gap-2">
      <span
        v-for="(key, i) in keys"
        :key="key"
        class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
      >
        {{ key }}
        <button
          v-if="!readonly"
          type="button"
          class="text-gray-400 hover:text-red-600"
          aria-label="Remover requisito"
          @click="remove(i)"
        >
          ✕
        </button>
      </span>
    </div>

    <div v-if="!readonly" class="flex gap-2">
      <input
        v-model="draft"
        placeholder="ex: projector, accessible, computers"
        class="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        @keydown.enter.prevent="add"
      />
      <button
        type="button"
        class="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
        @click="add"
      >
        Adicionar
      </button>
    </div>
  </div>
</template>
