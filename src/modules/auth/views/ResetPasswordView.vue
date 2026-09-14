<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import AuthCard from '../components/AuthCard.vue'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { resetPassword } from '../services/auth.service'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const loading = ref(false)
const done = ref(false)
const formError = ref('')
const token = ref('')

onMounted(() => {
  const t = route.query.token
  if (!t || typeof t !== 'string') {
    router.replace('/forgot-password')
    return
  }
  token.value = t
})

const schema = toTypedSchema(
  z
    .object({
      newPassword: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
      confirmPassword: z.string().min(1, 'Confirme a senha'),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: 'As senhas não coincidem',
      path: ['confirmPassword'],
    }),
)

const { handleSubmit, errors, defineField } = useForm({ validationSchema: schema })
const [newPassword] = defineField('newPassword')
const [confirmPassword] = defineField('confirmPassword')

const onSubmit = handleSubmit(async (values) => {
  formError.value = ''
  loading.value = true
  try {
    await resetPassword(token.value, values.newPassword)
    done.value = true
    setTimeout(() => router.push('/login'), 2000)
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.code === 'TOKEN_INVALID') {
      formError.value = 'Token inválido ou expirado. Solicite um novo link.'
      return
    }
    ui.toast({ message: 'Erro ao redefinir a senha. Tente novamente.', variant: 'error' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AuthCard title="Redefinir senha">
    <div v-if="done" class="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
      Senha redefinida com sucesso. Redirecionando para o login…
    </div>
    <form v-else class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <AppInput
        v-model="newPassword"
        label="Nova senha"
        type="password"
        placeholder="••••••••"
        :error="errors.newPassword"
        required
      />
      <AppInput
        v-model="confirmPassword"
        label="Confirmar senha"
        type="password"
        placeholder="••••••••"
        :error="errors.confirmPassword"
        required
      />
      <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
        {{ formError }}
      </p>
      <AppButton type="submit" :loading="loading" class="w-full">Redefinir senha</AppButton>
      <RouterLink to="/login" class="text-center text-sm text-primary-600 hover:underline dark:text-primary-400">
        Voltar para login
      </RouterLink>
    </form>
  </AuthCard>
</template>
