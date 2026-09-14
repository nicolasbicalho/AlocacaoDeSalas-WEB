import type { RouteRecordRaw } from 'vue-router'

export const buildingRoutes: RouteRecordRaw[] = [
  {
    path: '/buildings',
    component: () => import('./views/BuildingListView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
  {
    path: '/buildings/new',
    component: () => import('./views/BuildingCreateView.vue'),
    meta: { requiresAuth: true, roles: ['user'], layout: 'AppLayout' },
  },
  {
    path: '/buildings/:id',
    component: () => import('./views/BuildingDetailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
]
