<script setup lang="ts">
import AppSpinner from './AppSpinner.vue'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    type: 'button',
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    :class="[
      {
        'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500': variant === 'primary',
        'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400': variant === 'secondary',
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
        'bg-transparent text-primary-700 hover:bg-primary-50 focus:ring-primary-500': variant === 'ghost',
      },
      {
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-4 py-2 text-sm': size === 'md',
        'px-5 py-2.5 text-base': size === 'lg',
      },
    ]"
  >
    <AppSpinner v-if="loading" size="sm" />
    <slot />
  </button>
</template>
