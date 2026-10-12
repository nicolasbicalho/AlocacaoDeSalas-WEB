<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { isAxiosError } from 'axios'
import { updateTurma } from '../services/turma.service'
import { useUiStore } from '@/stores/ui'
import type { ITurma } from '@/types'

// edição rápida do nº de alunos direto na tabela: o gerente só obtém esse número depois da planilha
const props = defineProps<{ turma: ITurma; readonly?: boolean }>()
const emit = defineEmits<{ updated: [turma: ITurma] }>()
const ui = useUiStore()

const editing = ref(false)
const saving = ref(false)
// v-model em <input type="number"> devolve número quando há valor e '' quando vazio
const draft = ref<string | number>('')
const error = ref('')
const input = ref<HTMLInputElement | null>(null)

async function startEdit() {
  if (props.readonly || saving.value) return
  draft.value = props.turma.studentCount != null ? String(props.turma.studentCount) : ''
  error.value = ''
  editing.value = true
  await nextTick()
  input.value?.focus()
  input.value?.select()
}

function cancel() {
  editing.value = false
  error.value = ''
}

async function commit() {
  if (!editing.value || saving.value) return
  const raw = String(draft.value).trim()
  const value = raw === '' ? null : Number(raw)
  if (value !== null && (!Number.isInteger(value) || value <= 0)) {
    error.value = 'Inteiro > 0, ou vazio'
    return
  }
  if (value === props.turma.studentCount) {
    editing.value = false
    return
  }
  saving.value = true
  try {
    const updated = await updateTurma(props.turma.id, { studentCount: value })
    emit('updated', updated)
    editing.value = false
    ui.toast({
      message: value === null ? `${updated.name}: nº de alunos a definir` : `${updated.name}: ${value} alunos`,
      variant: 'success',
    })
  } catch (err) {
    const msg = isAxiosError(err) && err.response?.status === 403 ? 'Sem permissão para editar.' : 'Não foi possível salvar o nº de alunos.'
    ui.toast({ message: msg, variant: 'error' })
    editing.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-w-[5.5rem]">
    <div v-if="editing" class="flex flex-col gap-0.5">
      <input
        ref="input"
        v-model="draft"
        type="number"
        min="1"
        placeholder="a definir"
        :disabled="saving"
        :aria-label="`Nº de alunos de ${turma.name}`"
        :aria-invalid="!!error"
        class="w-24 rounded-md border px-2 py-1 text-sm outline-none focus:ring-2 dark:bg-gray-800 dark:text-gray-100"
        :class="error ? 'border-red-400 focus:ring-red-400' : 'border-primary-400 focus:ring-primary-500 dark:border-primary-600'"
        @keydown.enter.prevent="commit"
        @keydown.esc.prevent="cancel"
        @blur="commit"
      />
      <span v-if="error" class="text-xs text-red-600 dark:text-red-400">{{ error }}</span>
    </div>

    <button
      v-else-if="!readonly"
      type="button"
      class="group flex items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
      :title="'Clique para editar o nº de alunos'"
      :aria-label="`Editar nº de alunos de ${turma.name}`"
      @click="startEdit"
    >
      <span v-if="turma.studentCount != null" class="font-medium text-gray-800 dark:text-gray-100">{{ turma.studentCount }}</span>
      <span
        v-else
        class="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
      >
        a definir
      </span>
      <span class="text-xs text-gray-300 group-hover:text-primary-500 dark:text-gray-600" aria-hidden="true">✎</span>
    </button>

    <span v-else class="px-2 text-gray-800 dark:text-gray-100">{{ turma.studentCount ?? 'a definir' }}</span>
  </div>
</template>
