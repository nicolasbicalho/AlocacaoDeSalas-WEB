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
/projects/:id             → ProjectDetailView (AppLayout) — roles: admin, user
/projects/:id/upload      → DataUploadView (AppLayout) — roles: user
/projects/:id/allocation  → AllocationView (AppLayout) — roles: user
/projects/:id/reports     → ReportView (AppLayout) — roles: user
```

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

> Por ora todos os roles convergem para `/dashboard`. Conforme os módulos (users, projects, ...) forem implementados, os destinos podem ser especializados por role.

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
