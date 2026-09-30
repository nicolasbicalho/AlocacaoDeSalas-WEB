import type { RouteRecordRaw } from 'vue-router'

export const auditRoutes: RouteRecordRaw[] = [
  {
    path: '/audit',
    component: () => import('./views/AuditLogView.vue'),
    meta: { requiresAuth: true, roles: ['admin'], layout: 'AppLayout' },
  },
]
