<script setup lang="ts">
import AppBreadcrumb from './AppBreadcrumb.vue'
import type { Crumb, ContextTab } from './navigation'

defineProps<{ title: string; crumbs: Crumb[]; tabs: ContextTab[] }>()
</script>

<template>
  <header class="flex flex-col gap-3">
    <AppBreadcrumb :items="crumbs" />
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ title }}</h1>
      <slot name="badge" />
      <span class="text-sm text-gray-500 dark:text-gray-400"><slot name="meta" /></span>
    </div>
    <nav aria-label="Seções" class="-mb-px flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.label"
        :to="tab.to"
        class="flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors"
        :class="
          tab.active
            ? 'border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200'
        "
        :aria-current="tab.active ? 'page' : undefined"
      >
        {{ tab.label }}
        <span
          v-if="tab.count != null"
          class="rounded-full px-1.5 text-xs"
          :class="tab.active ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
        >
          {{ tab.count }}
        </span>
      </RouterLink>
    </nav>
  </header>
</template>
