# Roteamento

## Ferramenta

**Vue Router 4** — modo `history` (HTML5).

---

## Estrutura de Rotas

```
/                         → redireciona baseado no role após login
/login                    → LoginView (AuthLayout)
/forgot-password          → ForgotPasswordView (AuthLayout)
/reset-password           → ResetPasswordView (AuthLayout)

/dashboard                → DashboardView (AppLayout) — roles: todos

/users                    → UserListView (AppLayout) — roles: admin
/users/new                → UserCreateView (AppLayout) — roles: admin

/institutes               → InstituteListView (AppLayout) — roles: admin
/institutes/new           → InstituteCreateView (AppLayout) — roles: admin
/institutes/:id           → InstituteDetailView (AppLayout) — roles: admin, user

/projects                 → ProjectListView (AppLayout) — roles: admin, user
/projects/new             → ProjectCreateView (AppLayout) — roles: user
/projects/:projectId      → ProjectShell (cabeçalho + abas) — roles: admin, user
    ''                    → ProjectDetailView   [aba Visão geral]
    turmas                → TurmaListView       [aba Turmas]
    turmas/new            → TurmaCreateView     [aba Turmas] — roles: user
    turmas/import         → TurmaImportView     [aba Turmas] — roles: user (antes de :turmaId)
    turmas/:turmaId       → TurmaDetailView     [aba Turmas]
    allocation            → AllocationView      [aba Cronograma] — edição só user
    reports               → ReportView          [aba Relatórios] — planejado (módulo 08)

/buildings                → BuildingListView (AppLayout) — roles: admin, user
/buildings/new            → BuildingCreateView (AppLayout) — roles: user
/buildings/:buildingId    → BuildingShell (cabeçalho + abas) — roles: admin, user
    ''                    → BuildingDetailView  [aba Dados]
    rooms                 → RoomListView        [aba Salas]
    rooms/new             → RoomCreateView      [aba Salas] — roles: user
    rooms/:roomId         → RoomDetailView      [aba Salas]

/professors               → ProfessorListView (AppLayout) — roles: admin, user
/professors/new           → ProfessorCreateView (AppLayout) — roles: user
/professors/:professorId  → ProfessorDetailView (AppLayout) — roles: admin, user

/turmas/:id               → redireciona para /projects/:projectId/turmas/:id   (URL antiga)
/rooms/:id                → redireciona para /buildings/:buildingId/rooms/:id  (URL antiga)

/audit                    → AuditLogView (AppLayout) — roles: admin
```

> O link **"Auditoria"** (`/audit`) aparece no menu superior do `AppLayout` somente para `admin` — ver [09-audit.md](../modules/09-audit.md).

### Rotas de contexto (shells)

Projeto e prédio são **espaços de trabalho**: a rota pai (`/projects/:projectId`, `/buildings/:buildingId`) renderiza um *shell* com breadcrumb, título, status e **abas**, e as páginas internas são rotas filhas renderizadas no `<RouterView>` do shell.

- O shell carrega a entidade **uma vez** e a entrega às abas por `provide/inject` (`useProjectContext()` / `useBuildingContext()`); as abas não refazem essa busca e atualizam o cabeçalho ao salvar (`setProject` / `setBuilding`). Existência e acesso (404/403) são tratados só no shell.
- Cada rota filha declara em `meta` a aba ativa (`section`: `overview` | `turmas` | `allocation` | `rooms`) e, se for folha, o tipo (`leaf`: `new` | `detail`). O shell monta o breadcrumb a partir disso; páginas de detalhe informam o próprio nome via `leafLabel`.
- As abas mostram contadores (turmas do projeto, salas do prédio), recarregados a cada navegação dentro do shell.
- O `meta` das filhas é mesclado com o do pai: `roles` e `layout` vêm do shell, e as páginas `new` restringem a `user`.
- Criar/desativar uma turma ou sala **volta para a aba da lista**; salvar edições permanece na página com um toast.

### Menu superior

O item ativo do menu é calculado por **prefixo de caminho** (ex.: qualquer rota sob `/projects/…` destaca "Projetos"), não pelo `active-class` do `RouterLink` — que só considera o registro de rota exato e perderia o destaque dentro dos shells.

---

## Definição no Router

Rotas são definidas em `src/router/index.ts`. Cada módulo exporta seu array de rotas e o router central os agrega:

```typescript
// src/modules/institute/index.ts
import type { RouteRecordRaw } from 'vue-router'

export const instituteRoutes: RouteRecordRaw[] = [
  {
    path: '/institutes',
    component: () => import('./views/InstituteListView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/institutes/new',
    component: () => import('./views/InstituteCreateView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/institutes/:id',
    component: () => import('./views/InstituteDetailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'] },
  },
]
```

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from '@/modules/auth'
import { instituteRoutes } from '@/modules/institute'
// ...

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    ...instituteRoutes,
    // ...
  ],
})
```

---

## Meta de Rota

```typescript
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth: boolean
    roles?: ('admin' | 'user')[]
    layout?: 'AppLayout' | 'AuthLayout'
  }
}
```

---

## Guards Globais

### `authGuard`

Executado em `router.beforeEach`. Se `meta.requiresAuth === true` e não há usuário na `authStore`, redireciona para `/login`.

### `roleGuard`

Executado após `authGuard`. Se `meta.roles` está definido e o role do usuário não está incluído, redireciona para a rota home do seu role:

| Role | Home |
|------|------|
| `admin` | `/dashboard` |
| `user` | `/dashboard` |

> Todos os roles convergem para `/dashboard`, que exibe um painel diferente por role (ver [Módulo 10 — Dashboard](../modules/10-dashboard.md)).

### Redirect após login

Após login bem-sucedido, o router verifica `route.query.redirect` e navega para a rota original. Se não houver redirect, navega para a home do role.

---

## Lazy Loading

Todas as views usam **dynamic import** para lazy loading:

```typescript
component: () => import('./views/InstituteListView.vue')
```

Nunca importar views diretamente no router — impede o code splitting.

---

## Convenções de Path

- `kebab-case` para todos os paths: `/forgot-password`, `/data-upload`
- IDs de recurso como params: `/projects/:id`, `/institutes/:id`
- Sub-recursos como paths aninhados: `/projects/:id/allocation`
- Rotas de criação como `/new` ao invés de `/create`
