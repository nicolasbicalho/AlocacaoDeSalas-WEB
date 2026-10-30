import type { RouteRecordRaw } from 'vue-router'

/** Filha de `/projects/:projectId` (renderizada dentro do ProjectShell). */
export const reportProjectChildren: RouteRecordRaw[] = [
  {
    path: 'reports',
    component: () => import('./views/ReportView.vue'),
    meta: { requiresAuth: true, section: 'reports' },
  },
]
