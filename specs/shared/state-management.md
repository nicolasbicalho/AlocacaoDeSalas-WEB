# Gerenciamento de Estado

## Ferramenta

**Pinia** — store oficial do Vue 3. Todos os stores usam a **Setup API** (não Options API).

---

## Estrutura de Stores

### Stores globais (`src/stores/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `auth.ts` | Usuário autenticado, tokens, login/logout |
| `ui.ts` | Toasts, estado de loading global |

### Stores de módulo (`src/modules/<nome>/stores/`)

Criados apenas quando o módulo precisa de estado persistente entre navegações. Ex: `project.store.ts` pode manter o projeto ativo selecionado.

---

## Convenções

### Definição de store

Sempre usar `defineStore` com setup function:

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IUser } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<IUser | null>(null)
  const accessToken = ref<string | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function setAuth(payload: { user: IUser; accessToken: string }) {
    user.value = payload.user
    accessToken.value = payload.accessToken
  }

  function clear() {
    user.value = null
    accessToken.value = null
  }

  return { user, accessToken, isAuthenticated, isAdmin, setAuth, clear }
})
```

### Regras obrigatórias

1. **Sem chamadas HTTP dentro do store** — HTTP fica em `src/services/api.ts` ou serviços de módulo. O store apenas armazena e transforma dados.
2. **Nomes de store únicos** — o primeiro argumento do `defineStore` é o ID; usar o nome do arquivo sem extensão.
3. **Exportar sempre com `use` prefix** — `useAuthStore`, `useProjectStore`.
4. **Não importar store dentro de outro store** — comunicação entre stores via composable na view.
5. **Persistência de token** — `accessToken` e `refreshToken` são persistidos em `localStorage` manualmente no `auth.ts`.

---

## Store de Autenticação (`auth.ts`)

### Estado

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user` | `IUser \| null` | Dados do usuário autenticado |
| `accessToken` | `string \| null` | JWT de curta duração |

### Getters

| Getter | Tipo | Descrição |
|--------|------|-----------|
| `isAuthenticated` | `boolean` | `true` se há token |
| `isAdmin` | `boolean` | `true` se role === 'admin' |
| `isCoordinator` | `boolean` | `true` se role === 'coordinator' |
| `isProfessor` | `boolean` | `true` se role === 'professor' |

### Actions

| Action | Descrição |
|--------|-----------|
| `setAuth(user, accessToken)` | Persiste dados após login |
| `setUser(user)` | Define apenas o usuário (usado ao restaurar a sessão via `/auth/me`) |
| `clear()` | Limpa estado (logout) |
| `initFromStorage()` | Restaura o `accessToken` do localStorage na inicialização do app |

### Persistência

- `accessToken` → `localStorage` (chave: `alocacao_access_token`)
- `refreshToken` → `localStorage` (chave: `alocacao_refresh_token`)
- O `refreshToken` **não** é armazenado no store — apenas no localStorage, consumido pelo interceptor do Axios.
- **Restauração da sessão:** `initFromStorage()` restaura apenas o `accessToken`. No bootstrap (`main.ts`), havendo token, o app chama `GET /auth/me` e popula o usuário via `setUser()` antes de montar — assim os guards e o header têm `role`/`name` já na primeira navegação. Se a chamada falhar (token inválido mesmo após tentativa de refresh), a sessão é limpa.

---

## Store de UI (`ui.ts`)

### Estado

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `toasts` | `Toast[]` | Fila de notificações |

### Tipos

```typescript
interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'warning' | 'info'
  duration?: number  // ms, default: 4000
}
```

### Actions

| Action | Descrição |
|--------|-----------|
| `toast(options)` | Adiciona um toast à fila |
| `removeToast(id)` | Remove um toast pelo id |

---

## Padrão de uso nas Views

```typescript
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/modules/project/stores/project.store'

const auth = useAuthStore()
const projectStore = useProjectStore()
</script>
```
