<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { logout as logoutRequest } from '@/modules/auth/services/auth.service'
import AppButton from '@/shared/components/AppButton.vue'
import ThemeToggle from '@/shared/components/ThemeToggle.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const navItems = computed(() => [
  { to: '/dashboard', label: 'Início' },
  ...(auth.isAdmin ? [{ to: '/institutes', label: 'Institutos' }] : []),
  { to: '/projects', label: 'Projetos' },
  { to: '/buildings', label: 'Prédios' },
  { to: '/professors', label: 'Professores' },
  ...(auth.isAdmin ? [{ to: '/audit', label: 'Auditoria' }] : []),
])

// seção ativa por prefixo: em /projects/:id/turmas/... o item "Projetos" continua destacado
function isActive(prefix: string): boolean {
  return route.path === prefix || route.path.startsWith(`${prefix}/`)
}

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
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center gap-6">
        <span class="text-lg font-semibold text-primary-700 dark:text-primary-400">AlocaçãoDeSalas</span>
        <nav class="flex items-center gap-4 text-sm">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="transition"
            :class="
              isActive(item.to)
                ? 'font-medium text-primary-700 dark:text-primary-400'
                : 'text-gray-600 hover:text-primary-700 dark:text-gray-300 dark:hover:text-primary-400'
            "
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <ThemeToggle />
        <span v-if="auth.user" class="text-sm text-gray-600 dark:text-gray-300">{{ auth.user.name }}</span>
        <AppButton variant="ghost" size="sm" :loading="loggingOut" @click="handleLogout">Sair</AppButton>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-6 py-8">
      <slot />
    </main>
  </div>
</template>
