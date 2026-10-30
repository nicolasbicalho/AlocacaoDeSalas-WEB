import { onBeforeUnmount, ref } from 'vue'

/**
 * Modo "expandido" de um trecho da página (o cronograma): o trecho passa a ocupar toda a área
 * da janela, sem a tela cheia do navegador. Esc recolhe.
 *
 * `canCloseOnEscape` evita que o Esc de um modal aberto também recolha o trecho.
 */
export function useExpandedView(canCloseOnEscape: () => boolean = () => true) {
  const expanded = ref(false)

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && expanded.value && canCloseOnEscape()) collapse()
  }

  function expand() {
    expanded.value = true
    document.body.style.overflow = 'hidden' // a página por trás não rola junto
    document.addEventListener('keydown', onKeydown)
  }

  function collapse() {
    expanded.value = false
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKeydown)
  }

  function toggle() {
    if (expanded.value) collapse()
    else expand()
  }

  onBeforeUnmount(() => {
    if (expanded.value) collapse()
  })

  return { expanded, toggle, collapse }
}
