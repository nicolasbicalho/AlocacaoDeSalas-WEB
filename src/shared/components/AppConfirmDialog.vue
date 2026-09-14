<script setup lang="ts">
import AppButton from './AppButton.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    variant?: 'danger' | 'warning'
    loading?: boolean
  }>(),
  { confirmLabel: 'Confirmar', variant: 'danger', loading: false },
)

defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      @click.self="$emit('cancel')"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ title }}</h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{{ message }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <AppButton variant="secondary" :disabled="loading" @click="$emit('cancel')">
            Cancelar
          </AppButton>
          <AppButton
            :variant="variant === 'danger' ? 'danger' : 'primary'"
            :loading="loading"
            @click="$emit('confirm')"
          >
            {{ confirmLabel }}
          </AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
