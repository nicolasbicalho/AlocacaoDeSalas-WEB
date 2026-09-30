import type { RouteRecordRaw } from 'vue-router'

/** Filhas de `/buildings/:buildingId` (renderizadas dentro do BuildingShell). */
export const roomBuildingChildren: RouteRecordRaw[] = [
  {
    path: 'rooms',
    component: () => import('./views/RoomListView.vue'),
    meta: { requiresAuth: true, section: 'rooms' },
  },
  {
    path: 'rooms/new',
    component: () => import('./views/RoomCreateView.vue'),
    meta: { requiresAuth: true, roles: ['user'], section: 'rooms', leaf: 'new' },
  },
  {
    path: 'rooms/:roomId',
    component: () => import('./views/RoomDetailView.vue'),
    meta: { requiresAuth: true, section: 'rooms', leaf: 'detail' },
  },
]

/** URL antiga `/rooms/:id` — redireciona para `/buildings/:buildingId/rooms/:roomId`. */
export const roomRoutes: RouteRecordRaw[] = [
  {
    path: '/rooms/:id',
    component: () => import('./views/RoomRedirectView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
]
