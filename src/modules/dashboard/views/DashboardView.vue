<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  user: 'Gerente',
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <h1 class="text-2xl font-bold text-gray-800">Início</h1>
    <p class="text-gray-600">
      Bem-vindo<span v-if="auth.user">, {{ auth.user.name }}</span>!
    </p>
    <p v-if="auth.user" class="text-sm text-gray-500">
      Perfil: {{ roleLabels[auth.user.role] ?? auth.user.role }}
    </p>
    <div class="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
      Os módulos (institutos, projetos, alocações e relatórios) aparecerão aqui conforme forem
      implementados.
    </div>
  </div>
</template>
