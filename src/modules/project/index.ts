import type { RouteRecordRaw } from 'vue-router'
import { turmaProjectChildren } from '@/modules/turma'
import { allocationProjectChildren } from '@/modules/allocation'

export const projectRoutes: RouteRecordRaw[] = [
  {
    path: '/projects',
    component: () => import('./views/ProjectListView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
  {
    path: '/projects/new',
    component: () => import('./views/ProjectCreateView.vue'),
    meta: { requiresAuth: true, roles: ['user'], layout: 'AppLayout' },
  },
  {
    // shell do projeto: cabeçalho + abas (Visão geral / Turmas / Cronograma)
    path: '/projects/:projectId',
    component: () => import('./views/ProjectShell.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
    children: [
      {
        path: '',
        component: () => import('./views/ProjectDetailView.vue'),
        meta: { requiresAuth: true, section: 'overview' },
      },
      ...turmaProjectChildren,
      ...allocationProjectChildren,
    ],
  },
]
