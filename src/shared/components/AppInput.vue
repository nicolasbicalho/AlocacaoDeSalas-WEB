<script setup lang="ts">
defineProps<{
  modelValue?: string
  label?: string
  placeholder?: string
  error?: string
  type?: string
  disabled?: boolean
  required?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()

const inputId = `input-${Math.random().toString(36).slice(2, 9)}`
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="inputId" class="text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ label }}<span v-if="required" class="ml-0.5 text-red-500">*</span>
    </label>
    <input
      :id="inputId"
      :value="modelValue"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="!!error"
      class="rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 disabled:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:disabled:bg-gray-700"
      :class="error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-primary-500 dark:border-gray-600'"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
  </div>
</template>
