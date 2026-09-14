import type { RouteRecordRaw } from 'vue-router'

export const roomRoutes: RouteRecordRaw[] = [
  {
    path: '/buildings/:buildingId/rooms',
    component: () => import('./views/RoomListView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
  {
    path: '/buildings/:buildingId/rooms/new',
    component: () => import('./views/RoomCreateView.vue'),
    meta: { requiresAuth: true, roles: ['user'], layout: 'AppLayout' },
  },
  {
    path: '/rooms/:id',
    component: () => import('./views/RoomDetailView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'user'], layout: 'AppLayout' },
  },
]
