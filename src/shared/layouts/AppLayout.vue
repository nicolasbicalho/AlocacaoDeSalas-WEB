<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { logout as logoutRequest } from '@/modules/auth/services/auth.service'
import AppButton from '@/shared/components/AppButton.vue'

const auth = useAuthStore()
const router = useRouter()
const loggingOut = ref(false)

async function handleLogout() {
  loggingOut.value = true
  const refreshToken = localStorage.getItem('alocacao_refresh_token')
  try {
    if (refreshToken) await logoutRequest(refreshToken)
  } catch {
    // logout é best-effort: limpamos a sessão local independentemente da resposta da API
  } finally {
    auth.clear()
    router.push('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <span class="text-lg font-semibold text-primary-700">AlocaçãoDeSalas</span>
      <div class="flex items-center gap-4">
        <span v-if="auth.user" class="text-sm text-gray-600">{{ auth.user.name }}</span>
        <AppButton variant="ghost" size="sm" :loading="loggingOut" @click="handleLogout">Sair</AppButton>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-6 py-8">
      <slot />
    </main>
  </div>
</template>
