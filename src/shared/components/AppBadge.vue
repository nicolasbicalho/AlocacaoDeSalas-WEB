<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
    label: string
  }>(),
  { variant: 'neutral' },
)
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="{
      'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300': variant === 'success',
      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300': variant === 'warning',
      'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300': variant === 'danger',
      'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300': variant === 'info',
      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300': variant === 'neutral',
    }"
  >
    {{ label }}
  </span>
</template>
