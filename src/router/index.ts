import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth: boolean
    roles?: ('admin' | 'coordinator' | 'professor')[]
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/modules/auth/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/forgot-password',
    component: () => import('@/modules/auth/views/ForgotPasswordView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password',
    component: () => import('@/modules/auth/views/ResetPasswordView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    redirect: '/projects',
  },
  {
    path: '/departments',
    component: () => import('@/modules/department/views/DepartmentListView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/departments/new',
    component: () => import('@/modules/department/views/DepartmentCreateView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/departments/:id',
    component: () => import('@/modules/department/views/DepartmentDetailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'coordinator'] },
  },
  {
    path: '/projects',
    component: () => import('@/modules/project/views/ProjectListView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'coordinator', 'professor'] },
  },
  {
    path: '/projects/new',
    component: () => import('@/modules/project/views/ProjectCreateView.vue'),
    meta: { requiresAuth: true, roles: ['coordinator'] },
  },
  {
    path: '/projects/:id',
    component: () => import('@/modules/project/views/ProjectDetailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'coordinator', 'professor'] },
  },
  {
    path: '/projects/:id/upload',
    component: () => import('@/modules/dataUpload/views/DataUploadView.vue'),
    meta: { requiresAuth: true, roles: ['coordinator'] },
  },
  {
    path: '/projects/:id/allocation',
    component: () => import('@/modules/allocation/views/AllocationView.vue'),
    meta: { requiresAuth: true, roles: ['coordinator', 'professor'] },
  },
  {
    path: '/projects/:id/reports',
    component: () => import('@/modules/report/views/ReportView.vue'),
    meta: { requiresAuth: true, roles: ['coordinator', 'professor'] },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/projects',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const roleHome: Record<string, string> = {
  admin: '/departments',
  coordinator: '/projects',
  professor: '/projects',
}

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (!to.meta.requiresAuth && auth.isAuthenticated && (to.path === '/login')) {
    return next(roleHome[auth.user?.role ?? 'professor'])
  }

  if (to.meta.roles && auth.user && !to.meta.roles.includes(auth.user.role)) {
    return next(roleHome[auth.user.role])
  }

  next()
})

export default router
