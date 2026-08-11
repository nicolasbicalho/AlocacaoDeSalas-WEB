import type { RouteRecordRaw } from 'vue-router'

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('./views/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'AuthLayout' },
  },
  {
    path: '/forgot-password',
    component: () => import('./views/ForgotPasswordView.vue'),
    meta: { requiresAuth: false, layout: 'AuthLayout' },
  },
  {
    path: '/reset-password',
    component: () => import('./views/ResetPasswordView.vue'),
    meta: { requiresAuth: false, layout: 'AuthLayout' },
  },
]
