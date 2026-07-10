<template>
  <DefaultLayout>
    <div class="admin-layout">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">⚙️ Panel Administrasi</h1>
          <p class="admin-subtitle">Kelola sistem, user, dan konfigurasi</p>
        </div>
      </div>
      
      <div class="admin-grid">
        <!-- Admin Navigation -->
        <div class="admin-nav">
          <div class="card">
            <div class="card-body" style="padding: 8px;">
              <nav class="admin-menu">
                <router-link to="/admin/users" class="admin-menu-item" :class="{ active: isActive('/admin/users') }">
                  <span>👥</span> Manajemen User
                </router-link>
                <router-link to="/admin/master-data" class="admin-menu-item" :class="{ active: isActive('/admin/master-data') }">
                  <span>🗄️</span> Master Data
                </router-link>
                <router-link to="/admin/config" class="admin-menu-item" :class="{ active: isActive('/admin/config') }">
                  <span>⚙️</span> Konfigurasi
                </router-link>
                <router-link to="/admin/audit-log" class="admin-menu-item" :class="{ active: isActive('/admin/audit-log') }">
                  <span>📝</span> Audit Log
                </router-link>
                <router-link to="/admin/blockchain" class="admin-menu-item" :class="{ active: isActive('/admin/blockchain') }">
                  <span>⛓️</span> Blockchain
                </router-link>
                <router-link to="/admin/backup" class="admin-menu-item" :class="{ active: isActive('/admin/backup') }">
                  <span>💾</span> Backup & Restore
                </router-link>
                <router-link to="/admin/system" class="admin-menu-item" :class="{ active: isActive('/admin/system') }">
                  <span>🖥️</span> Status Sistem
                </router-link>
              </nav>
            </div>
          </div>
        </div>
        
        <!-- Admin Content -->
        <div class="admin-content">
          <router-view />
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

export default {
  name: 'AdminLayout',
  components: { DefaultLayout },
  setup() {
    const route = useRoute()
    
    const isActive = (path) => {
      return route.path.startsWith(path)
    }
    
    return { isActive }
  }
}
</script>

<style lang="scss" scoped>
.admin-layout { animation: fadeIn 0.4s ease-out; }
.admin-header { margin-bottom: 24px;
  .admin-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px; }
  .admin-subtitle { color: var(--text-secondary); font-size: 0.875rem; margin: 0; }
}
.admin-grid { display: grid; grid-template-columns: 240px 1fr; gap: 24px; }
.admin-nav { position: sticky; top: calc(var(--header-height) + 24px); }
.admin-menu { display: flex; flex-direction: column; gap: 2px; }
.admin-menu-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; border-radius: var(--radius-md);
  color: var(--text-secondary); text-decoration: none; font-size: 0.875rem; font-weight: 500;
  transition: all var(--transition-fast);
  &:hover { background: var(--bg-hover); color: var(--text-primary); }
  &.active { background: var(--bg-active); color: var(--color-primary); font-weight: 600; }
}
.admin-content { min-height: 500px; }
@media (max-width: 768px) {
  .admin-grid { grid-template-columns: 1fr; }
  .admin-nav { position: static; }
  .admin-menu { flex-direction: row; flex-wrap: wrap; gap: 4px; }
  .admin-menu-item { padding: 8px 12px; font-size: 0.75rem; }
}
</style>
