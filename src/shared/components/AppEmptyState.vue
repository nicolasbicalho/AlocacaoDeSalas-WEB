<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-600 dark:bg-gray-800"
  >
    <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ title }}</p>
    <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400">{{ description }}</p>
    <div class="mt-2"><slot name="action" /></div>
  </div>
</template>
