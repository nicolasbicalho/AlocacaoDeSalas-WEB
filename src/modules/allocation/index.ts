import type { RouteRecordRaw } from 'vue-router'

export const allocationRoutes: RouteRecordRaw[] = [
  {
    path: '/projects/:projectId/allocation',
    component: () => import('./views/AllocationView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
]
