<script setup lang="ts">
import ProjectStatusBadge from './ProjectStatusBadge.vue'
import AppButton from '@/shared/components/AppButton.vue'
import type { IProject } from '@/types'

defineProps<{ project: IProject }>()
const emit = defineEmits<{ open: [id: string] }>()
</script>

<template>
  <div class="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between gap-2">
      <h3 class="font-semibold text-gray-800">{{ project.name }}</h3>
      <ProjectStatusBadge :status="project.status" />
    </div>
    <p class="text-sm text-gray-500">Semestre {{ project.semester }}</p>
    <AppButton variant="ghost" size="sm" class="mt-2 self-start" @click="emit('open', project.id)">
      Abrir
    </AppButton>
  </div>
</template>
