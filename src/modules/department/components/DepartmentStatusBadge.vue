<script setup lang="ts">
import AppBadge from '@/shared/components/AppBadge.vue'

defineProps<{ active: boolean }>()
</script>

<template>
  <AppBadge
    :variant="active ? 'success' : 'neutral'"
    :label="active ? 'Ativo' : 'Inativo'"
  />
</template>
