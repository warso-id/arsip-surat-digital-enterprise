<template>
  <div class="default-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <!-- Sidebar -->
    <AppSidebar
      :isOpen="sidebarOpen"
      :collapsed="sidebarCollapsed"
      @close="sidebarOpen = false"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
    />
    
    <!-- Main Content -->
    <div class="main-wrapper">
      <!-- Header -->
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      
      <!-- Content -->
      <main class="main-content">
        <div class="content-container">
          <!-- Breadcrumb -->
          <nav class="breadcrumb" v-if="breadcrumbs.length > 0">
            <router-link to="/dashboard" class="breadcrumb-item">🏠 Dashboard</router-link>
            <span v-for="(crumb, index) in breadcrumbs" :key="index" class="breadcrumb-separator">›</span>
            <router-link
              v-for="(crumb, index) in breadcrumbs"
              :key="'link-' + index"
              :to="crumb.to"
              class="breadcrumb-item"
              :class="{ active: index === breadcrumbs.length - 1 }"
            >
              {{ crumb.label }}
            </router-link>
          </nav>
          
          <!-- Page Content -->
          <slot />
        </div>
      </main>
      
      <!-- Footer -->
      <AppFooter />
    </div>
    
    <!-- Toast Notifications -->
    <ToastNotification ref="toastRef" />
    
    <!-- Back to Top -->
    <button
      v-show="showBackToTop"
      class="back-to-top"
      @click="scrollToTop"
      title="Kembali ke atas"
    >
      ⬆️
    </button>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import ToastNotification, { useToast } from '@/components/common/ToastNotification.vue'

export default {
  name: 'DefaultLayout',
  components: {
    AppSidebar,
    AppHeader,
    AppFooter,
    ToastNotification
  },
  setup() {
    const route = useRoute()
    const sidebarOpen = ref(false)
    const sidebarCollapsed = ref(false)
    const showBackToTop = ref(false)
    const toastRef = ref(null)
    
    // Toast methods
    const toast = {
      success: (msg, title) => toastRef.value?.success(msg, title),
      error: (msg, title) => toastRef.value?.error(msg, title),
      warning: (msg, title) => toastRef.value?.warning(msg, title),
      info: (msg, title) => toastRef.value?.info(msg, title)
    }
    
    provide('toast', toast)
    
    const breadcrumbs = computed(() => {
      const crumbs = []
      const path = route.path
      const parts = path.split('/').filter(Boolean)
      
      if (parts.length === 0) return crumbs
      
      let currentPath = ''
      
      const breadcrumbMap = {
        'dashboard': { label: 'Dashboard', to: '/dashboard' },
        'surat-masuk': { label: 'Surat Masuk', to: '/surat-masuk' },
        'surat-keluar': { label: 'Surat Keluar', to: '/surat-keluar' },
        'disposisi': { label: 'Disposisi', to: '/disposisi' },
        'approval': { label: 'Approval', to: '/approval' },
        'search': { label: 'Pencarian', to: '/search' },
        'notifikasi': { label: 'Notifikasi', to: '/notifikasi' },
        'profile': { label: 'Profil', to: '/profile' },
        'admin': { label: 'Admin', to: '/admin' },
        'users': { label: 'Manajemen User', to: '/admin/users' },
        'master-data': { label: 'Master Data', to: '/admin/master-data' },
        'config': { label: 'Konfigurasi', to: '/admin/config' },
        'audit-log': { label: 'Audit Log', to: '/admin/audit-log' },
        'blockchain': { label: 'Blockchain', to: '/admin/blockchain' },
        'backup': { label: 'Backup', to: '/admin/backup' },
        'system': { label: 'Sistem', to: '/admin/system' },
        'create': { label: 'Tambah', to: '' },
        'edit': { label: 'Edit', to: '' }
      }
      
      for (let i = 0; i < parts.length; i++) {
        currentPath += '/' + parts[i]
        const map = breadcrumbMap[parts[i]]
        
        if (map && parts[i] !== 'dashboard') {
          crumbs.push({
            label: map.label,
            to: map.to || currentPath
          })
        }
      }
      
      return crumbs
    })
    
    const handleScroll = () => {
      showBackToTop.value = window.scrollY > 300
    }
    
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    // Close sidebar on route change (mobile)
    const unwatch = () => {
      sidebarOpen.value = false
    }
    
    onMounted(() => {
      window.addEventListener('scroll', handleScroll)
    })
    
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })
    
    return {
      sidebarOpen,
      sidebarCollapsed,
      showBackToTop,
      breadcrumbs,
      toastRef,
      scrollToTop
    }
  }
}
</script>

<style lang="scss" scoped>
.default-layout {
  display: flex;
  min-height: 100vh;
  
  &.sidebar-collapsed {
    .main-wrapper {
      margin-left: var(--sidebar-collapsed-width);
    }
  }
}

.main-wrapper {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left var(--transition-normal);
}

.main-content {
  flex: 1;
  padding-top: var(--header-height);
}

.content-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 0.8125rem;
  flex-wrap: wrap;
  
  .breadcrumb-item {
    color: var(--text-secondary);
    text-decoration: none;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
    
    &:hover {
      background: var(--bg-hover);
      color: var(--color-primary);
    }
    
    &.active {
      color: var(--text-primary);
      font-weight: 600;
      pointer-events: none;
    }
  }
  
  .breadcrumb-separator {
    color: var(--text-tertiary);
    font-size: 1rem;
  }
}

.back-to-top {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--color-primary-dark);
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }
}

@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0 !important;
  }
  
  .content-container {
    padding: 16px;
  }
  
  .back-to-top {
    bottom: 16px;
    right: 16px;
  }
}
</style>
