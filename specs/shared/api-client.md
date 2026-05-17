# Cliente HTTP — Integração com a API

## Ferramenta

**Axios** — instância centralizada em `src/services/api.ts`.

---

## Configuração da Instância

```typescript
// src/services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // ex: http://localhost:5000/api/v1
  headers: { 'Content-Type': 'application/json' },
})
```

---

## Interceptors

### Request — injeta o `Authorization` header

Antes de cada requisição, lê o `accessToken` do `localStorage` e adiciona o header:

```
Authorization: Bearer <accessToken>
```

### Response — trata erros globais e faz refresh de token

| Situação | Comportamento |
|----------|--------------|
| `401` com `TOKEN_EXPIRED` | Tenta refresh automático e reenvia a requisição original |
| `401` sem refresh possível | Chama `authStore.clear()` e redireciona para `/login` |
| `403` | Redireciona para a rota home do role atual |
| `5xx` | Exibe toast de erro genérico via `uiStore.toast` |

### Lógica de refresh automático

1. Interceptor captura resposta `401` com `error.code === 'TOKEN_EXPIRED'`
2. Chama `POST /auth/refresh` com o `refreshToken` do localStorage
3. Se bem-sucedido: atualiza o `accessToken` no localStorage e na `authStore`, reenvia a requisição original
4. Se falhar (token revogado ou expirado): limpa a store e redireciona para `/login`
5. Requisições paralelas que chegam durante o refresh são enfileiradas e reenviadas juntas

---

## Serviços por Módulo

Cada módulo expõe um serviço HTTP em `src/modules/<nome>/services/<nome>.service.ts`. Os serviços importam a instância `api` e encapsulam as chamadas.

```typescript
// src/modules/department/services/department.service.ts
import api from '@/services/api'
import type { IDepartment, CreateDepartmentDto, PaginatedResponse } from '@/types'

export async function listDepartments(params?: { page?: number; limit?: number; search?: string }) {
  const { data } = await api.get<PaginatedResponse<IDepartment>>('/departments', { params })
  return data
}

export async function createDepartment(dto: CreateDepartmentDto) {
  const { data } = await api.post<{ success: boolean; data: IDepartment }>('/departments', dto)
  return data.data
}
```

### Regras obrigatórias

1. **Serviços não acessam stores** — retornam dados puros; a view ou store decide o que fazer
2. **Serviços não tratam erros** — erros de Axios propagam para a view (que usa try/catch) ou são tratados pelo interceptor global
3. **Tipagem explícita** — todos os retornos de `api.get<T>` têm tipo genérico

---

## Tipos de Resposta

Espelham o formato da API definido em `api-conventions.md`:

```typescript
// src/types/index.ts

interface ApiSuccess<T> {
  success: true
  data: T
}

interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown[]
  }
}
```

---

## Tratamento de Erros nas Views

```typescript
<script setup lang="ts">
import { ref } from 'vue'
import { createDepartment } from '@/modules/department/services/department.service'
import { useUiStore } from '@/stores/ui'
import { isAxiosError } from 'axios'

const ui = useUiStore()
const loading = ref(false)

async function handleSubmit(dto: CreateDepartmentDto) {
  loading.value = true
  try {
    await createDepartment(dto)
    ui.toast({ message: 'Departamento criado com sucesso', variant: 'success' })
  } catch (err) {
    if (isAxiosError(err)) {
      const code = err.response?.data?.error?.code
      if (code === 'DEPARTMENT_NAME_EXISTS') {
        // exibe erro no campo do formulário
        return
      }
    }
    ui.toast({ message: 'Erro inesperado. Tente novamente.', variant: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
```

---

## Upload de Arquivos

Para endpoints `multipart/form-data`:

```typescript
async function uploadFile(projectId: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post(`/projects/${projectId}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
```

---

## Variável de Ambiente

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```
