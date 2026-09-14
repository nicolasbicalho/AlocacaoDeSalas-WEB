<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'

const props = withDefaults(
  defineProps<{
    initialValues?: { name: string; semester: string }
    loading?: boolean
    readonly?: boolean
    submitLabel?: string
  }>(),
  { loading: false, readonly: false, submitLabel: 'Salvar' },
)

const emit = defineEmits<{ submit: [values: { name: string; semester: string }] }>()

const schema = toTypedSchema(
  z.object({
    name: z.string().min(3, 'Informe ao menos 3 caracteres'),
    semester: z.string().regex(/^\d{4}\.\d$/, 'Use o formato AAAA.N (ex: 2025.2)'),
  }),
)

const { handleSubmit, errors, defineField, setFieldError, resetForm } = useForm({
  validationSchema: schema,
  initialValues: props.initialValues ?? { name: '', semester: '' },
})

const [name] = defineField('name')
const [semester] = defineField('semester')

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
  setServerError: (field: 'name' | 'semester', message: string) => setFieldError(field, message),
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
    <div v-if="!readonly" class="flex justify-end gap-3">
      <slot name="actions" />
      <AppButton type="submit" :loading="loading">{{ submitLabel }}</AppButton>
    </div>
  </form>
</template>
