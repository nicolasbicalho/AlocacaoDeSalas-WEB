import type { RouteRecordRaw } from 'vue-router'

export const turmaRoutes: RouteRecordRaw[] = [
  {
    path: '/projects/:projectId/turmas',
    component: () => import('./views/TurmaListView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
  {
    path: '/projects/:projectId/turmas/new',
    component: () => import('./views/TurmaCreateView.vue'),
    meta: { requiresAuth: true, roles: ['user'], layout: 'AppLayout' },
  },
  {
    path: '/turmas/:id',
    component: () => import('./views/TurmaDetailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
]
