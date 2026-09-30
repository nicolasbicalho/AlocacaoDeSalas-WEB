import type { RouteRecordRaw } from 'vue-router'
import { roomBuildingChildren } from '@/modules/room'

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
    // shell do prédio: cabeçalho + abas (Dados / Salas)
    path: '/buildings/:buildingId',
    component: () => import('./views/BuildingShell.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
    children: [
      {
        path: '',
        component: () => import('./views/BuildingDetailView.vue'),
        meta: { requiresAuth: true, section: 'overview' },
      },
      ...roomBuildingChildren,
    ],
  },
]
