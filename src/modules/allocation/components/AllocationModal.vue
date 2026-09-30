<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { isAxiosError } from 'axios'
import AppButton from '@/shared/components/AppButton.vue'
import {
  createAllocation,
  moveAllocation,
  type AllocationCreatePayload,
  type AllocationMovePayload,
} from '../services/allocation.service'
import {
  DAY_OPTIONS,
  EVENT_COLORS,
  DEFAULT_EVENT_COLOR,
  weekdayFromDate,
  dayLabel,
  formatDateBR,
} from '../helpers'
import type { ITurma, IRoom, IAllocation, AllocationType, EventColor, WeekDay } from '@/types'

const props = defineProps<{
  open: boolean
  projectId: string
  turmas: ITurma[]
  rooms: IRoom[]
  semester: { startDate: string; endDate: string }
  /** quando presente, o modal edita/move este evento */
  editing?: IAllocation | null
  /** valores iniciais ao criar (ex.: clique numa célula livre da grade) */
  prefill?: { roomId?: string; date?: string; start?: string; end?: string } | null
}>()

const emit = defineEmits<{ saved: [IAllocation]; close: [] }>()

type Link = 'turma' | 'free'

const isEdit = computed(() => !!props.editing)
// evento de texto livre não pode virar recorrente (recorrente é sempre de turma)
const lockedToSingle = computed(() => isEdit.value && !props.editing?.turmaId)

const type = ref<AllocationType>('weekly')
const link = ref<Link>('turma')
const turmaId = ref('')
const title = ref('')
const roomId = ref('')
const day = ref<WeekDay>('mon')
const date = ref('')
const start = ref('08:00')
const end = ref('10:00')
const color = ref<EventColor>(DEFAULT_EVENT_COLOR)

const saving = ref(false)
const error = ref('')

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700'

const derivedDay = computed<WeekDay | null>(() => (date.value ? weekdayFromDate(date.value) : null))

function resetFromProps() {
  error.value = ''
  const a = props.editing
  if (a) {
    type.value = a.type
    link.value = a.turmaId ? 'turma' : 'free'
    turmaId.value = a.turmaId ?? props.turmas[0]?.id ?? ''
    title.value = a.title ?? ''
    roomId.value = a.roomId
    day.value = a.timeSlot.day
    date.value = a.date ?? props.prefill?.date ?? props.semester.startDate
    start.value = a.timeSlot.start
    end.value = a.timeSlot.end
    color.value = a.color ?? DEFAULT_EVENT_COLOR
    return
  }
  const p = props.prefill
  const hasTurmas = props.turmas.length > 0
  type.value = hasTurmas ? 'weekly' : 'single'
  link.value = hasTurmas ? 'turma' : 'free'
  turmaId.value = props.turmas[0]?.id ?? ''
  title.value = ''
  roomId.value = p?.roomId ?? props.rooms[0]?.id ?? ''
  date.value = p?.date ?? props.semester.startDate
  day.value = (p?.date && weekdayFromDate(p.date)) || 'mon'
  start.value = p?.start ?? '08:00'
  end.value = p?.end ?? '10:00'
  color.value = DEFAULT_EVENT_COLOR
}

watch(() => props.open, (open) => { if (open) resetFromProps() })

// recorrente é sempre de turma
watch(type, (t) => { if (t === 'weekly') link.value = 'turma' })

const validationMessage = computed(() => {
  if (!roomId.value) return 'Selecione uma sala.'
  if (!start.value || !end.value) return 'Informe horário de início e fim.'
  if (start.value >= end.value) return 'O fim deve ser depois do início.'
  if (type.value === 'weekly' || link.value === 'turma') {
    if (!turmaId.value) return 'Selecione uma turma.'
  } else if (title.value.trim().length < 2) {
    return 'Informe o título do evento (ao menos 2 caracteres).'
  }
  if (type.value === 'single') {
    if (!date.value) return 'Informe a data do evento.'
    if (date.value < props.semester.startDate || date.value > props.semester.endDate) {
      return `A data precisa estar dentro do semestre (${formatDateBR(props.semester.startDate)} a ${formatDateBR(props.semester.endDate)}).`
    }
    if (!derivedDay.value) return 'A data cai em um domingo — escolha um dia letivo (Seg–Sáb).'
  }
  return ''
})

function buildPayload(): AllocationCreatePayload {
  if (type.value === 'weekly') {
    return {
      turmaId: turmaId.value,
      roomId: roomId.value,
      timeSlot: { day: day.value, start: start.value, end: end.value },
      type: 'weekly',
    }
  }
  return {
    ...(link.value === 'turma' ? { turmaId: turmaId.value } : { title: title.value.trim() }),
    roomId: roomId.value,
    timeSlot: { day: derivedDay.value!, start: start.value, end: end.value },
    type: 'single',
    date: date.value,
    color: color.value,
  }
}

async function submit() {
  error.value = ''
  const invalid = validationMessage.value
  if (invalid) { error.value = invalid; return }

  const payload = buildPayload()
  saving.value = true
  try {
    let result: IAllocation
    if (props.editing) {
      // a turma não muda; o título só vale para evento de texto livre
      const move: AllocationMovePayload = {
        roomId: payload.roomId,
        timeSlot: payload.timeSlot,
        type: payload.type,
        ...(payload.date ? { date: payload.date } : {}),
        ...(payload.color ? { color: payload.color } : {}),
        ...(payload.title ? { title: payload.title } : {}),
      }
      result = await moveAllocation(props.projectId, props.editing.id, move)
    } else {
      result = await createAllocation(props.projectId, payload)
    }
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
      return 'A turma já tem outro evento nesse horário.'
    case 'ALLOCATION_TURMA_NOT_IN_PROJECT':
      return 'A turma não pertence a este projeto.'
    case 'ALLOCATION_DATE_OUT_OF_RANGE':
      return 'A data está fora do período do semestre.'
    case 'ALLOCATION_WEEKLY_REQUIRES_TURMA':
      return 'Somente eventos de turma podem ser recorrentes.'
    case 'VALIDATION_ERROR':
      return 'Dados inválidos. Verifique horário, data (Seg–Sáb) e título.'
    case 'PROJECT_NOT_EDITABLE':
      return 'O projeto está encerrado e não pode ser alterado.'
    default:
      return 'Não foi possível salvar o evento.'
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {{ isEdit ? 'Editar evento' : 'Adicionar evento' }}
        </h2>

        <div class="mt-4 flex flex-col gap-3">
          <!-- tipo -->
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</span>
            <div class="flex gap-4 text-sm text-gray-700 dark:text-gray-200">
              <label class="flex items-center gap-1.5" :class="lockedToSingle ? 'opacity-50' : ''">
                <input v-model="type" type="radio" value="weekly" :disabled="lockedToSingle" /> Recorrente
              </label>
              <label class="flex items-center gap-1.5">
                <input v-model="type" type="radio" value="single" /> Único
              </label>
            </div>
            <span class="text-xs text-gray-400 dark:text-gray-500">
              <template v-if="type === 'weekly'">Repete toda semana, durante todo o semestre.</template>
              <template v-else>Acontece em uma única data (ex.: palestra, defesa, reposição).</template>
            </span>
          </div>

          <!-- vínculo (só no único) -->
          <div v-if="type === 'single'" class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Evento de</span>
            <div class="flex gap-4 text-sm text-gray-700 dark:text-gray-200">
              <label class="flex items-center gap-1.5" :class="isEdit ? 'opacity-60' : ''">
                <input v-model="link" type="radio" value="turma" :disabled="isEdit || turmas.length === 0" /> Uma turma
              </label>
              <label class="flex items-center gap-1.5" :class="isEdit ? 'opacity-60' : ''">
                <input v-model="link" type="radio" value="free" :disabled="isEdit" /> Texto livre
              </label>
            </div>
          </div>

          <label v-if="type === 'weekly' || link === 'turma'" class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Turma</span>
            <select v-model="turmaId" :disabled="isEdit" :class="inputClass">
              <option v-for="t in turmas" :key="t.id" :value="t.id">
                {{ t.name }}<template v-if="t.code"> ({{ t.code }})</template> — {{ t.professor }}
              </option>
            </select>
            <span v-if="isEdit" class="text-xs text-gray-400 dark:text-gray-500">
              A turma não muda ao editar — crie um novo evento para outra turma.
            </span>
          </label>

          <label v-else class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Título</span>
            <input v-model="title" type="text" maxlength="120" placeholder="Ex.: Palestra de Inteligência Artificial" :class="inputClass" />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Sala</span>
            <select v-model="roomId" :class="inputClass">
              <option v-for="r in rooms" :key="r.id" :value="r.id">
                {{ r.name }} ({{ r.code }}) — cap. {{ r.capacity }}
              </option>
            </select>
          </label>

          <label v-if="type === 'weekly'" class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Dia da semana</span>
            <select v-model="day" :class="inputClass">
              <option v-for="d in DAY_OPTIONS" :key="d.value" :value="d.value">{{ d.long }}</option>
            </select>
          </label>

          <label v-else class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Data</span>
            <input v-model="date" type="date" :min="semester.startDate" :max="semester.endDate" :class="inputClass" />
            <span v-if="derivedDay" class="text-xs text-gray-400 dark:text-gray-500">{{ dayLabel(derivedDay) }}</span>
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

          <!-- cor (só no único) -->
          <div v-if="type === 'single'" class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Cor na grade</span>
            <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor do evento">
              <button
                v-for="c in EVENT_COLORS"
                :key="c.value"
                type="button"
                role="radio"
                :aria-checked="color === c.value"
                :aria-label="c.label"
                :title="c.label"
                class="h-7 w-7 rounded-full ring-offset-2 transition dark:ring-offset-gray-800"
                :class="[c.classes.swatch, color === c.value ? 'ring-2 ring-gray-900 dark:ring-white' : 'opacity-80 hover:opacity-100']"
                @click="color = c.value"
              />
            </div>
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
          <AppButton :loading="saving" @click="submit">{{ isEdit ? 'Salvar' : 'Adicionar' }}</AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
