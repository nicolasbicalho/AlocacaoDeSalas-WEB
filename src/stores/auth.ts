import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isCoordinator = computed(() => user.value?.role === 'coordinator')
  const isProfessor = computed(() => user.value?.role === 'professor')

  function setAuth(payload: { user: AuthUser; accessToken: string; refreshToken: string }) {
    user.value = payload.user
    accessToken.value = payload.accessToken
    localStorage.setItem('alocacao_access_token', payload.accessToken)
    localStorage.setItem('alocacao_refresh_token', payload.refreshToken)
  }

  function clear() {
    user.value = null
    accessToken.value = null
    localStorage.removeItem('alocacao_access_token')
    localStorage.removeItem('alocacao_refresh_token')
  }

  function initFromStorage() {
    const token = localStorage.getItem('alocacao_access_token')
    if (token) {
      accessToken.value = token
    }
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    isAdmin,
    isCoordinator,
    isProfessor,
    setAuth,
    clear,
    initFromStorage,
  }
})
