<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'
import ScheduleEditor from './ScheduleEditor.vue'
import FeatureCheckboxes from '@/shared/components/FeatureCheckboxes.vue'
import { TURMA_CATEGORIES } from '@/shared/constants/turmaCategories'
import type { RoomFeature, TimeSlot, TurmaCategory } from '@/types'

// campos espelham a planilha que o gerente recebe: disciplina, código, horário, setor, professor, anotações
export interface TurmaValues {
  name: string
  code: string
  category: TurmaCategory
  sector?: string
  notes?: string
  /** null = "a definir" */
  studentCount: number | null
  professor: string
  requiredFeatures: RoomFeature[]
  schedule: TimeSlot[]
}

const props = withDefaults(
  defineProps<{
    initialValues?: Partial<TurmaValues>
    loading?: boolean
    readonly?: boolean
    submitLabel?: string
  }>(),
  { loading: false, readonly: false, submitLabel: 'Salvar' },
)

const emit = defineEmits<{ submit: [values: TurmaValues] }>()

const schema = toTypedSchema(
  z.object({
    name: z.string().trim().min(2, 'Informe a disciplina'),
    code: z.string().trim().min(1, 'Informe o código da turma').max(20, 'No máximo 20 caracteres'),
    professor: z.string().trim().min(2, 'Informe o professor'),
    sector: z.string().trim().max(80, 'No máximo 80 caracteres').optional(),
  }),
)

function textValues(v?: Partial<TurmaValues>) {
  return { name: v?.name ?? '', code: v?.code ?? '', professor: v?.professor ?? '', sector: v?.sector ?? '' }
}

const { handleSubmit, errors, defineField, setFieldError, resetForm } = useForm({
  validationSchema: schema,
  initialValues: textValues(props.initialValues),
})

const [name] = defineField('name')
const [code] = defineField('code')
const [professor] = defineField('professor')
const [sector] = defineField('sector')
const category = ref<TurmaCategory>(props.initialValues?.category ?? 'graduacao')
const notes = ref(props.initialValues?.notes ?? '')
const studentCount = ref(props.initialValues?.studentCount != null ? String(props.initialValues.studentCount) : '')
const studentCountError = ref('')
const requiredFeatures = ref<RoomFeature[]>([...(props.initialValues?.requiredFeatures ?? [])])
const schedule = ref<TimeSlot[]>((props.initialValues?.schedule ?? []).map((s) => ({ ...s })))

watch(
  () => props.initialValues,
  (v) => {
    if (!v) return
    resetForm({ values: textValues(v) })
    category.value = v.category ?? 'graduacao'
    notes.value = v.notes ?? ''
    studentCount.value = v.studentCount != null ? String(v.studentCount) : ''
    requiredFeatures.value = [...(v.requiredFeatures ?? [])]
    schedule.value = (v.schedule ?? []).map((s) => ({ ...s }))
  },
)

const onSubmit = handleSubmit((values) => {
  // vazio = "a definir": o nº de alunos costuma chegar depois da planilha
  const raw = studentCount.value.trim()
  const count = raw === '' ? null : Number(raw)
  if (count !== null && (!Number.isInteger(count) || count <= 0)) {
    studentCountError.value = 'Informe um inteiro maior que zero, ou deixe em branco'
    return
  }
  studentCountError.value = ''
  emit('submit', {
    name: values.name.trim(),
    code: values.code.trim(),
    category: category.value,
    sector: values.sector?.trim() ?? '',
    notes: notes.value.trim(),
    professor: values.professor.trim(),
    studentCount: count,
    requiredFeatures: requiredFeatures.value,
    schedule: schedule.value,
  })
})

defineExpose({
  setServerError: (field: 'name' | 'code', message: string) => setFieldError(field, message),
})

const textareaClass =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-700'
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <AppInput
      v-model="name"
      label="Disciplina"
      placeholder="Cálculo I"
      :error="errors.name"
      :disabled="readonly || loading"
      required
    />
    <div class="grid grid-cols-2 gap-3">
      <AppInput
        v-model="code"
        label="Código da turma"
        placeholder="MAT101-A"
        :error="errors.code"
        :disabled="readonly || loading"
        required
      />
      <AppInput
        v-model="studentCount"
        label="Nº de alunos"
        type="number"
        placeholder="a definir"
        :error="studentCountError"
        :disabled="readonly || loading"
      />
    </div>

    <fieldset class="flex flex-col gap-1">
      <legend class="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</legend>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="c in TURMA_CATEGORIES"
          :key="c.value"
          class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors"
          :class="[
            category === c.value
              ? 'border-primary-300 bg-primary-50 text-primary-800 dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-200'
              : 'border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-300',
            readonly || loading ? 'cursor-default opacity-80' : 'cursor-pointer',
          ]"
        >
          <input v-model="category" type="radio" :value="c.value" class="accent-primary-600" :disabled="readonly || loading" />
          {{ c.label }}
        </label>
      </div>
    </fieldset>

    <div class="grid grid-cols-2 gap-3">
      <AppInput
        v-model="professor"
        label="Professor"
        placeholder="Dra. Silva"
        :error="errors.professor"
        :disabled="readonly || loading"
        required
      />
      <AppInput
        v-model="sector"
        label="Setor (departamento)"
        placeholder="DMAT"
        :error="errors.sector"
        :disabled="readonly || loading"
      />
    </div>

    <label class="flex flex-col gap-1">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Anotações</span>
      <textarea
        v-model="notes"
        rows="2"
        maxlength="1000"
        placeholder="Preferências e observações, como vieram da planilha"
        :class="textareaClass"
        :disabled="readonly || loading"
      />
    </label>

    <FeatureCheckboxes
      v-model="requiredFeatures"
      label="Requisitos de sala"
      hint="Marque o que a sala precisa ter para receber esta turma."
      :readonly="readonly || loading"
    />
    <ScheduleEditor v-model="schedule" :readonly="readonly || loading" />
    <div v-if="!readonly" class="flex justify-end gap-3">
      <slot name="actions" />
      <AppButton type="submit" :loading="loading">{{ submitLabel }}</AppButton>
    </div>
  </form>
</template>
