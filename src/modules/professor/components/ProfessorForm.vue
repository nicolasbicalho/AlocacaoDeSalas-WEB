<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { parseFloors, formatFloors, preferenceItems } from '../helpers'
import type { ProfessorPayload } from '../services/professor.service'
import type { IProfessor } from '@/types'

const props = withDefaults(
  defineProps<{
    initialValues?: Pick<IProfessor, 'name' | 'preferences' | 'notes'>
    loading?: boolean
    readonly?: boolean
    submitLabel?: string
  }>(),
  { loading: false, readonly: false, submitLabel: 'Salvar' },
)

const emit = defineEmits<{ submit: [values: ProfessorPayload] }>()

const schema = toTypedSchema(
  z.object({ name: z.string().trim().min(2, 'Informe o nome').max(120, 'No máximo 120 caracteres') }),
)
const { handleSubmit, errors, defineField, setFieldError, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { name: props.initialValues?.name ?? '' },
})
const [name] = defineField('name')

// preferências: em branco = sem preferência
const minBoards = ref('')
const floorsText = ref('')
const avoidCorridorEnd = ref(false)
const notes = ref('')
const minBoardsError = ref('')
const floorsError = ref('')

function load(v?: Pick<IProfessor, 'name' | 'preferences' | 'notes'>) {
  minBoards.value = v?.preferences.minBoards != null ? String(v.preferences.minBoards) : ''
  floorsText.value = formatFloors(v?.preferences.floors)
  avoidCorridorEnd.value = !!v?.preferences.avoidCorridorEnd
  notes.value = v?.notes ?? ''
}
load(props.initialValues)

watch(
  () => props.initialValues,
  (v) => {
    if (!v) return
    resetForm({ values: { name: v.name } })
    load(v)
  },
)

// prévia de como as preferências aparecem nas sugestões de sala
const preview = computed(() => {
  const floors = parseFloors(floorsText.value)
  const boards = Number(minBoards.value)
  return preferenceItems({
    floors: floors ?? [],
    minBoards: Number.isInteger(boards) && boards > 0 ? boards : undefined,
    avoidCorridorEnd: avoidCorridorEnd.value,
  })
})

const onSubmit = handleSubmit((values) => {
  const rawBoards = minBoards.value.trim()
  const boards = rawBoards === '' ? null : Number(rawBoards)
  minBoardsError.value =
    boards !== null && (!Number.isInteger(boards) || boards < 1 || boards > 20) ? 'Informe um inteiro de 1 a 20, ou deixe em branco' : ''
  const floors = parseFloors(floorsText.value)
  floorsError.value = floors === null ? 'Use números separados por vírgula (0 = térreo), de -5 a 100' : ''
  if (minBoardsError.value || floorsError.value || floors === null) return

  emit('submit', {
    name: values.name.trim(),
    preferences: { minBoards: boards, floors, avoidCorridorEnd: avoidCorridorEnd.value },
    notes: notes.value.trim(),
  })
})

defineExpose({
  setServerError: (field: 'name', message: string) => setFieldError(field, message),
})

const textareaClass =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700'
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <AppInput
      v-model="name"
      label="Nome"
      placeholder="Dra. Ana Ribeiro"
      :error="errors.name"
      :disabled="readonly || loading"
      required
    />

    <fieldset class="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <legend class="px-1 text-sm font-medium text-gray-700 dark:text-gray-300">Preferências de sala</legend>
      <p class="-mt-1 text-xs text-gray-500 dark:text-gray-400">
        Não bloqueiam nenhuma alocação: só colocam as salas que atendem o professor no topo das sugestões do cronograma.
        Em branco = sem preferência.
      </p>
      <div class="grid grid-cols-2 gap-3">
        <AppInput
          v-model="minBoards"
          label="Quadros (mínimo)"
          type="number"
          placeholder="ex.: 2"
          :error="minBoardsError"
          :disabled="readonly || loading"
        />
        <AppInput
          v-model="floorsText"
          label="Andares preferidos"
          placeholder="ex.: 0, 1 (0 = térreo)"
          :error="floorsError"
          :disabled="readonly || loading"
        />
      </div>
      <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          v-model="avoidCorridorEnd"
          type="checkbox"
          class="h-4 w-4 accent-primary-600"
          :disabled="readonly || loading"
        />
        Evita sala na extremidade do corredor
      </label>
      <div v-if="preview.length" class="flex flex-wrap gap-1">
        <span
          v-for="item in preview"
          :key="item"
          class="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-800 dark:bg-primary-950/40 dark:text-primary-200"
        >
          {{ item }}
        </span>
      </div>
    </fieldset>

    <label class="flex flex-col gap-1">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Anotações</span>
      <textarea
        v-model="notes"
        rows="2"
        maxlength="1000"
        placeholder="Observações sobre o professor"
        :class="textareaClass"
        :disabled="readonly || loading"
      />
    </label>

    <div v-if="!readonly" class="flex justify-end gap-3">
      <slot name="actions" />
      <AppButton type="submit" :loading="loading">{{ submitLabel }}</AppButton>
    </div>
  </form>
</template>
