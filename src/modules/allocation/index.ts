import type { RouteRecordRaw } from 'vue-router'

/** Filha de `/projects/:projectId` (renderizada dentro do ProjectShell). */
export const allocationProjectChildren: RouteRecordRaw[] = [
  {
    path: 'allocation',
    component: () => import('./views/AllocationView.vue'),
    meta: { requiresAuth: true, section: 'allocation' },
  },
]
