<script setup lang="ts">
import type { Crumb } from './navigation'

defineProps<{ items: Crumb[] }>()
</script>

<template>
  <nav aria-label="Trilha de navegação">
    <ol class="flex flex-wrap items-center gap-1 text-sm">
      <li v-for="(item, i) in items" :key="i" class="flex items-center gap-1">
        <span v-if="i > 0" class="text-gray-300 dark:text-gray-600" aria-hidden="true">›</span>
        <RouterLink
          v-if="item.to && i < items.length - 1"
          :to="item.to"
          class="rounded px-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400"
        >
          {{ item.label }}
        </RouterLink>
        <span v-else class="px-1 font-medium text-gray-700 dark:text-gray-200" aria-current="page">{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>
