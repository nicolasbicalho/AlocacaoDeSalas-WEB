<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ value: number | string; label: string; to?: RouteLocationRaw }>()
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'div'"
    :to="to"
    class="block rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    :class="to ? 'transition-colors hover:border-primary-300 dark:hover:border-primary-700' : ''"
  >
    <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ value }}</p>
    <p class="text-xs text-gray-500 dark:text-gray-400">{{ label }}</p>
  </component>
</template>
