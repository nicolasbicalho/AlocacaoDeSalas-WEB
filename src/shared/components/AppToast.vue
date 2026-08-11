<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const variantClass: Record<string, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-amber-500',
  info: 'bg-primary-600',
}
</script>

<template>
  <div class="fixed right-4 top-4 z-50 flex flex-col gap-2">
    <div
      v-for="t in ui.toasts"
      :key="t.id"
      role="status"
      class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg"
      :class="variantClass[t.variant]"
    >
      <span>{{ t.message }}</span>
      <button
        class="ml-auto text-white/80 transition hover:text-white"
        aria-label="Fechar notificação"
        @click="ui.removeToast(t.id)"
      >
        ✕
      </button>
    </div>
  </div>
</template>
