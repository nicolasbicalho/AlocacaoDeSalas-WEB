import type { RouteRecordRaw } from 'vue-router'

/** Filhas de `/projects/:projectId` (renderizadas dentro do ProjectShell). */
export const turmaProjectChildren: RouteRecordRaw[] = [
  {
    path: 'turmas',
    component: () => import('./views/TurmaListView.vue'),
    meta: { requiresAuth: true, section: 'turmas' },
  },
  {
    path: 'turmas/new',
    component: () => import('./views/TurmaCreateView.vue'),
    meta: { requiresAuth: true, roles: ['user'], section: 'turmas', leaf: 'new' },
  },
  {
    // antes de 'turmas/:turmaId', senão "import" seria lido como id
    path: 'turmas/import',
    component: () => import('./views/TurmaImportView.vue'),
    meta: { requiresAuth: true, roles: ['user'], section: 'turmas', leaf: 'import' },
  },
  {
    path: 'turmas/:turmaId',
    component: () => import('./views/TurmaDetailView.vue'),
    meta: { requiresAuth: true, section: 'turmas', leaf: 'detail' },
  },
]

/** URL antiga `/turmas/:id` — redireciona para `/projects/:projectId/turmas/:turmaId`. */
export const turmaRoutes: RouteRecordRaw[] = [
  {
    path: '/turmas/:id',
    component: () => import('./views/TurmaRedirectView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
]
