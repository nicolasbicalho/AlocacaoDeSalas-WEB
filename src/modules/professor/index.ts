import type { RouteRecordRaw } from 'vue-router'

/** Cadastro de professores do instituto (módulo 11) — professor não é role de login. */
export const professorRoutes: RouteRecordRaw[] = [
  {
    path: '/professors',
    component: () => import('./views/ProfessorListView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
  {
    path: '/professors/new',
    component: () => import('./views/ProfessorCreateView.vue'),
    meta: { requiresAuth: true, roles: ['user'], layout: 'AppLayout' },
  },
  {
    path: '/professors/:professorId',
    component: () => import('./views/ProfessorDetailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
]
