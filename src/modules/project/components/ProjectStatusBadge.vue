<script setup lang="ts">
import AppBadge from '@/shared/components/AppBadge.vue'
import type { ProjectStatus } from '@/types'

const props = defineProps<{ status: ProjectStatus }>()

const map: Record<ProjectStatus, { variant: 'neutral' | 'success' | 'info'; label: string }> = {
  draft: { variant: 'neutral', label: 'Rascunho' },
  active: { variant: 'success', label: 'Ativo' },
  closed: { variant: 'info', label: 'Encerrado' },
}
</script>

<template>
  <AppBadge :variant="map[props.status].variant" :label="map[props.status].label" />
</template>
