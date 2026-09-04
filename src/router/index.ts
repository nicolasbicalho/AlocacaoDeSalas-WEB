import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { authRoutes } from '@/modules/auth'
import { dashboardRoutes } from '@/modules/dashboard'
import { departmentRoutes } from '@/modules/department'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth: boolean
    roles?: ('admin' | 'coordinator' | 'professor')[]
    layout?: 'AppLayout' | 'AuthLayout'
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  ...authRoutes,
  ...dashboardRoutes,
  ...departmentRoutes,
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Home de cada role. Por ora todos convergem para /dashboard; conforme os módulos
// (users, projects, ...) forem implementados, ajustar os destinos.
const roleHome: Record<string, string> = {
  admin: '/dashboard',
  coordinator: '/dashboard',
  professor: '/dashboard',
}

router.beforeEach((to) => {
  const auth = useAuthStore()

  // authGuard: exige sessão para rotas protegidas
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // usuário autenticado não deve ver a tela de login
  if (!to.meta.requiresAuth && auth.isAuthenticated && to.path === '/login') {
    return roleHome[auth.user?.role ?? 'professor']
  }

  // roleGuard: bloqueia rotas fora do escopo do role
  if (to.meta.roles && auth.user && !to.meta.roles.includes(auth.user.role)) {
    return roleHome[auth.user.role]
  }

  return true
})

export default router
