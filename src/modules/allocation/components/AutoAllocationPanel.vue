<script setup lang="ts">
import { computed, ref } from 'vue'
import { isAxiosError } from 'axios'
import AppButton from '@/shared/components/AppButton.vue'
import AppConfirmDialog from '@/shared/components/AppConfirmDialog.vue'
import AutoAllocationResult from './AutoAllocationResult.vue'
import {
  previewAutoAllocation,
  applyAutoAllocation,
  compareAutoAllocation,
  clearAutoAllocation,
} from '../services/allocation.service'
import { STRATEGY_LABELS } from '../autoAllocation'
import { useUiStore } from '@/stores/ui'
import type {
  AutoAllocationResult as Result,
  AutoComparison,
  AutoStrategy,
  IAllocation,
  IBuilding,
  IProject,
  IRoom,
  ITurma,
} from '@/types'

const props = defineProps<{
  project: IProject
  turmas: ITurma[]
  rooms: IRoom[]
  buildings: IBuilding[]
  allocations: IAllocation[]
}>()

/** a grade precisa recarregar os eventos depois de aplicar ou remover */
const emit = defineEmits<{ changed: [] }>()

const ui = useUiStore()

const open = ref(true)
const strategy = ref<AutoStrategy>('gerente')
const replaceAuto = ref(false)
const busy = ref<'' | 'preview' | 'apply' | 'compare' | 'clear'>('')
const result = ref<Result | null>(null)
const comparison = ref<AutoComparison | null>(null)
const applied = ref(false)
const confirmClear = ref(false)

const autoCount = computed(() => props.allocations.filter((a) => a.source === 'auto').length)
const strategies = Object.entries(STRATEGY_LABELS) as [AutoStrategy, string][]

function errorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error?.code === 'PROJECT_NOT_EDITABLE') {
    return 'O projeto está encerrado e não pode ser alterado.'
  }
  return fallback
}

async function simulate() {
  busy.value = 'preview'
  comparison.value = null
  try {
    result.value = await previewAutoAllocation(props.project.id, { strategy: strategy.value, replaceAuto: replaceAuto.value })
    applied.value = false
  } catch (err) {
    ui.toast({ message: errorMessage(err, 'Não foi possível simular a alocação.'), variant: 'error' })
  } finally {
    busy.value = ''
  }
}

async function apply() {
  busy.value = 'apply'
  try {
    // o servidor recalcula: o que for gravado é o resultado mostrado a seguir
    result.value = await applyAutoAllocation(props.project.id, { strategy: strategy.value, replaceAuto: replaceAuto.value })
    applied.value = true
    replaceAuto.value = false
    const n = result.value.allocations.length
    ui.toast({ message: `${n} evento${n === 1 ? '' : 's'} criado${n === 1 ? '' : 's'} pela alocação automática`, variant: 'success' })
    emit('changed')
  } catch (err) {
    ui.toast({ message: errorMessage(err, 'Não foi possível aplicar a alocação.'), variant: 'error' })
  } finally {
    busy.value = ''
  }
}

async function compare() {
  busy.value = 'compare'
  result.value = null
  try {
    comparison.value = await compareAutoAllocation(props.project.id, replaceAuto.value)
  } catch {
    ui.toast({ message: 'Não foi possível comparar as estratégias.', variant: 'error' })
  } finally {
    busy.value = ''
  }
}

async function clearAuto() {
  busy.value = 'clear'
  try {
    const removed = await clearAutoAllocation(props.project.id)
    ui.toast({ message: `${removed} evento(s) automático(s) removido(s)`, variant: 'success' })
    result.value = null
    comparison.value = null
    replaceAuto.value = false
    emit('changed')
  } catch (err) {
    ui.toast({ message: errorMessage(err, 'Não foi possível remover os eventos automáticos.'), variant: 'error' })
  } finally {
    busy.value = ''
    confirmClear.value = false
  }
}

function discard() {
  result.value = null
  comparison.value = null
}

const selectClass =
  'rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
</script>

<template>
  <section class="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-label="Alocação automática">
    <button
      type="button"
      class="flex w-full items-center justify-between px-5 py-3 text-left"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Alocação automática
        <span v-if="autoCount" class="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium normal-case text-primary-800 dark:bg-primary-950/40 dark:text-primary-200">
          {{ autoCount }} evento(s) automático(s)
        </span>
      </span>
      <span class="text-gray-400" aria-hidden="true">{{ open ? '▾' : '▸' }}</span>
    </button>

    <div v-if="open" class="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 dark:border-gray-700">
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Preenche só os horários de turma que ainda não têm sala, sem quebrar capacidade nem características. Eventos lançados à
        mão ficam como estão; editar um evento automático o torna manual. Simule, confira e aplique.
      </p>
      <div class="flex flex-wrap items-end gap-3">
        <label class="flex flex-col gap-1 text-sm">
          <span class="font-medium text-gray-700 dark:text-gray-300">Estratégia</span>
          <select v-model="strategy" :class="selectClass">
            <option v-for="[value, label] in strategies" :key="value" :value="value">{{ label }}</option>
          </select>
        </label>
        <label v-if="autoCount" class="flex items-center gap-2 pb-1.5 text-sm text-gray-700 dark:text-gray-300">
          <input v-model="replaceAuto" type="checkbox" class="h-4 w-4 accent-primary-600" />
          Refazer as automáticas
        </label>
        <div class="flex flex-wrap gap-2">
          <AppButton :loading="busy === 'preview'" :disabled="!!busy" @click="simulate">Simular</AppButton>
          <AppButton variant="secondary" :loading="busy === 'compare'" :disabled="!!busy" @click="compare">Comparar estratégias</AppButton>
          <AppButton v-if="autoCount" variant="ghost" :disabled="!!busy" @click="confirmClear = true">
            Remover automáticas ({{ autoCount }})
          </AppButton>
        </div>
      </div>

      <AutoAllocationResult
        v-if="result || comparison"
        :project="project"
        :turmas="turmas"
        :rooms="rooms"
        :buildings="buildings"
        :result="result"
        :comparison="comparison"
        :applied="applied"
        :applying="busy === 'apply'"
        :can-apply="true"
        @apply="apply"
        @discard="discard"
      />
    </div>

    <AppConfirmDialog
      :open="confirmClear"
      title="Remover eventos automáticos"
      :message="`Remover os ${autoCount} evento(s) criados pela alocação automática? Os eventos lançados à mão (e os automáticos que você editou) ficam.`"
      confirm-label="Remover"
      variant="danger"
      :loading="busy === 'clear'"
      @confirm="clearAuto"
      @cancel="confirmClear = false"
    />
  </section>
</template>
