<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'

interface BuildingValues {
  name: string
  code: string
  latitude?: number
  longitude?: number
}

const props = withDefaults(
  defineProps<{
    initialValues?: BuildingValues
    loading?: boolean
    readonly?: boolean
    submitLabel?: string
  }>(),
  { loading: false, readonly: false, submitLabel: 'Salvar' },
)

const emit = defineEmits<{ submit: [values: BuildingValues] }>()

// nome/código via VeeValidate; lat/long são opcionais e tratados como texto (parse no submit)
const schema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Informe ao menos 2 caracteres'),
    code: z.string().min(2, 'Informe ao menos 2 caracteres').max(10, 'No máximo 10 caracteres'),
  }),
)

const { handleSubmit, errors, defineField, setFieldError, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { name: props.initialValues?.name ?? '', code: props.initialValues?.code ?? '' },
})

const [name] = defineField('name')
const [code] = defineField('code')
const latitude = ref(props.initialValues?.latitude != null ? String(props.initialValues.latitude) : '')
const longitude = ref(props.initialValues?.longitude != null ? String(props.initialValues.longitude) : '')

watch(code, (value) => {
  if (value && value !== value.toUpperCase()) code.value = value.toUpperCase()
})

watch(
  () => props.initialValues,
  (value) => {
    if (value) {
      resetForm({ values: { name: value.name, code: value.code } })
      latitude.value = value.latitude != null ? String(value.latitude) : ''
      longitude.value = value.longitude != null ? String(value.longitude) : ''
    }
  },
)

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    ...values,
    latitude: latitude.value.trim() === '' ? undefined : Number(latitude.value),
    longitude: longitude.value.trim() === '' ? undefined : Number(longitude.value),
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
      placeholder="Bloco A"
      :error="errors.name"
      :disabled="readonly || loading"
      required
    />
    <AppInput
      v-model="code"
      label="Código"
      placeholder="BA"
      :error="errors.code"
      :disabled="readonly || loading"
      required
    />
    <div class="grid grid-cols-2 gap-3">
      <AppInput v-model="latitude" label="Latitude (opcional)" placeholder="-19.9" :disabled="readonly || loading" />
      <AppInput v-model="longitude" label="Longitude (opcional)" placeholder="-43.9" :disabled="readonly || loading" />
    </div>
    <div v-if="!readonly" class="flex justify-end gap-3">
      <slot name="actions" />
      <AppButton type="submit" :loading="loading">{{ submitLabel }}</AppButton>
    </div>
  </form>
</template>
