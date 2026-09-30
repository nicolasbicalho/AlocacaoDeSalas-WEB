<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'
import type { ProjectPayload } from '../services/project.service'

const props = withDefaults(
  defineProps<{
    initialValues?: ProjectPayload
    loading?: boolean
    readonly?: boolean
    submitLabel?: string
  }>(),
  { loading: false, readonly: false, submitLabel: 'Salvar' },
)

const emit = defineEmits<{ submit: [values: ProjectPayload] }>()

const MAX_DAYS = 366
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data')

const schema = toTypedSchema(
  z
    .object({
      name: z.string().min(3, 'Informe ao menos 3 caracteres'),
      semester: z.string().regex(/^\d{4}\.\d$/, 'Use o formato AAAA.N (ex: 2025.2)'),
      startDate: dateField,
      endDate: dateField,
    })
    .superRefine((v, ctx) => {
      if (!v.startDate || !v.endDate) return
      if (v.endDate <= v.startDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'O término deve ser depois do início' })
        return
      }
      const days = (Date.parse(v.endDate) - Date.parse(v.startDate)) / 86_400_000
      if (days > MAX_DAYS) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: `O período não pode passar de ${MAX_DAYS} dias` })
      }
    }),
)

const empty: ProjectPayload = { name: '', semester: '', startDate: '', endDate: '' }

const { handleSubmit, errors, defineField, setFieldError, resetForm } = useForm({
  validationSchema: schema,
  initialValues: props.initialValues ?? empty,
})

const [name] = defineField('name')
const [semester] = defineField('semester')
const [startDate] = defineField('startDate')
const [endDate] = defineField('endDate')

// sincroniza o form quando os valores iniciais chegam de forma assíncrona (tela de detalhe)
watch(
  () => props.initialValues,
  (value) => {
    if (value) resetForm({ values: value })
  },
)

const onSubmit = handleSubmit((values) => emit('submit', values))

// permite à view exibir erros do servidor (ex.: semestre já existente) inline no campo
defineExpose({
  setServerError: (field: keyof ProjectPayload, message: string) => setFieldError(field, message),
})
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <AppInput
      v-model="name"
      label="Nome"
      placeholder="2025/2"
      :error="errors.name"
      :disabled="readonly || loading"
      required
    />
    <AppInput
      v-model="semester"
      label="Semestre"
      placeholder="2025.2"
      :error="errors.semester"
      :disabled="readonly || loading"
      required
    />
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <AppInput
        v-model="startDate"
        label="Início do semestre"
        type="date"
        :error="errors.startDate"
        :disabled="readonly || loading"
        required
      />
      <AppInput
        v-model="endDate"
        label="Término do semestre"
        type="date"
        :error="errors.endDate"
        :disabled="readonly || loading"
        required
      />
    </div>
    <div v-if="!readonly" class="flex justify-end gap-3">
      <slot name="actions" />
      <AppButton type="submit" :loading="loading">{{ submitLabel }}</AppButton>
    </div>
  </form>
</template>
