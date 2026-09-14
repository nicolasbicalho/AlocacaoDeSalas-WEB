import type { RouteRecordRaw } from 'vue-router'

export const instituteRoutes: RouteRecordRaw[] = [
  {
    path: '/institutes',
    component: () => import('./views/InstituteListView.vue'),
    meta: { requiresAuth: true, roles: ['admin'], layout: 'AppLayout' },
  },
  {
    path: '/institutes/new',
    component: () => import('./views/InstituteCreateView.vue'),
    meta: { requiresAuth: true, roles: ['admin'], layout: 'AppLayout' },
  },
  {
    path: '/institutes/:id',
    component: () => import('./views/InstituteDetailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
]
