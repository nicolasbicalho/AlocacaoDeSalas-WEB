import type { RouteRecordRaw } from 'vue-router'

export const departmentRoutes: RouteRecordRaw[] = [
  {
    path: '/departments',
    component: () => import('./views/DepartmentListView.vue'),
    meta: { requiresAuth: true, roles: ['admin'], layout: 'AppLayout' },
  },
  {
    path: '/departments/new',
    component: () => import('./views/DepartmentCreateView.vue'),
    meta: { requiresAuth: true, roles: ['admin'], layout: 'AppLayout' },
  },
  {
    path: '/departments/:id',
    component: () => import('./views/DepartmentDetailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'coordinator'], layout: 'AppLayout' },
  },
]
