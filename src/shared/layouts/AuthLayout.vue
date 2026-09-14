<script setup lang="ts">
import ThemeToggle from '@/shared/components/ThemeToggle.vue'
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 dark:bg-gray-900">
    <div class="absolute right-4 top-4">
      <ThemeToggle />
    </div>
    <div class="w-full max-w-md">
      <slot />
    </div>
  </div>
</template>
