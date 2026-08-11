<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout from '@/shared/layouts/AuthLayout.vue'
import AppLayout from '@/shared/layouts/AppLayout.vue'
import AppToast from '@/shared/components/AppToast.vue'

const route = useRoute()
const layout = computed(() => (route.meta.layout === 'AuthLayout' ? AuthLayout : AppLayout))
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
  <AppToast />
</template>
