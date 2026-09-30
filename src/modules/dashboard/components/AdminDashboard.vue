<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import AppBadge from '@/shared/components/AppBadge.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import StatCard from './StatCard.vue'
import { loadAdminDashboard, type AdminDashboardData } from '../services/dashboard.service'
import { timeAgo } from '../helpers'
import { ACTION_LABELS, ENTITY_LABELS, actionVariant } from '@/modules/audit/labels'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const data = ref<AdminDashboardData | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    data.value = await loadAdminDashboard()
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar a página inicial.', variant: 'error' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading" class="flex justify-center py-16 text-gray-400 dark:text-gray-500">
    <AppSpinner size="lg" />
  </div>

  <div v-else-if="data" class="flex flex-col gap-4">
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <StatCard :value="data.institutes" label="Institutos ativos" to="/institutes" />
      <StatCard :value="data.users" label="Usuários cadastrados" />
      <StatCard :value="data.projects.active" label="Projetos ativos" to="/projects" />
      <StatCard :value="data.projects.draft" label="Em rascunho" to="/projects" />
      <StatCard :value="data.projects.closed" label="Encerrados" to="/projects" />
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <!-- institutos sem projeto ativo -->
      <section class="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Sem projeto ativo</h3>
        <p v-if="data.institutesWithoutActive.length === 0" class="text-sm text-green-700 dark:text-green-400">
          ✓ Todos os institutos têm um projeto ativo.
        </p>
        <template v-else>
          <p class="text-xs text-gray-500 dark:text-gray-400">Institutos que ainda não começaram o semestre:</p>
          <ul class="flex flex-col gap-1">
            <li v-for="i in data.institutesWithoutActive" :key="i.id">
              <RouterLink
                :to="`/institutes/${i.id}`"
                class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50"
              >
                <span class="font-medium">{{ i.name }}</span>
                <span class="text-xs text-gray-400 dark:text-gray-500">{{ i.code }}</span>
              </RouterLink>
            </li>
          </ul>
        </template>
      </section>

      <!-- atividade recente -->
      <section class="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-5 lg:col-span-2 dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Atividade recente</h3>
          <RouterLink to="/audit" class="text-xs font-medium text-primary-700 hover:underline dark:text-primary-400">
            Ver auditoria completa →
          </RouterLink>
        </div>
        <p v-if="data.recent.length === 0" class="text-sm text-gray-500 dark:text-gray-400">Nenhuma ação registrada ainda.</p>
        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
          <li v-for="log in data.recent" :key="log.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
            <span class="w-28 shrink-0 text-xs text-gray-400 dark:text-gray-500" :title="new Date(log.createdAt).toLocaleString('pt-BR')">
              {{ timeAgo(log.createdAt) }}
            </span>
            <span class="font-medium text-gray-800 dark:text-gray-100">{{ log.userName ?? log.userEmail ?? '—' }}</span>
            <AppBadge :variant="actionVariant(log.action)" :label="ACTION_LABELS[log.action] ?? log.action" />
            <span class="text-gray-500 dark:text-gray-400">{{ ENTITY_LABELS[log.entity] ?? log.entity }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
