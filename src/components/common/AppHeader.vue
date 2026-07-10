<template>
  <header class="app-header" :class="{ 'header-scrolled': isScrolled }">
    <div class="header-left">
      <button class="menu-toggle" @click="$emit('toggle-sidebar')" aria-label="Toggle menu">
        <span class="menu-icon">☰</span>
      </button>
      
      <router-link to="/dashboard" class="brand">
        <span class="brand-icon">📁</span>
        <span class="brand-text">Arsip Surat Digital</span>
      </router-link>
    </div>
    
    <div class="header-center">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari surat, nomor agenda, pengirim..."
          class="search-input"
          @keyup.enter="handleSearch"
          @focus="showSearchSuggestions = true"
          @blur="hideSuggestions"
        />
        <button v-if="searchQuery" class="search-clear" @click="clearSearch">✕</button>
      </div>
      
      <!-- Search Suggestions -->
      <div v-if="showSearchSuggestions && searchQuery" class="search-suggestions">
        <div v-if="suggestions.length > 0" class="suggestions-list">
          <div
            v-for="item in suggestions"
            :key="item.id"
            class="suggestion-item"
            @mousedown="goToSuggestion(item)"
          >
            <span class="suggestion-type">{{ item.type === 'surat-masuk' ? '📥' : '📤' }}</span>
            <div class="suggestion-content">
              <div class="suggestion-title">{{ item.title }}</div>
              <div class="suggestion-desc">{{ item.description }}</div>
            </div>
          </div>
        </div>
        <div v-else class="suggestions-empty">
          Tidak ada hasil untuk "{{ searchQuery }}"
        </div>
      </div>
    </div>
    
    <div class="header-right">
      <!-- Notifications -->
      <div class="header-action" @click="goToNotifications">
        <span class="action-icon">🔔</span>
        <span v-if="unreadCount > 0" class="badge-count">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </div>
      
      <!-- Theme Toggle -->
      <div class="header-action" @click="toggleTheme" :title="isDark ? 'Mode Terang' : 'Mode Gelap'">
        <span class="action-icon">{{ isDark ? '☀️' : '🌙' }}</span>
      </div>
      
      <!-- Online Status -->
      <div class="header-action" :title="isOnline ? 'Online' : 'Offline'">
        <span class="status-dot" :class="isOnline ? 'online' : 'offline'"></span>
      </div>
      
      <!-- User Menu -->
      <div class="user-menu" ref="userMenuRef">
        <button class="user-trigger" @click="showUserMenu = !showUserMenu">
          <div class="user-avatar">
            {{ userInitials }}
          </div>
          <span class="user-name hide-mobile">{{ userName }}</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        
        <div v-if="showUserMenu" class="user-dropdown">
          <div class="dropdown-header">
            <div class="dropdown-avatar">{{ userInitials }}</div>
            <div class="dropdown-user-info">
              <div class="dropdown-user-name">{{ userName }}</div>
              <div class="dropdown-user-role">{{ userRole }}</div>
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <router-link to="/profile" class="dropdown-item" @click="showUserMenu = false">
            <span>👤</span> Profil Saya
          </router-link>
          <router-link v-if="isAdmin" to="/admin" class="dropdown-item" @click="showUserMenu = false">
            <span>⚙️</span> Panel Admin
          </router-link>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item logout" @click="handleLogout">
            <span>🚪</span> Keluar
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import API from '@/api'

export default {
  name: 'AppHeader',
  emits: ['toggle-sidebar'],
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const appStore = useAppStore()
    const themeStore = useThemeStore()
    
    const searchQuery = ref('')
    const showSearchSuggestions = ref(false)
    const suggestions = ref([])
    const showUserMenu = ref(false)
    const userMenuRef = ref(null)
    const isScrolled = ref(false)
    
    const isOnline = computed(() => appStore.isOnline)
    const isDark = computed(() => themeStore.theme === 'dark')
    const unreadCount = computed(() => appStore.unreadCount)
    const isAdmin = computed(() => authStore.isAdmin)
    
    const userName = computed(() => authStore.user?.namaLengkap || authStore.user?.username || 'User')
    const userRole = computed(() => {
      const role = authStore.user?.role || 'staff'
      const roles = { admin: 'Administrator', staff: 'Staff', user: 'Pengguna' }
      return roles[role] || role
    })
    const userInitials = computed(() => {
      const name = userName.value
      return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)
    })
    
    let searchTimeout = null
    
    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        router.push({ name: 'Search', query: { q: searchQuery.value.trim() } })
        showSearchSuggestions.value = false
      }
    }
    
    const clearSearch = () => {
      searchQuery.value = ''
      suggestions.value = []
    }
    
    const hideSuggestions = () => {
      setTimeout(() => {
        showSearchSuggestions.value = false
      }, 200)
    }
    
    const goToSuggestion = (item) => {
      showSearchSuggestions.value = false
      if (item.type === 'surat-masuk') {
        router.push({ name: 'SuratMasukDetail', params: { id: item.id } })
      } else {
        router.push({ name: 'SuratKeluarDetail', params: { id: item.id } })
      }
    }
    
    const goToNotifications = () => {
      router.push({ name: 'Notifikasi' })
    }
    
    const toggleTheme = () => {
      themeStore.toggleTheme()
    }
    
    const handleLogout = () => {
      showUserMenu.value = false
      authStore.logout()
    }
    
    const handleScroll = () => {
      isScrolled.value = window.scrollY > 10
    }
    
    const handleClickOutside = (event) => {
      if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
        showUserMenu.value = false
      }
    }
    
    // Watch search query for suggestions
    const watchSearch = () => {
      if (searchTimeout) clearTimeout(searchTimeout)
      
      if (searchQuery.value.length >= 2) {
        searchTimeout = setTimeout(async () => {
          try {
            const response = await API.search({ q: searchQuery.value, limit: 5 })
            if (response.status === 'success') {
              suggestions.value = response.data.results
            }
          } catch (err) {
            suggestions.value = []
          }
        }, 300)
      } else {
        suggestions.value = []
      }
    }
    
    onMounted(() => {
      window.addEventListener('scroll', handleScroll)
      document.addEventListener('click', handleClickOutside)
    })
    
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('click', handleClickOutside)
      if (searchTimeout) clearTimeout(searchTimeout)
    })
    
    return {
      searchQuery,
      showSearchSuggestions,
      suggestions,
      showUserMenu,
      userMenuRef,
      isScrolled,
      isOnline,
      isDark,
      unreadCount,
      isAdmin,
      userName,
      userRole,
      userInitials,
      handleSearch,
      clearSearch,
      hideSuggestions,
      goToSuggestion,
      goToNotifications,
      toggleTheme,
      handleLogout,
      watchSearch
    }
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: var(--z-header);
  transition: box-shadow var(--transition-normal);
  
  &.header-scrolled {
    box-shadow: var(--shadow-md);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  display: none;
  
  .menu-icon {
    font-size: 20px;
  }
  
  &:hover {
    background: var(--bg-hover);
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-primary);
  
  .brand-icon {
    font-size: 24px;
  }
  
  .brand-text {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-primary);
  }
}

.header-center {
  flex: 1;
  max-width: 500px;
  margin: 0 24px;
  position: relative;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  
  .search-icon {
    position: absolute;
    left: 12px;
    font-size: 16px;
    color: var(--text-tertiary);
  }
  
  .search-input {
    width: 100%;
    padding: 10px 40px 10px 40px;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-full);
    font-size: 0.875rem;
    background: var(--bg-secondary);
    color: var(--text-primary);
    transition: all var(--transition-fast);
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      background: var(--bg-card);
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
    }
    
    &::placeholder {
      color: var(--text-tertiary);
    }
  }
  
  .search-clear {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-tertiary);
    font-size: 14px;
    padding: 4px;
    
    &:hover {
      color: var(--text-primary);
    }
  }
}

.search-suggestions {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-height: 400px;
  overflow-y: auto;
  z-index: 100;
}

.suggestions-list {
  .suggestion-item {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background var(--transition-fast);
    
    &:hover {
      background: var(--bg-hover);
    }
    
    .suggestion-type {
      font-size: 20px;
    }
    
    .suggestion-content {
      flex: 1;
      min-width: 0;
      
      .suggestion-title {
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .suggestion-desc {
        font-size: 0.75rem;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

.suggestions-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-action {
  position: relative;
  padding: 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  
  &:hover {
    background: var(--bg-hover);
  }
  
  .action-icon {
    font-size: 20px;
  }
  
  .badge-count {
    position: absolute;
    top: 2px;
    right: 2px;
    background: var(--color-danger);
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 5px;
    border-radius: var(--radius-full);
    min-width: 18px;
    text-align: center;
  }
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  
  &.online {
    background: var(--color-success);
  }
  
  &.offline {
    background: var(--color-danger);
  }
}

.user-menu {
  position: relative;
  
  .user-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: none;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition-fast);
    
    &:hover {
      background: var(--bg-hover);
    }
    
    .user-avatar {
      width: 32px;
      height: 32px;
      background: var(--color-primary);
      color: white;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.75rem;
    }
    
    .user-name {
      font-weight: 500;
      color: var(--text-primary);
      font-size: 0.875rem;
    }
    
    .dropdown-arrow {
      font-size: 10px;
      color: var(--text-tertiary);
    }
  }
  
  .user-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 240px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    animation: slideDown 0.2s ease-out;
    
    .dropdown-header {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      
      .dropdown-avatar {
        width: 40px;
        height: 40px;
        background: var(--color-primary);
        color: white;
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
      }
      
      .dropdown-user-info {
        .dropdown-user-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.875rem;
        }
        
        .dropdown-user-role {
          color: var(--text-secondary);
          font-size: 0.75rem;
        }
      }
    }
    
    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
    }
    
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      color: var(--text-primary);
      text-decoration: none;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background var(--transition-fast);
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      
      &:hover {
        background: var(--bg-hover);
      }
      
      &.logout {
        color: var(--color-danger);
      }
    }
  }
}

@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }
  
  .brand-text {
    display: none;
  }
  
  .header-center {
    flex: 1;
    margin: 0 12px;
    max-width: none;
  }
  
  .user-name {
    display: none;
  }
}
</style>
