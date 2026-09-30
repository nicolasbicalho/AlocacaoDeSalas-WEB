<script setup lang="ts">
import { ROOM_FEATURES } from '@/shared/constants/roomFeatures'
import type { RoomFeature } from '@/types'

const props = withDefaults(
  defineProps<{ modelValue: RoomFeature[]; label: string; hint?: string; readonly?: boolean }>(),
  { readonly: false },
)
const emit = defineEmits<{ 'update:modelValue': [value: RoomFeature[]] }>()

function toggle(feature: RoomFeature, checked: boolean) {
  const current = new Set(props.modelValue)
  if (checked) current.add(feature)
  else current.delete(feature)
  // mantém a ordem do catálogo
  emit('update:modelValue', ROOM_FEATURES.map((f) => f.value).filter((v) => current.has(v)))
}
</script>

<template>
  <fieldset class="flex flex-col gap-2">
    <legend class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{{ label }}</legend>
    <p v-if="hint" class="-mt-1 text-xs text-gray-500 dark:text-gray-400">{{ hint }}</p>
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <label
        v-for="f in ROOM_FEATURES"
        :key="f.value"
        class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
        :class="[
          modelValue.includes(f.value)
            ? 'border-primary-300 bg-primary-50 text-primary-800 dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-200'
            : 'border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-300',
          readonly ? 'cursor-default opacity-80' : 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-700',
        ]"
      >
        <input
          type="checkbox"
          class="h-4 w-4 accent-primary-600"
          :checked="modelValue.includes(f.value)"
          :disabled="readonly"
          @change="toggle(f.value, ($event.target as HTMLInputElement).checked)"
        />
        {{ f.label }}
      </label>
    </div>
  </fieldset>
</template>
