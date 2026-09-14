import { ref } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'alocacao_theme'

function apply(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function readInitial(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* localStorage indisponível */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// estado único do tema (singleton em nível de módulo)
const theme = ref<Theme>(readInitial())
apply(theme.value)

export function useTheme() {
  function setTheme(value: Theme): void {
    theme.value = value
    apply(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
  }

  function toggle(): void {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggle }
}
