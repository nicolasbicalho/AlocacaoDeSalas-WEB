<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'
import FeatureCheckboxes from '@/shared/components/FeatureCheckboxes.vue'
import type { RoomFeature } from '@/types'

export interface RoomValues {
  name: string
  code: string
  capacity: number
  features: RoomFeature[]
  /** atributos de preferência — null = não informado */
  floor: number | null
  boardCount: number | null
  corridorEnd: boolean | null
}

type CorridorChoice = '' | 'sim' | 'nao'

const props = withDefaults(
  defineProps<{
    initialValues?: Partial<RoomValues> & Pick<RoomValues, 'name' | 'code' | 'capacity' | 'features'>
    loading?: boolean
    readonly?: boolean
    submitLabel?: string
  }>(),
  { loading: false, readonly: false, submitLabel: 'Salvar' },
)

const emit = defineEmits<{ submit: [values: RoomValues] }>()

// nome/código via VeeValidate; capacidade tratada como texto (parse manual); características via checkboxes
const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Informe o nome'),
    code: z.string().min(1, 'Informe o código').max(20, 'No máximo 20 caracteres'),
  }),
)

const { handleSubmit, errors, defineField, setFieldError, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { name: props.initialValues?.name ?? '', code: props.initialValues?.code ?? '' },
})

const [name] = defineField('name')
const [code] = defineField('code')
const capacity = ref(props.initialValues?.capacity != null ? String(props.initialValues.capacity) : '')
const capacityError = ref('')
const features = ref<RoomFeature[]>(
  props.initialValues?.features ? [...props.initialValues.features] : [],
)
// andar/quadros/extremidade: em branco = não informado (a preferência fica "desconhecida", não atendida)
const floor = ref('')
const boardCount = ref('')
const corridorEnd = ref<CorridorChoice>('')
const floorError = ref('')
const boardCountError = ref('')

function loadPreferenceAttrs(v?: Partial<RoomValues>) {
  floor.value = v?.floor != null ? String(v.floor) : ''
  boardCount.value = v?.boardCount != null ? String(v.boardCount) : ''
  corridorEnd.value = v?.corridorEnd == null ? '' : v.corridorEnd ? 'sim' : 'nao'
}
loadPreferenceAttrs(props.initialValues)

function optionalInt(raw: string, min: number, max: number): number | null | undefined {
  const text = raw.trim()
  if (text === '') return null
  const n = Number(text)
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined
}

watch(
  () => props.initialValues,
  (v) => {
    if (v) {
      resetForm({ values: { name: v.name, code: v.code } })
      capacity.value = v.capacity != null ? String(v.capacity) : ''
      features.value = [...v.features]
      loadPreferenceAttrs(v)
    }
  },
)

const onSubmit = handleSubmit((values) => {
  const cap = Number(capacity.value)
  if (capacity.value.trim() === '' || !Number.isInteger(cap) || cap <= 0) {
    capacityError.value = 'Informe um inteiro maior que zero'
    return
  }
  capacityError.value = ''
  const floorValue = optionalInt(floor.value, -5, 100)
  const boardValue = optionalInt(boardCount.value, 0, 20)
  floorError.value = floorValue === undefined ? 'Informe um inteiro de -5 a 100 (0 = térreo)' : ''
  boardCountError.value = boardValue === undefined ? 'Informe um inteiro de 0 a 20' : ''
  if (floorValue === undefined || boardValue === undefined) return
  emit('submit', {
    ...values,
    capacity: cap,
    features: features.value,
    floor: floorValue,
    boardCount: boardValue,
    corridorEnd: corridorEnd.value === '' ? null : corridorEnd.value === 'sim',
  })
})

defineExpose({
  setServerError: (field: 'name' | 'code', message: string) => setFieldError(field, message),
})
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <AppInput
      v-model="name"
      label="Nome"
      placeholder="Sala 101"
      :error="errors.name"
      :disabled="readonly || loading"
      required
    />
    <AppInput
      v-model="code"
      label="Código"
      placeholder="101"
      :error="errors.code"
      :disabled="readonly || loading"
      required
    />
    <AppInput
      v-model="capacity"
      label="Capacidade"
      type="number"
      placeholder="40"
      :error="capacityError"
      :disabled="readonly || loading"
      required
    />
    <FeatureCheckboxes
      v-model="features"
      label="Características"
      hint="Marque o que a sala possui. Projetor e ar-condicionado não entram: todas as salas têm."
      :readonly="readonly || loading"
    />
    <fieldset class="flex flex-col gap-3">
      <legend class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Para as preferências dos professores</legend>
      <p class="-mt-1 text-xs text-gray-500 dark:text-gray-400">
        Não bloqueiam alocações: só ordenam as sugestões de sala. Em branco = não informado.
      </p>
      <div class="grid grid-cols-3 gap-3">
        <AppInput
          v-model="floor"
          label="Andar"
          type="number"
          placeholder="0 = térreo"
          :error="floorError"
          :disabled="readonly || loading"
        />
        <AppInput
          v-model="boardCount"
          label="Quadros"
          type="number"
          placeholder="ex.: 2"
          :error="boardCountError"
          :disabled="readonly || loading"
        />
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Extremidade do corredor</span>
          <select
            v-model="corridorEnd"
            :disabled="readonly || loading"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700"
          >
            <option value="">Não informado</option>
            <option value="sim">Sim, fica na extremidade</option>
            <option value="nao">Não</option>
          </select>
        </label>
      </div>
    </fieldset>
    <div v-if="!readonly" class="flex justify-end gap-3">
      <slot name="actions" />
      <AppButton type="submit" :loading="loading">{{ submitLabel }}</AppButton>
    </div>
  </form>
</template>
