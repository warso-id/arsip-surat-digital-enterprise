<template>
  <div id="app" :class="[themeClass, { 'app-offline': !isOnline }]">
    <transition name="fade" mode="out-in">
      <router-view />
    </transition>
    
    <!-- Offline Indicator -->
    <div v-if="!isOnline" class="offline-indicator">
      <span>📡 Mode Offline</span>
    </div>
    
    <!-- Update Available Banner -->
    <div v-if="updateAvailable" class="update-banner">
      <span>🔄 Update tersedia!</span>
      <button @click="refreshApp" class="btn-update">Update Sekarang</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'App',
  setup() {
    const themeStore = useThemeStore()
    const authStore = useAuthStore()
    const isOnline = ref(navigator.onLine)
    const updateAvailable = ref(false)
    
    const themeClass = computed(() => themeStore.theme)
    
    const handleOnline = () => { isOnline.value = true }
    const handleOffline = () => { isOnline.value = false }
    
    const refreshApp = () => {
      if (window.swUpdate) {
        window.swUpdate().then(() => {
          updateAvailable.value = false
          window.location.reload()
        })
      }
    }
    
    onMounted(() => {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      // Check for auth token
      authStore.checkAuth()
      
      // Listen for SW updates
      navigator.serviceWorker?.addEventListener('controllerchange', () => {
        updateAvailable.value = true
      })
    })
    
    onUnmounted(() => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    })
    
    return {
      isOnline,
      updateAvailable,
      themeClass,
      refreshApp
    }
  }
}
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  transition: background-color 0.3s ease;
}

.app-offline {
  .offline-indicator {
    display: block;
  }
}

.offline-indicator {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FF5722;
  color: white;
  text-align: center;
  padding: 8px;
  z-index: 9999;
  font-size: 14px;
}

.update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #4CAF50;
  color: white;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 9999;
  
  .btn-update {
    background: white;
    color: #4CAF50;
    border: none;
    padding: 6px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    
    &:hover {
      opacity: 0.9;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
