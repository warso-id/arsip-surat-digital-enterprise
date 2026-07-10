<template>
  <aside class="app-sidebar" :class="{ 'sidebar-open': isOpen, 'sidebar-collapsed': collapsed }">
    <div class="sidebar-overlay" @click="$emit('close')"></div>
    
    <div class="sidebar-content">
      <div class="sidebar-header">
        <router-link to="/dashboard" class="sidebar-brand">
          <span class="brand-icon">📁</span>
          <span class="brand-text" v-show="!collapsed">Arsip Surat</span>
        </router-link>
        <button class="sidebar-close" @click="$emit('close')">✕</button>
      </div>
      
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title" v-show="!collapsed">Menu Utama</div>
          
          <router-link to="/dashboard" class="nav-item" :class="{ active: isActive('/dashboard') }">
            <span class="nav-icon">📊</span>
            <span class="nav-label" v-show="!collapsed">Dashboard</span>
            <span v-if="pendingCount > 0 && collapsed" class="nav-badge-dot"></span>
          </router-link>
          
          <router-link to="/surat-masuk" class="nav-item" :class="{ active: isActive('/surat-masuk') }">
            <span class="nav-icon">📥</span>
            <span class="nav-label" v-show="!collapsed">Surat Masuk</span>
            <span v-if="suratMasukCount > 0" class="nav-badge" v-show="!collapsed">{{ suratMasukCount }}</span>
            <span v-if="suratMasukCount > 0 && collapsed" class="nav-badge-dot"></span>
          </router-link>
          
          <router-link to="/surat-keluar" class="nav-item" :class="{ active: isActive('/surat-keluar') }">
            <span class="nav-icon">📤</span>
            <span class="nav-label" v-show="!collapsed">Surat Keluar</span>
          </router-link>
          
          <router-link to="/disposisi" class="nav-item" :class="{ active: isActive('/disposisi') }">
            <span class="nav-icon">📋</span>
            <span class="nav-label" v-show="!collapsed">Disposisi</span>
            <span v-if="disposisiCount > 0" class="nav-badge" v-show="!collapsed">{{ disposisiCount }}</span>
          </router-link>
          
          <router-link to="/approval" class="nav-item" :class="{ active: isActive('/approval') }">
            <span class="nav-icon">✅</span>
            <span class="nav-label" v-show="!collapsed">Approval</span>
          </router-link>
        </div>
        
        <div class="nav-section" v-if="isAdmin">
          <div class="nav-section-title" v-show="!collapsed">Administrasi</div>
          
          <router-link to="/admin/users" class="nav-item" :class="{ active: isActive('/admin/users') }">
            <span class="nav-icon">👥</span>
            <span class="nav-label" v-show="!collapsed">Manajemen User</span>
          </router-link>
          
          <router-link to="/admin/master-data" class="nav-item" :class="{ active: isActive('/admin/master-data') }">
            <span class="nav-icon">🗄️</span>
            <span class="nav-label" v-show="!collapsed">Master Data</span>
          </router-link>
          
          <router-link to="/admin/config" class="nav-item" :class="{ active: isActive('/admin/config') }">
            <span class="nav-icon">⚙️</span>
            <span class="nav-label" v-show="!collapsed">Konfigurasi</span>
          </router-link>
          
          <router-link to="/admin/audit-log" class="nav-item" :class="{ active: isActive('/admin/audit-log') }">
            <span class="nav-icon">📝</span>
            <span class="nav-label" v-show="!collapsed">Audit Log</span>
          </router-link>
          
          <router-link to="/admin/blockchain" class="nav-item" :class="{ active: isActive('/admin/blockchain') }">
            <span class="nav-icon">⛓️</span>
            <span class="nav-label" v-show="!collapsed">Blockchain</span>
          </router-link>
          
          <router-link to="/admin/backup" class="nav-item" :class="{ active: isActive('/admin/backup') }">
            <span class="nav-icon">💾</span>
            <span class="nav-label" v-show="!collapsed">Backup & Restore</span>
          </router-link>
          
          <router-link to="/admin/system" class="nav-item" :class="{ active: isActive('/admin/system') }">
            <span class="nav-icon">🖥️</span>
            <span class="nav-label" v-show="!collapsed">Status Sistem</span>
          </router-link>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title" v-show="!collapsed">Lainnya</div>
          
          <router-link to="/search" class="nav-item" :class="{ active: isActive('/search') }">
            <span class="nav-icon">🔍</span>
            <span class="nav-label" v-show="!collapsed">Pencarian</span>
          </router-link>
          
          <router-link to="/notifikasi" class="nav-item" :class="{ active: isActive('/notifikasi') }">
            <span class="nav-icon">🔔</span>
            <span class="nav-label" v-show="!collapsed">Notifikasi</span>
            <span v-if="unreadNotifCount > 0" class="nav-badge" v-show="!collapsed">{{ unreadNotifCount }}</span>
          </router-link>
          
          <router-link to="/profile" class="nav-item" :class="{ active: isActive('/profile') }">
            <span class="nav-icon">👤</span>
            <span class="nav-label" v-show="!collapsed">Profil Saya</span>
          </router-link>
        </div>
      </nav>
      
      <div class="sidebar-footer" v-show="!collapsed">
        <div class="sidebar-collapse-btn" @click="toggleCollapse">
          <span>◀</span>
          <span>Collapse</span>
        </div>
        <div class="sidebar-version">v3.1.0</div>
      </div>
      
      <div class="sidebar-footer-collapsed" v-show="collapsed" @click="toggleCollapse">
        <span>▶</span>
      </div>
    </div>
  </aside>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

export default {
  name: 'AppSidebar',
  props: {
    isOpen: { type: Boolean, default: false },
    collapsed: { type: Boolean, default: false }
  },
  emits: ['close', 'toggle-collapse'],
  setup(props, { emit }) {
    const route = useRoute()
    const authStore = useAuthStore()
    const appStore = useAppStore()
    
    const isAdmin = computed(() => authStore.isAdmin)
    const unreadNotifCount = computed(() => appStore.unreadCount)
    
    // Counts for badges
    const suratMasukCount = ref(0)
    const disposisiCount = ref(0)
    const pendingCount = ref(0)
    
    const isActive = (path) => {
      return route.path.startsWith(path)
    }
    
    const toggleCollapse = () => {
      emit('toggle-collapse')
    }
    
    // Fetch counts
    const fetchCounts = async () => {
      try {
        const API = (await import('@/api')).default
        const [statsRes] = await Promise.all([
          API.dashboardStats()
        ])
        if (statsRes.status === 'success') {
          suratMasukCount.value = statsRes.data.suratMasuk.pending || 0
          disposisiCount.value = statsRes.data.disposisi.pending || 0
          pendingCount.value = suratMasukCount.value + disposisiCount.value
        }
      } catch (err) {
        console.error('Failed to fetch counts:', err)
      }
    }
    
    onMounted(() => {
      fetchCounts()
      const interval = setInterval(fetchCounts, 60000) // Refresh every minute
      onUnmounted(() => clearInterval(interval))
    })
    
    return {
      isAdmin,
      unreadNotifCount,
      suratMasukCount,
      disposisiCount,
      pendingCount,
      isActive,
      toggleCollapse
    }
  }
}
</script>

<style lang="scss" scoped>
.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: var(--z-sidebar);
  transition: width var(--transition-normal);
  
  &.sidebar-open {
    .sidebar-overlay {
      display: block;
    }
    .sidebar-content {
      transform: translateX(0);
    }
  }
  
  &.sidebar-collapsed {
    .sidebar-content {
      width: var(--sidebar-collapsed-width);
    }
  }
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

.sidebar-content {
  position: relative;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width var(--transition-normal), transform var(--transition-normal);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  min-height: var(--header-height);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-primary);
  
  .brand-icon {
    font-size: 24px;
    flex-shrink: 0;
  }
  
  .brand-text {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-primary);
    white-space: nowrap;
  }
}

.sidebar-close {
  display: none;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  
  &:hover {
    color: var(--text-primary);
  }
}

.sidebar-nav {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 8px;
  
  .nav-section-title {
    padding: 8px 20px 4px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-tertiary);
    white-space: nowrap;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  margin: 2px 8px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--transition-fast);
  position: relative;
  white-space: nowrap;
  
  .nav-icon {
    font-size: 18px;
    flex-shrink: 0;
    width: 24px;
    text-align: center;
  }
  
  .nav-label {
    flex: 1;
  }
  
  .nav-badge {
    background: var(--color-danger);
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    min-width: 20px;
    text-align: center;
  }
  
  .nav-badge-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    background: var(--color-danger);
    border-radius: 50%;
  }
  
  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
  
  &.active {
    background: var(--bg-active);
    color: var(--color-primary);
    font-weight: 600;
    
    .nav-icon {
      color: var(--color-primary);
    }
  }
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-collapse-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  
  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
}

.sidebar-footer-collapsed {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  text-align: center;
  cursor: pointer;
  color: var(--text-secondary);
  
  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
}

.sidebar-version {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

@media (max-width: 768px) {
  .app-sidebar {
    &:not(.sidebar-open) .sidebar-content {
      transform: translateX(-100%);
    }
    
    &.sidebar-open .sidebar-content {
      width: var(--sidebar-width);
      transform: translateX(0);
    }
  }
  
  .sidebar-overlay {
    display: block;
  }
  
  .sidebar-close {
    display: block;
  }
}
</style>
