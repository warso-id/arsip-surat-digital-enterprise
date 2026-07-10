import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true, title: 'Login' }
  },
  {
    path: '/biometric-verify',
    name: 'BiometricVerify',
    component: () => import('@/views/auth/BiometricVerify.vue'),
    meta: { guest: true, title: 'Verifikasi Biometrik' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Dashboard' }
  },
  {
    path: '/surat-masuk',
    name: 'SuratMasuk',
    component: () => import('@/views/surat-masuk/SuratMasukList.vue'),
    meta: { requiresAuth: true, title: 'Surat Masuk' }
  },
  {
    path: '/surat-masuk/create',
    name: 'SuratMasukCreate',
    component: () => import('@/views/surat-masuk/SuratMasukForm.vue'),
    meta: { requiresAuth: true, title: 'Tambah Surat Masuk' }
  },
  {
    path: '/surat-masuk/:id',
    name: 'SuratMasukDetail',
    component: () => import('@/views/surat-masuk/SuratMasukDetail.vue'),
    meta: { requiresAuth: true, title: 'Detail Surat Masuk' }
  },
  {
    path: '/surat-masuk/:id/edit',
    name: 'SuratMasukEdit',
    component: () => import('@/views/surat-masuk/SuratMasukForm.vue'),
    meta: { requiresAuth: true, title: 'Edit Surat Masuk' }
  },
  {
    path: '/surat-keluar',
    name: 'SuratKeluar',
    component: () => import('@/views/surat-keluar/SuratKeluarList.vue'),
    meta: { requiresAuth: true, title: 'Surat Keluar' }
  },
  {
    path: '/surat-keluar/create',
    name: 'SuratKeluarCreate',
    component: () => import('@/views/surat-keluar/SuratKeluarForm.vue'),
    meta: { requiresAuth: true, title: 'Tambah Surat Keluar' }
  },
  {
    path: '/surat-keluar/:id',
    name: 'SuratKeluarDetail',
    component: () => import('@/views/surat-keluar/SuratKeluarDetail.vue'),
    meta: { requiresAuth: true, title: 'Detail Surat Keluar' }
  },
  {
    path: '/disposisi',
    name: 'Disposisi',
    component: () => import('@/views/disposisi/DisposisiList.vue'),
    meta: { requiresAuth: true, title: 'Disposisi' }
  },
  {
    path: '/approval',
    name: 'Approval',
    component: () => import('@/views/approval/ApprovalList.vue'),
    meta: { requiresAuth: true, title: 'Approval' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/search/SearchView.vue'),
    meta: { requiresAuth: true, title: 'Pencarian' }
  },
  {
    path: '/notifikasi',
    name: 'Notifikasi',
    component: () => import('@/views/notifikasi/NotifikasiView.vue'),
    meta: { requiresAuth: true, title: 'Notifikasi' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: { requiresAuth: true, title: 'Profil' }
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/users'
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UsersManage.vue'),
        meta: { title: 'Manajemen User' }
      },
      {
        path: 'master-data',
        name: 'AdminMasterData',
        component: () => import('@/views/admin/MasterDataManage.vue'),
        meta: { title: 'Master Data' }
      },
      {
        path: 'config',
        name: 'AdminConfig',
        component: () => import('@/views/admin/ConfigManage.vue'),
        meta: { title: 'Konfigurasi' }
      },
      {
        path: 'audit-log',
        name: 'AdminAuditLog',
        component: () => import('@/views/admin/AuditLogView.vue'),
        meta: { title: 'Audit Log' }
      },
      {
        path: 'blockchain',
        name: 'AdminBlockchain',
        component: () => import('@/views/admin/BlockchainView.vue'),
        meta: { title: 'Blockchain' }
      },
      {
        path: 'backup',
        name: 'AdminBackup',
        component: () => import('@/views/admin/BackupManage.vue'),
        meta: { title: 'Backup & Restore' }
      },
      {
        path: 'system',
        name: 'AdminSystem',
        component: () => import('@/views/admin/SystemStatus.vue'),
        meta: { title: 'Status Sistem' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/errors/NotFoundView.vue'),
    meta: { title: '404 - Halaman Tidak Ditemukan' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Set document title
  document.title = to.meta.title 
    ? `${to.meta.title} - Arsip Surat Digital Enterprise` 
    : 'Arsip Surat Digital Enterprise'
  
  // Check if route requires auth
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!authStore.isAuthenticated) {
      next({ 
        name: 'Login', 
        query: { redirect: to.fullPath } 
      })
    } else if (to.matched.some(record => record.meta.requiresAdmin)) {
      if (authStore.user?.role !== 'admin') {
        next({ name: 'Dashboard' })
      } else {
        next()
      }
    } else {
      next()
    }
  } else if (to.matched.some(record => record.meta.guest)) {
    if (authStore.isAuthenticated) {
      next({ name: 'Dashboard' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
