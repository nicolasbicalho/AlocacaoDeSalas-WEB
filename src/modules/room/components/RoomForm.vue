<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'
import FeatureCheckboxes from '@/shared/components/FeatureCheckboxes.vue'
import type { RoomFeature } from '@/types'

interface RoomValues {
  name: string
  code: string
  capacity: number
  features: RoomFeature[]
}

const props = withDefaults(
  defineProps<{
    initialValues?: RoomValues
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

watch(
  () => props.initialValues,
  (v) => {
    if (v) {
      resetForm({ values: { name: v.name, code: v.code } })
      capacity.value = v.capacity != null ? String(v.capacity) : ''
      features.value = [...v.features]
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
  emit('submit', { ...values, capacity: cap, features: features.value })
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
      hint="Marque o que a sala possui. As turmas só são alocadas em salas que atendem aos seus requisitos."
      :readonly="readonly || loading"
    />
    <div v-if="!readonly" class="flex justify-end gap-3">
      <slot name="actions" />
      <AppButton type="submit" :loading="loading">{{ submitLabel }}</AppButton>
    </div>
  </form>
</template>
