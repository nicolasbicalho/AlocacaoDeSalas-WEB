<script setup lang="ts">
const props = defineProps<{ page: number; totalPages: number; total: number }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()

function go(target: number) {
  if (target >= 1 && target <= props.totalPages && target !== props.page) {
    emit('update:page', target)
  }
}
</script>

<template>
  <div class="flex items-center justify-between text-sm text-gray-600">
    <span>{{ total }} registro(s)</span>
    <div class="flex items-center gap-2">
      <button
        class="rounded border border-gray-300 px-2 py-1 transition hover:bg-gray-50 disabled:opacity-50"
        :disabled="page <= 1"
        @click="go(page - 1)"
      >
        Anterior
      </button>
      <span>Página {{ page }} de {{ Math.max(totalPages, 1) }}</span>
      <button
        class="rounded border border-gray-300 px-2 py-1 transition hover:bg-gray-50 disabled:opacity-50"
        :disabled="page >= totalPages"
        @click="go(page + 1)"
      >
        Próxima
      </button>
    </div>
  </div>
</template>
