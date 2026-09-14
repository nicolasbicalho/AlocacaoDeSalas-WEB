<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import AuthCard from '../components/AuthCard.vue'
import AppInput from '@/shared/components/AppInput.vue'
import AppButton from '@/shared/components/AppButton.vue'
import { login } from '../services/auth.service'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const loading = ref(false)
const formError = ref('')

const schema = toTypedSchema(
  z.object({
    email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  }),
)

const { handleSubmit, errors, defineField } = useForm({ validationSchema: schema })
const [email] = defineField('email')
const [password] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  formError.value = ''
  loading.value = true
  try {
    const result = await login(values.email, values.password)
    auth.setAuth({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err.response?.data?.error?.code
      if (code === 'INVALID_CREDENTIALS') {
        formError.value = 'E-mail ou senha incorretos'
        return
      }
      if (code === 'ACCOUNT_INACTIVE') {
        formError.value = 'Sua conta está inativa. Contate o administrador.'
        return
      }
    }
    ui.toast({ message: 'Erro ao entrar. Tente novamente.', variant: 'error' })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AuthCard title="Entrar">
    <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
      <AppInput
        v-model="email"
        label="E-mail"
        type="email"
        placeholder="voce@instituicao.edu.br"
        :error="errors.email"
        required
      />
      <AppInput
        v-model="password"
        label="Senha"
        type="password"
        placeholder="••••••••"
        :error="errors.password"
        required
      />
      <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
        {{ formError }}
      </p>
      <AppButton type="submit" :loading="loading" class="w-full">Entrar</AppButton>
      <RouterLink
        to="/forgot-password"
        class="text-center text-sm text-primary-600 hover:underline dark:text-primary-400"
      >
        Esqueci minha senha
      </RouterLink>
    </form>
  </AuthCard>
</template>
