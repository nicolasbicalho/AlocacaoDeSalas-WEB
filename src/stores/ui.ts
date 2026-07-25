import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])

  function toast(options: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).slice(2)
    const duration = options.duration ?? 4000
    toasts.value.push({ ...options, id, duration })
    setTimeout(() => removeToast(id), duration)
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, toast, removeToast }
})
