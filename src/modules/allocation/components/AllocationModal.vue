<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { isAxiosError } from 'axios'
import { watchDebounced } from '@vueuse/core'
import AppButton from '@/shared/components/AppButton.vue'
import {
  createAllocation,
  moveAllocation,
  getRoomSuggestions,
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
import { preferenceBadge, capacityText, roomWarnings, type Tone } from '../suggestions'
import { preferenceItems } from '@/modules/professor/helpers'
import { featureLabel } from '@/shared/constants/roomFeatures'
import type {
  ITurma,
  IRoom,
  IBuilding,
  IAllocation,
  AllocationType,
  EventColor,
  WeekDay,
  RoomSuggestions,
} from '@/types'

const props = defineProps<{
  open: boolean
  projectId: string
  turmas: ITurma[]
  rooms: IRoom[]
  /** nomes dos prédios nas sugestões de sala */
  buildings?: IBuilding[]
  semester: { startDate: string; endDate: string }
  /** quando presente, o modal edita/move este evento */
  editing?: IAllocation | null
  /** valores iniciais ao criar (ex.: clique numa célula livre da grade) */
  prefill?: { turmaId?: string; roomId?: string; date?: string; start?: string; end?: string } | null
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
  // sala vinda da edição ou da célula clicada na grade é escolha do gerente: a sugestão não a troca
  roomChosen.value = !!props.editing || !!props.prefill?.roomId
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
  turmaId.value =
    p?.turmaId && props.turmas.some((t) => t.id === p.turmaId) ? p.turmaId : (props.turmas[0]?.id ?? '')
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

// ---------- sugestão de salas (turma + horário → salas livres e compatíveis, melhor escolha primeiro) ----------

const suggestions = ref<RoomSuggestions | null>(null)
const suggestionsLoading = ref(false)
const suggestionsError = ref('')
let suggestionsRequest = 0
// enquanto o gerente não escolhe a sala (ex.: atalho "Alocar"), a melhor sugestão vem pré-selecionada
const roomChosen = ref(false)

function chooseRoom(id: string) {
  roomId.value = id
  roomChosen.value = true
}

function exclude() {
  return props.editing ? { excludeId: props.editing.id } : {}
}

// só há sugestão para evento de turma com horário válido (texto livre não tem nº de alunos nem professor)
const suggestionParams = computed(() => {
  if (!props.open) return null
  const hasTurma = type.value === 'weekly' || link.value === 'turma'
  if (!hasTurma || !turmaId.value || !start.value || !end.value || start.value >= end.value) return null
  if (type.value === 'weekly') {
    return { turmaId: turmaId.value, type: 'weekly' as const, day: day.value, start: start.value, end: end.value, ...exclude() }
  }
  if (!date.value || !derivedDay.value) return null
  if (date.value < props.semester.startDate || date.value > props.semester.endDate) return null
  return { turmaId: turmaId.value, type: 'single' as const, date: date.value, start: start.value, end: end.value, ...exclude() }
})

async function fetchSuggestions() {
  const params = suggestionParams.value
  const request = ++suggestionsRequest
  if (!params) {
    suggestions.value = null
    return
  }
  suggestionsLoading.value = true
  suggestionsError.value = ''
  try {
    const result = await getRoomSuggestions(props.projectId, params)
    if (request === suggestionsRequest) {
      suggestions.value = result
      const best = result.rooms.find((r) => r.available && r.fits)
      if (!roomChosen.value && best && props.rooms.some((r) => r.id === best.roomId)) roomId.value = best.roomId
    }
  } catch {
    if (request === suggestionsRequest) {
      suggestions.value = null
      suggestionsError.value = 'Não foi possível carregar as sugestões de sala.'
    }
  } finally {
    if (request === suggestionsRequest) suggestionsLoading.value = false
  }
}

watchDebounced(() => JSON.stringify(suggestionParams.value), fetchSuggestions, { debounce: 250 })
watch(() => props.open, (open) => { if (!open) suggestions.value = null })

const MAX_SUGGESTIONS = 4
const fitting = computed(() => (suggestions.value?.rooms ?? []).filter((r) => r.available && r.fits))
const topSuggestions = computed(() => fitting.value.slice(0, MAX_SUGGESTIONS))
const hiddenSummary = computed(() => {
  const rooms = suggestions.value?.rooms ?? []
  const parts: string[] = []
  const moreFitting = fitting.value.length - topSuggestions.value.length
  const unfit = rooms.filter((r) => r.available && !r.fits).length
  const occupied = rooms.filter((r) => !r.available).length
  if (moreFitting > 0) parts.push(`+${moreFitting} que ${moreFitting === 1 ? 'serve' : 'servem'}`)
  if (unfit) parts.push(`${unfit} ${unfit === 1 ? 'livre não serve' : 'livres não servem'}`)
  if (occupied) parts.push(`${occupied} ${occupied === 1 ? 'ocupada' : 'ocupadas'}`)
  return parts.join(' · ')
})
const professorPrefs = computed(() => preferenceItems(suggestions.value?.professor?.preferences))
const selectedWarnings = computed(() => {
  const evaluated = suggestions.value?.rooms.find((r) => r.roomId === roomId.value)
  return evaluated ? roomWarnings(evaluated, suggestions.value!.turma.studentCount) : []
})

const buildingNames = computed(() => new Map((props.buildings ?? []).map((b) => [b.id, b.name])))
function buildingName(id: string): string {
  return buildingNames.value.get(id) ?? ''
}

const TONE_CLASSES: Record<Tone, string> = {
  ok: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  bad: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  unknown: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

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
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
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

          <!-- sugestão de salas: aparece depois de turma, dia/data e horário -->
          <section
            v-if="suggestionParams"
            class="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40"
            aria-label="Salas sugeridas"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-x-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Salas sugeridas</span>
              <span v-if="suggestions" class="text-xs text-gray-500 dark:text-gray-400">
                {{ suggestions.turma.studentCount !== null ? `${suggestions.turma.studentCount} alunos` : 'nº de alunos a definir' }}<template
                  v-if="suggestions.turma.requiredFeatures.length"
                > · exige {{ suggestions.turma.requiredFeatures.map(featureLabel).join(', ') }}</template>
              </span>
            </div>
            <p v-if="suggestions?.professor && professorPrefs.length" class="text-xs text-gray-500 dark:text-gray-400">
              {{ suggestions.professor.name }} prefere: {{ professorPrefs.join(' · ') }}
            </p>
            <p v-if="suggestionsError" class="text-xs text-red-600 dark:text-red-400">{{ suggestionsError }}</p>
            <p v-else-if="!suggestions" class="text-xs text-gray-400 dark:text-gray-500">Buscando salas…</p>
            <template v-else>
              <ul v-if="topSuggestions.length" class="flex flex-col gap-1.5" :class="suggestionsLoading ? 'opacity-60' : ''">
                <li v-for="s in topSuggestions" :key="s.roomId">
                  <button
                    type="button"
                    class="w-full rounded-md border px-3 py-2 text-left text-sm transition-colors"
                    :class="roomId === s.roomId
                      ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-400 dark:border-primary-600 dark:bg-primary-950/40'
                      : 'border-gray-200 bg-white hover:border-primary-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-primary-700'"
                    :aria-pressed="roomId === s.roomId"
                    @click="chooseRoom(s.roomId)"
                  >
                    <span class="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span class="font-medium text-gray-800 dark:text-gray-100">
                        {{ s.name }}<span v-if="buildingName(s.buildingId)" class="font-normal text-gray-500 dark:text-gray-400"> · {{ buildingName(s.buildingId) }}</span>
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ capacityText(s) }}</span>
                    </span>
                    <span v-if="s.preferences.length" class="mt-1 flex flex-wrap gap-1">
                      <span
                        v-for="p in s.preferences"
                        :key="p.key"
                        class="rounded-full px-1.5 py-0.5 text-xs"
                        :class="TONE_CLASSES[preferenceBadge(p, s).tone]"
                      >
                        {{ preferenceBadge(p, s).text }}
                      </span>
                    </span>
                  </button>
                </li>
              </ul>
              <p v-else class="text-xs text-amber-700 dark:text-amber-400">
                Nenhuma sala livre comporta a turma com as características exigidas.
              </p>
              <p v-if="suggestions.turma.studentCount === null" class="text-xs text-amber-700 dark:text-amber-400">
                Nº de alunos a definir: a capacidade não foi verificada.
              </p>
              <p v-if="hiddenSummary" class="text-xs text-gray-400 dark:text-gray-500">Fora da lista: {{ hiddenSummary }}</p>
            </template>
          </section>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Sala</span>
            <select v-model="roomId" :class="inputClass" @change="roomChosen = true">
              <option v-for="r in rooms" :key="r.id" :value="r.id">
                {{ r.name }} ({{ r.code }}) — cap. {{ r.capacity }}
              </option>
            </select>
          </label>
          <ul
            v-if="selectedWarnings.length"
            class="flex flex-col gap-0.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
          >
            <li v-for="w in selectedWarnings" :key="w">⚠ {{ w }}</li>
          </ul>

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
