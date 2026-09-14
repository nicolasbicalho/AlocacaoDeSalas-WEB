import type { RouteRecordRaw } from 'vue-router'

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
    path: '/projects/:id',
    component: () => import('./views/ProjectDetailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
]
