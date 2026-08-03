import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
      },
      {
        path: 'columns',
        name: 'ColumnsList',
        component: () => import('@/views/columns/ColumnsList.vue'),
      },
      {
        path: 'columns/new',
        name: 'ColumnNew',
        component: () => import('@/views/columns/ColumnForm.vue'),
      },
      {
        path: 'columns/:id/edit',
        name: 'ColumnEdit',
        component: () => import('@/views/columns/ColumnForm.vue'),
      },
      {
        path: 'announcements',
        name: 'AnnouncementsList',
        component: () => import('@/views/announcements/AnnouncementsList.vue'),
      },
      {
        path: 'announcements/new',
        name: 'AnnouncementNew',
        component: () => import('@/views/announcements/AnnouncementForm.vue'),
      },
      {
        path: 'announcements/:id/edit',
        name: 'AnnouncementEdit',
        component: () => import('@/views/announcements/AnnouncementForm.vue'),
      },
      {
        path: 'admins',
        name: 'AdminsList',
        component: () => import('@/views/admins/AdminsList.vue'),
      },
      {
        path: 'admins/new',
        name: 'AdminNew',
        component: () => import('@/views/admins/AdminForm.vue'),
      },
      {
        path: 'admins/:id/edit',
        name: 'AdminEdit',
        component: () => import('@/views/admins/AdminForm.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Rehydrate user from token on every navigation when user object is missing
  if (auth.isAuthenticated && !auth.user) {
    await auth.rehydrate()
  }

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'Login' && auth.isAuthenticated) {
    return { name: 'Dashboard' }
  }
})

export default router
