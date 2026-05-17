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

/departments              → DepartmentListView (AppLayout) — roles: admin
/departments/new          → DepartmentCreateView (AppLayout) — roles: admin
/departments/:id          → DepartmentDetailView (AppLayout) — roles: admin, coordinator

/projects                 → ProjectListView (AppLayout) — roles: admin, coordinator, professor
/projects/new             → ProjectCreateView (AppLayout) — roles: coordinator
/projects/:id             → ProjectDetailView (AppLayout) — roles: admin, coordinator, professor
/projects/:id/upload      → DataUploadView (AppLayout) — roles: coordinator
/projects/:id/allocation  → AllocationView (AppLayout) — roles: coordinator, professor
/projects/:id/reports     → ReportView (AppLayout) — roles: coordinator, professor
```

---

## Definição no Router

Rotas são definidas em `src/router/index.ts`. Cada módulo exporta seu array de rotas e o router central os agrega:

```typescript
// src/modules/department/index.ts
import type { RouteRecordRaw } from 'vue-router'

export const departmentRoutes: RouteRecordRaw[] = [
  {
    path: '/departments',
    component: () => import('./views/DepartmentListView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/departments/new',
    component: () => import('./views/DepartmentCreateView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/departments/:id',
    component: () => import('./views/DepartmentDetailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'coordinator'] },
  },
]
```

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { authRoutes } from '@/modules/auth'
import { departmentRoutes } from '@/modules/department'
// ...

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes,
    ...departmentRoutes,
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
    roles?: ('admin' | 'coordinator' | 'professor')[]
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
| `admin` | `/users` |
| `coordinator` | `/projects` |
| `professor` | `/projects` |

### Redirect após login

Após login bem-sucedido, o router verifica `route.query.redirect` e navega para a rota original. Se não houver redirect, navega para a home do role.

---

## Lazy Loading

Todas as views usam **dynamic import** para lazy loading:

```typescript
component: () => import('./views/DepartmentListView.vue')
```

Nunca importar views diretamente no router — impede o code splitting.

---

## Convenções de Path

- `kebab-case` para todos os paths: `/forgot-password`, `/data-upload`
- IDs de recurso como params: `/projects/:id`, `/departments/:id`
- Sub-recursos como paths aninhados: `/projects/:id/allocation`
- Rotas de criação como `/new` ao invés de `/create`
