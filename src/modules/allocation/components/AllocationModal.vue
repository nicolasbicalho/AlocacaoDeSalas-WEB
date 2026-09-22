<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { isAxiosError } from 'axios'
import AppButton from '@/shared/components/AppButton.vue'
import {
  createAllocation,
  moveAllocation,
  type AllocationCreatePayload,
} from '../services/allocation.service'
import { DAY_OPTIONS, weekdayFromDate, dayLabel } from '../helpers'
import type { ITurma, IRoom, IAllocation, AllocationType, WeekDay } from '@/types'

const props = defineProps<{
  open: boolean
  projectId: string
  turmas: ITurma[]
  rooms: IRoom[]
  /** quando presente, o modal opera em modo "mover" sobre esta utilização */
  editing?: IAllocation | null
}>()

const emit = defineEmits<{ saved: [IAllocation]; close: [] }>()

const isEdit = computed(() => !!props.editing)

const turmaId = ref('')
const roomId = ref('')
const type = ref<AllocationType>('weekly')
const day = ref<WeekDay>('mon')
const start = ref('08:00')
const end = ref('10:00')
const date = ref('')

const saving = ref(false)
const error = ref('')

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'

const selectedTurma = computed(() => props.turmas.find((t) => t.id === turmaId.value))

// dia efetivo: em single, derivado da data
const derivedDay = computed<WeekDay | null>(() =>
  type.value === 'single' && date.value ? weekdayFromDate(date.value) : null,
)

function resetFromProps() {
  error.value = ''
  const a = props.editing
  if (a) {
    turmaId.value = a.turmaId
    roomId.value = a.roomId
    type.value = a.type
    day.value = a.timeSlot.day
    start.value = a.timeSlot.start
    end.value = a.timeSlot.end
    date.value = a.date ?? ''
  } else {
    turmaId.value = props.turmas[0]?.id ?? ''
    roomId.value = props.rooms[0]?.id ?? ''
    type.value = 'weekly'
    day.value = 'mon'
    start.value = '08:00'
    end.value = '10:00'
    date.value = ''
  }
}

watch(() => props.open, (open) => { if (open) resetFromProps() })

const validationMessage = computed(() => {
  if (!turmaId.value) return 'Selecione uma turma.'
  if (!roomId.value) return 'Selecione uma sala.'
  if (!start.value || !end.value) return 'Informe horário de início e fim.'
  if (start.value >= end.value) return 'O fim deve ser depois do início.'
  if (type.value === 'single') {
    if (!date.value) return 'Informe a data do dia único.'
    if (!derivedDay.value) return 'A data cai em um domingo — escolha um dia letivo (Seg–Sáb).'
  }
  return ''
})

async function submit() {
  error.value = ''
  const invalid = validationMessage.value
  if (invalid) { error.value = invalid; return }

  const effectiveDay = type.value === 'single' ? derivedDay.value! : day.value
  const payload: AllocationCreatePayload = {
    turmaId: turmaId.value,
    roomId: roomId.value,
    timeSlot: { day: effectiveDay, start: start.value, end: end.value },
    type: type.value,
    ...(type.value === 'single' ? { date: date.value } : {}),
  }

  saving.value = true
  try {
    const result = props.editing
      ? await moveAllocation(props.projectId, props.editing.id, {
          roomId: payload.roomId,
          timeSlot: payload.timeSlot,
          type: payload.type,
          ...(payload.date ? { date: payload.date } : {}),
        })
      : await createAllocation(props.projectId, payload)
    emit('saved', result)
  } catch (err) {
    error.value = messageForError(err)
  } finally {
    saving.value = false
  }
}

function messageForError(err: unknown): string {
  if (!isAxiosError(err)) return 'Erro inesperado ao salvar.'
  const code = err.response?.data?.error?.code
  switch (code) {
    case 'ALLOCATION_ROOM_CONFLICT':
      return 'A sala já está ocupada nesse horário.'
    case 'ALLOCATION_TURMA_CONFLICT':
      return 'A turma já está alocada em outro lugar nesse horário.'
    case 'ALLOCATION_TURMA_NOT_IN_PROJECT':
      return 'A turma não pertence a este projeto.'
    case 'VALIDATION_ERROR':
      return 'Dados inválidos. Verifique horário e data (dias letivos: Seg–Sáb).'
    case 'PROJECT_NOT_EDITABLE':
      return 'O projeto está encerrado e não pode ser alterado.'
    default:
      return 'Não foi possível salvar a utilização.'
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {{ isEdit ? 'Mover utilização' : 'Adicionar utilização' }}
        </h2>

        <div class="mt-4 flex flex-col gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Turma</span>
            <select v-model="turmaId" :disabled="isEdit" :class="inputClass">
              <option v-for="t in turmas" :key="t.id" :value="t.id">
                {{ t.name }}<template v-if="t.code"> ({{ t.code }})</template> — {{ t.professor }}
              </option>
            </select>
            <span v-if="isEdit" class="text-xs text-gray-400 dark:text-gray-500">
              A turma não muda ao mover — crie uma nova utilização para outra turma.
            </span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Sala</span>
            <select v-model="roomId" :class="inputClass">
              <option v-for="r in rooms" :key="r.id" :value="r.id">
                {{ r.name }} ({{ r.code }}) — cap. {{ r.capacity }}
              </option>
            </select>
          </label>

          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Recorrência</span>
            <div class="flex gap-4 text-sm text-gray-700 dark:text-gray-200">
              <label class="flex items-center gap-1.5">
                <input v-model="type" type="radio" value="weekly" /> Semanal
              </label>
              <label class="flex items-center gap-1.5">
                <input v-model="type" type="radio" value="single" /> Dia único
              </label>
            </div>
          </div>

          <label v-if="type === 'weekly'" class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Dia da semana</span>
            <select v-model="day" :class="inputClass">
              <option v-for="d in DAY_OPTIONS" :key="d.value" :value="d.value">{{ d.long }}</option>
            </select>
          </label>

          <label v-else class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Data</span>
            <input v-model="date" type="date" :class="inputClass" />
            <span v-if="derivedDay" class="text-xs text-gray-400 dark:text-gray-500">
              {{ dayLabel(derivedDay) }}
            </span>
          </label>

          <div class="flex items-end gap-2">
            <label class="flex flex-1 flex-col gap-1">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Início</span>
              <input v-model="start" type="time" :class="inputClass" />
            </label>
            <span class="pb-2 text-gray-400 dark:text-gray-500">–</span>
            <label class="flex flex-1 flex-col gap-1">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Fim</span>
              <input v-model="end" type="time" :class="inputClass" />
            </label>
          </div>

          <p
            v-if="error"
            class="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          >
            {{ error }}
          </p>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <AppButton variant="secondary" :disabled="saving" @click="emit('close')">Cancelar</AppButton>
          <AppButton :loading="saving" @click="submit">
            {{ isEdit ? 'Mover' : 'Adicionar' }}
          </AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
