import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import API from '@/api'

export const useAppStore = defineStore('app', () => {
  const isOnline = ref(navigator.onLine)
  const sidebarOpen = ref(false)
  const notifications = ref([])
  const unreadCount = ref(0)
  const systemStatus = ref(null)
  const isLoading = ref(false)
  
  // Update online status
  window.addEventListener('online', () => { isOnline.value = true })
  window.addEventListener('offline', () => { isOnline.value = false })
  
  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }
  
  function closeSidebar() {
    sidebarOpen.value = false
  }
  
  async function fetchNotifications() {
    try {
      const response = await API.notifikasiList({ limit: 10 })
      if (response.status === 'success') {
        notifications.value = response.data.items
        const countResponse = await API.notifikasiUnreadCount()
        if (countResponse.status === 'success') {
          unreadCount.value = countResponse.data.count
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }
  
  async function markNotificationRead(id) {
    try {
      await API.notifikasiRead(id)
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }
  
  async function markAllNotificationsRead() {
    try {
      await API.notifikasiReadAll()
      unreadCount.value = 0
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }
  
  async function fetchSystemStatus() {
    try {
      const response = await API.systemStatus()
      if (response.status === 'success') {
        systemStatus.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch system status:', err)
    }
  }
  
  return {
    isOnline,
    sidebarOpen,
    notifications,
    unreadCount,
    systemStatus,
    isLoading,
    toggleSidebar,
    closeSidebar,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    fetchSystemStatus
  }
})
