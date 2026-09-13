<script setup lang="ts">
import { watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'

const props = withDefaults(
  defineProps<{
    initialValues?: { name: string; code: string }
    loading?: boolean
    readonly?: boolean
    submitLabel?: string
  }>(),
  { loading: false, readonly: false, submitLabel: 'Salvar' },
)

const emit = defineEmits<{ submit: [values: { name: string; code: string }] }>()

const schema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Informe ao menos 2 caracteres'),
    code: z
      .string()
      .min(2, 'Informe ao menos 2 caracteres')
      .max(10, 'No máximo 10 caracteres'),
  }),
)

const { handleSubmit, errors, defineField, setFieldError, resetForm } = useForm({
  validationSchema: schema,
  initialValues: props.initialValues ?? { name: '', code: '' },
})

const [name] = defineField('name')
const [code] = defineField('code')

// código sempre em uppercase (espelha a normalização da API)
watch(code, (value) => {
  if (value && value !== value.toUpperCase()) code.value = value.toUpperCase()
})

// quando os valores iniciais chegam de forma assíncrona (tela de edição), sincroniza o form
watch(
  () => props.initialValues,
  (value) => {
    if (value) resetForm({ values: value })
  },
)

const onSubmit = handleSubmit((values) => emit('submit', values))

// permite à view exibir erros do servidor (ex.: nome/código já existente) inline no campo
defineExpose({
  setServerError: (field: 'name' | 'code', message: string) => setFieldError(field, message),
})
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <AppInput
      v-model="name"
      label="Nome"
      placeholder="Instituto da Computação"
      :error="errors.name"
      :disabled="readonly || loading"
      required
    />
    <AppInput
      v-model="code"
      label="Código"
      placeholder="IC"
      :error="errors.code"
      :disabled="readonly || loading"
      required
    />
    <div v-if="!readonly" class="flex justify-end gap-3">
      <slot name="actions" />
      <AppButton type="submit" :loading="loading">{{ submitLabel }}</AppButton>
    </div>
  </form>
</template>
