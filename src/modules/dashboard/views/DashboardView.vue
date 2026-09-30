<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import UserDashboard from '../components/UserDashboard.vue'
import AdminDashboard from '../components/AdminDashboard.vue'

const auth = useAuthStore()

const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? '')
const subtitle = computed(() =>
  auth.isAdmin ? 'Visão geral da plataforma.' : 'Como está o semestre do seu instituto.',
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Olá<span v-if="firstName">, {{ firstName }}</span>
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
    </div>

    <AdminDashboard v-if="auth.isAdmin" />
    <UserDashboard v-else-if="auth.isUser" />
  </div>
</template>
