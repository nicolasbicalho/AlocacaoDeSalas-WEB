<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <div class="mb-6 text-center">
      <p class="text-2xl font-bold text-primary-700 dark:text-primary-400">AlocaçãoDeSalas</p>
      <h1 class="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-100">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
    </div>
    <slot />
  </div>
</template>
