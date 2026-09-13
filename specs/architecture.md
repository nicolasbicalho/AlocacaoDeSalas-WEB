# Arquitetura Geral — Frontend

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Vue 3 (Composition API + `<script setup>`) |
| Build Tool | Vite |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS |
| Roteamento | Vue Router 4 |
| Estado Global | Pinia |
| HTTP Client | Axios |
| Validação de Formulários | VeeValidate + Zod |
| Testes | Vitest + Vue Test Utils |
| Runtime | Node.js 20+ |

## Estrutura de Diretórios

```
src/
├── main.ts                    # Bootstrap da aplicação
├── App.vue                    # Componente raiz
├── assets/
│   └── main.css               # Imports do Tailwind
├── router/
│   └── index.ts               # Definição de rotas + guards
├── stores/
│   ├── auth.ts                # Store de autenticação (Pinia)
│   └── ui.ts                  # Store de estado global de UI (toasts, loading)
├── services/
│   └── api.ts                 # Instância Axios + interceptors
├── types/
│   └── index.ts               # Tipos globais (re-exporta tipos dos módulos)
├── shared/
│   ├── components/            # Componentes reutilizáveis (Button, Input, Modal, etc.)
│   └── layouts/
│       ├── AppLayout.vue      # Layout autenticado (sidebar + header)
│       └── AuthLayout.vue     # Layout de autenticação (centralizado)
└── modules/
    ├── auth/
    │   ├── views/             # Páginas do módulo
    │   ├── components/        # Componentes específicos do módulo
    │   ├── stores/            # Store Pinia do módulo (se necessário)
    │   └── index.ts           # Re-exporta rotas do módulo
    ├── institute/
    ├── user/
    ├── project/
    ├── dataUpload/
    ├── allocation/
    └── report/
```

## Padrão por Módulo

**Regra fundamental: cada módulo frontend corresponde a um domínio de negócio.** Um módulo agrupa views, componentes, store e rotas relacionados ao mesmo contexto.

```
modules/<nome>/
├── views/
│   └── <NomeView>.vue         # Páginas roteáveis (uma por rota)
├── components/
│   └── <NomeComponent>.vue    # Componentes usados apenas neste módulo
├── stores/
│   └── <nome>.store.ts        # Store Pinia (apenas se tiver estado específico)
└── index.ts                   # Exporta as rotas do módulo para o router central
```

### Separação de responsabilidades

| Camada | Responsabilidade |
|--------|-----------------|
| `views/` | Orquestra componentes, conecta store/API, gerencia estado local de página |
| `components/` | Componentes puros ou semi-puros — recebem props, emitem eventos |
| `stores/` | Estado persistente do módulo — cache de dados, seleção ativa |
| `services/api.ts` | Chamadas HTTP — nunca acessa store diretamente |
| `router/` | Definição de rotas e guards de navegação |

## Fluxo de uma Interação

```
Usuário interage com componente
  → View captura evento
  → (se necessário) chama função do store
    → store chama serviço HTTP (api.ts)
      → Axios → AlocacaoDeSalas-API
    → store atualiza estado reativo
  → View re-renderiza via reatividade Vue
```

## Layouts

| Layout | Usado em |
|--------|----------|
| `AuthLayout` | Rotas públicas: login, recuperação de senha |
| `AppLayout` | Todas as rotas protegidas — inclui sidebar de navegação e header |

## Guards de Rota

Dois guards globais no `router/index.ts`:

1. **`authGuard`** — redireciona para `/login` se não há token válido na store
2. **`roleGuard`** — redireciona para a rota home do role se o usuário não tem permissão para a rota

```typescript
// Cada rota define os roles permitidos via meta:
{
  path: '/institutes',
  meta: { requiresAuth: true, roles: ['admin'] }
}
```

## Convenções de Código

### Idioma
Todo o código (variáveis, funções, tipos, props, emits) em **inglês**. Textos visíveis ao usuário em **português**.

### Componentes
- Sempre usar `<script setup lang="ts">`
- Nome dos arquivos: `PascalCase` (ex: `InstituteList.vue`, `LoginView.vue`)
- Componentes de view terminam em `View` (ex: `LoginView.vue`)
- Componentes compartilhados ficam em `src/shared/components/`

### Stores Pinia
- Um arquivo por domínio: `auth.ts`, `project.store.ts`
- Sempre `defineStore` com setup function (não options API)
- Nomes de store: `useAuthStore`, `useProjectStore`

### Tipagem
- Nunca usar `any` — sempre tipar explicitamente
- Tipos de entidade (espelham a API) ficam em `src/types/index.ts`
- Props de componentes sempre tipadas com `defineProps<{...}>()`

### Imports
```typescript
// ✅ Imports absolutos via alias @
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/shared/components/AppButton.vue'

// ❌ Imports relativos longos
import AppButton from '../../../shared/components/AppButton.vue'
```

## Alias de Path

Configurado no `vite.config.ts` e `tsconfig.app.json`:

```
@/ → src/
```

## Variáveis de Ambiente

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Todas as variáveis expostas ao cliente devem ter o prefixo `VITE_`.

## Convenções de Nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Arquivos de componente | `PascalCase` | `InstituteForm.vue` |
| Arquivos de view | `PascalCase` + sufixo `View` | `InstituteListView.vue` |
| Arquivos de store | `camelCase` + sufixo `.store.ts` | `project.store.ts` |
| Arquivos de serviço | `camelCase` + sufixo `.service.ts` | `institute.service.ts` |
| Pastas de módulo | `camelCase` singular | `institute/`, `dataUpload/` |
| Funções composable | prefixo `use` | `useAuthStore`, `usePagination` |
| Rotas (path) | `kebab-case` plural | `/institutes`, `/projects/:id/rooms` |
