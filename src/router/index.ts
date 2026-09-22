import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { authRoutes } from '@/modules/auth'
import { dashboardRoutes } from '@/modules/dashboard'
import { instituteRoutes } from '@/modules/institute'
import { projectRoutes } from '@/modules/project'
import { buildingRoutes } from '@/modules/building'
import { roomRoutes } from '@/modules/room'
import { turmaRoutes } from '@/modules/turma'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth: boolean
    roles?: ('admin' | 'user')[]
    layout?: 'AppLayout' | 'AuthLayout'
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  ...authRoutes,
  ...dashboardRoutes,
  ...instituteRoutes,
  ...projectRoutes,
  ...buildingRoutes,
  ...roomRoutes,
  ...turmaRoutes,
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
  user: '/dashboard',
}

router.beforeEach((to) => {
  const auth = useAuthStore()

  // authGuard: exige sessão para rotas protegidas
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // usuário autenticado não deve ver a tela de login
  if (!to.meta.requiresAuth && auth.isAuthenticated && to.path === '/login') {
    return roleHome[auth.user?.role ?? 'user']
  }

  // roleGuard: bloqueia rotas fora do escopo do role
  if (to.meta.roles && auth.user && !to.meta.roles.includes(auth.user.role)) {
    return roleHome[auth.user.role]
  }

  return true
})

export default router
