<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AuthCard from '../components/AuthCard.vue'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { forgotPassword } from '../services/auth.service'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const loading = ref(false)
const submitted = ref(false)
const devResetToken = ref<string | undefined>(undefined)

const schema = toTypedSchema(
  z.object({
    email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  }),
)

const { handleSubmit, errors, defineField } = useForm({ validationSchema: schema })
const [email] = defineField('email')

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  try {
    const data = await forgotPassword(values.email)
    devResetToken.value = data.resetToken
    submitted.value = true
  } catch {
    ui.toast({ message: 'Erro ao solicitar recuperação. Tente novamente.', variant: 'error' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AuthCard title="Recuperar senha" subtitle="Informe seu e-mail para receber as instruções">
    <div v-if="submitted" class="flex flex-col gap-4">
      <p class="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
        Se o e-mail estiver cadastrado, você receberá as instruções.
      </p>
      <div v-if="devResetToken" class="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        <p class="font-semibold">Token de teste (ambiente de desenvolvimento):</p>
        <code class="break-all">{{ devResetToken }}</code>
        <RouterLink
          :to="`/reset-password?token=${devResetToken}`"
          class="mt-2 block font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          Redefinir senha com este token →
        </RouterLink>
      </div>
      <RouterLink to="/login" class="text-center text-sm text-primary-600 hover:underline dark:text-primary-400">
        Voltar para login
      </RouterLink>
    </div>
    <form v-else class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <AppInput
        v-model="email"
        label="E-mail"
        type="email"
        placeholder="voce@instituicao.edu.br"
        :error="errors.email"
        required
      />
      <AppButton type="submit" :loading="loading" class="w-full">Enviar</AppButton>
      <RouterLink to="/login" class="text-center text-sm text-primary-600 hover:underline dark:text-primary-400">
        Voltar para login
      </RouterLink>
    </form>
  </AuthCard>
</template>
