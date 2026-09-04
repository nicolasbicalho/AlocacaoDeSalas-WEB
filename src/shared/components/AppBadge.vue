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
      'bg-green-100 text-green-800': variant === 'success',
      'bg-amber-100 text-amber-800': variant === 'warning',
      'bg-red-100 text-red-800': variant === 'danger',
      'bg-primary-100 text-primary-800': variant === 'info',
      'bg-gray-100 text-gray-700': variant === 'neutral',
    }"
  >
    {{ label }}
  </span>
</template>
