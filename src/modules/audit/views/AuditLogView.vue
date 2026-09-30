<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import AppBadge from '@/shared/components/AppBadge.vue'
import AppButton from '@/shared/components/AppButton.vue'
import AppPagination from '@/shared/components/AppPagination.vue'
import AppSpinner from '@/shared/components/AppSpinner.vue'
import AppEmptyState from '@/shared/components/AppEmptyState.vue'
import { listAuditLogs } from '../services/audit.service'
import { ACTION_LABELS, ENTITY_LABELS, actionVariant } from '../labels'
import { useUiStore } from '@/stores/ui'
import type { AuditAction, AuditEntity, IAuditLog } from '@/types'

const ui = useUiStore()

const entity = ref<AuditEntity | ''>('')
const action = ref<AuditAction | ''>('')
const from = ref('')
const to = ref('')

const rows = ref<IAuditLog[]>([])
const loading = ref(false)
const page = ref(1)
const limit = 20
const total = ref(0)
const totalPages = ref(1)
const expanded = ref<string | null>(null)

const entityOptions = Object.entries(ENTITY_LABELS) as [AuditEntity, string][]
const actionOptions = Object.entries(ACTION_LABELS) as [AuditAction, string][]

const selectClass =
  'rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
}

async function fetchLogs() {
  if (from.value && to.value && from.value > to.value) {
    ui.toast({ message: 'A data inicial deve ser anterior à final.', variant: 'error' })
    return
  }
  loading.value = true
  try {
    const res = await listAuditLogs({
      page: page.value,
      limit,
      ...(entity.value ? { entity: entity.value } : {}),
      ...(action.value ? { action: action.value } : {}),
      ...(from.value ? { from: from.value } : {}),
      ...(to.value ? { to: to.value } : {}),
    })
    rows.value = res.data
    total.value = res.pagination.total
    totalPages.value = Math.max(1, res.pagination.totalPages)
  } catch (err) {
    if (!isAxiosError(err)) throw err
    ui.toast({ message: 'Erro ao carregar a auditoria.', variant: 'error' })
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  expanded.value = null
  fetchLogs()
}
function clearFilters() {
  entity.value = ''
  action.value = ''
  from.value = ''
  to.value = ''
  applyFilters()
}
function changePage(target: number) {
  page.value = target
  expanded.value = null
  fetchLogs()
}
function toggle(id: string) {
  expanded.value = expanded.value === id ? null : id
}

onMounted(fetchLogs)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Auditoria</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Registro das ações dos usuários (criações, edições, remoções, logins). Senhas e tokens não são gravados.
      </p>
    </div>

    <!-- filtros -->
    <div class="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <label class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
        Entidade
        <select v-model="entity" :class="selectClass">
          <option value="">Todas</option>
          <option v-for="[value, label] in entityOptions" :key="value" :value="value">{{ label }}</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
        Ação
        <select v-model="action" :class="selectClass">
          <option value="">Todas</option>
          <option v-for="[value, label] in actionOptions" :key="value" :value="value">{{ label }}</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
        De
        <input v-model="from" type="date" :class="selectClass" />
      </label>
      <label class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
        Até
        <input v-model="to" type="date" :class="selectClass" />
      </label>
      <div class="flex gap-2">
        <AppButton size="sm" @click="applyFilters">Filtrar</AppButton>
        <AppButton size="sm" variant="secondary" @click="clearFilters">Limpar</AppButton>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12 text-gray-400 dark:text-gray-500">
      <AppSpinner size="lg" />
    </div>

    <AppEmptyState
      v-else-if="rows.length === 0"
      title="Nenhum registro"
      description="Nenhuma ação encontrada para os filtros selecionados."
    />

    <template v-else>
      <div class="overflow-x-auto rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
        <table class="min-w-full text-sm">
          <thead class="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <tr>
              <th class="px-4 py-3">Data/hora</th>
              <th class="px-4 py-3">Usuário</th>
              <th class="px-4 py-3">Ação</th>
              <th class="px-4 py-3">Entidade</th>
              <th class="px-4 py-3">Registro</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <template v-for="log in rows" :key="log.id">
              <tr class="text-gray-700 dark:text-gray-200">
                <td class="whitespace-nowrap px-4 py-2.5 font-mono text-xs">{{ formatDateTime(log.createdAt) }}</td>
                <td class="px-4 py-2.5">
                  <span class="block">{{ log.userName ?? log.userEmail ?? '—' }}</span>
                  <span v-if="log.userName && log.userEmail" class="block text-xs text-gray-400 dark:text-gray-500">
                    {{ log.userEmail }}<template v-if="log.role"> · {{ log.role }}</template>
                  </span>
                </td>
                <td class="whitespace-nowrap px-4 py-2.5"><AppBadge :variant="actionVariant(log.action)" :label="ACTION_LABELS[log.action] ?? log.action" /></td>
                <td class="whitespace-nowrap px-4 py-2.5">{{ ENTITY_LABELS[log.entity] ?? log.entity }}</td>
                <td class="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400">{{ log.entityId ?? '—' }}</td>
                <td class="px-4 py-2.5 text-right">
                  <AppButton variant="ghost" size="sm" :aria-expanded="expanded === log.id" @click="toggle(log.id)">
                    {{ expanded === log.id ? 'Ocultar' : 'Detalhes' }}
                  </AppButton>
                </td>
              </tr>
              <tr v-if="expanded === log.id" class="bg-gray-50 dark:bg-gray-900/40">
                <td colspan="6" class="px-4 py-3">
                  <dl class="grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-gray-600 sm:grid-cols-2 dark:text-gray-300">
                    <div><dt class="inline font-semibold">Requisição:</dt> <dd class="inline font-mono">{{ log.method }} {{ log.path }}</dd></div>
                    <div><dt class="inline font-semibold">Status:</dt> <dd class="inline font-mono">{{ log.statusCode }}</dd></div>
                    <div v-if="log.ip"><dt class="inline font-semibold">IP:</dt> <dd class="inline font-mono">{{ log.ip }}</dd></div>
                    <div v-if="log.userAgent" class="truncate"><dt class="inline font-semibold">Navegador:</dt> <dd class="inline">{{ log.userAgent }}</dd></div>
                  </dl>
                  <pre
                    v-if="log.details"
                    class="mt-2 max-h-64 overflow-auto rounded-lg bg-white p-3 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >{{ JSON.stringify(log.details, null, 2) }}</pre>
                  <p v-else class="mt-2 text-xs text-gray-400 dark:text-gray-500">Sem dados enviados.</p>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <AppPagination :page="page" :total-pages="totalPages" :total="total" @update:page="changePage" />
    </template>
  </div>
</template>
