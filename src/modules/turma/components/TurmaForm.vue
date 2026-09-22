<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'
import ScheduleEditor from './ScheduleEditor.vue'
import RequiredAttributesEditor from './RequiredAttributesEditor.vue'
import type { TimeSlot } from '@/types'

interface TurmaValues {
  name: string
  code?: string
  studentCount: number
  professor: string
  requiredAttributes: string[]
  schedule: TimeSlot[]
}

const props = withDefaults(
  defineProps<{
    initialValues?: TurmaValues
    loading?: boolean
    readonly?: boolean
    submitLabel?: string
  }>(),
  { loading: false, readonly: false, submitLabel: 'Salvar' },
)

const emit = defineEmits<{ submit: [values: TurmaValues] }>()

const schema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Informe o nome'),
    code: z.string().max(20, 'No máximo 20 caracteres').optional(),
    professor: z.string().min(2, 'Informe o professor'),
  }),
)

const { handleSubmit, errors, defineField, setFieldError, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    name: props.initialValues?.name ?? '',
    code: props.initialValues?.code ?? '',
    professor: props.initialValues?.professor ?? '',
  },
})

const [name] = defineField('name')
const [code] = defineField('code')
const [professor] = defineField('professor')
const studentCount = ref(
  props.initialValues?.studentCount != null ? String(props.initialValues.studentCount) : '',
)
const studentCountError = ref('')
const requiredAttributes = ref<string[]>(
  props.initialValues?.requiredAttributes ? [...props.initialValues.requiredAttributes] : [],
)
const schedule = ref<TimeSlot[]>(
  props.initialValues?.schedule ? props.initialValues.schedule.map((s) => ({ ...s })) : [],
)

watch(
  () => props.initialValues,
  (v) => {
    if (v) {
      resetForm({ values: { name: v.name, code: v.code ?? '', professor: v.professor } })
      studentCount.value = v.studentCount != null ? String(v.studentCount) : ''
      requiredAttributes.value = [...v.requiredAttributes]
      schedule.value = v.schedule.map((s) => ({ ...s }))
    }
  },
)

const onSubmit = handleSubmit((values) => {
  const count = Number(studentCount.value)
  if (studentCount.value.trim() === '' || !Number.isInteger(count) || count <= 0) {
    studentCountError.value = 'Informe um inteiro maior que zero'
    return
  }
  studentCountError.value = ''
  emit('submit', {
    name: values.name,
    code: values.code?.trim() ? values.code.trim() : undefined,
    professor: values.professor,
    studentCount: count,
    requiredAttributes: requiredAttributes.value,
    schedule: schedule.value,
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
      placeholder="Cálculo I - Turma A"
      :error="errors.name"
      :disabled="readonly || loading"
      required
    />
    <div class="grid grid-cols-2 gap-3">
      <AppInput
        v-model="code"
        label="Código (opcional)"
        placeholder="MAT101-A"
        :error="errors.code"
        :disabled="readonly || loading"
      />
      <AppInput
        v-model="studentCount"
        label="Nº de alunos"
        type="number"
        placeholder="45"
        :error="studentCountError"
        :disabled="readonly || loading"
        required
      />
    </div>
    <AppInput
      v-model="professor"
      label="Professor"
      placeholder="Dra. Silva"
      :error="errors.professor"
      :disabled="readonly || loading"
      required
    />
    <RequiredAttributesEditor v-model="requiredAttributes" :readonly="readonly || loading" />
    <ScheduleEditor v-model="schedule" :readonly="readonly || loading" />
    <div v-if="!readonly" class="flex justify-end gap-3">
      <slot name="actions" />
      <AppButton type="submit" :loading="loading">{{ submitLabel }}</AppButton>
    </div>
  </form>
</template>
