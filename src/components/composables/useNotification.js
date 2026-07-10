import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import API from '@/api'

export function useNotification() {
  const appStore = useAppStore()
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  let pollInterval = null
  
  async function fetchNotifications(params = {}) {
    loading.value = true
    try {
      const response = await API.notifikasiList(params)
      if (response.status === 'success') {
        notifications.value = response.data.items
      }
      
      const countResponse = await API.notifikasiUnreadCount()
      if (countResponse.status === 'success') {
        unreadCount.value = countResponse.data.count
        appStore.unreadCount = countResponse.data.count
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function markAsRead(id) {
    try {
      await API.notifikasiRead(id)
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      appStore.unreadCount = unreadCount.value
      
      const notif = notifications.value.find(n => n.id === id)
      if (notif) notif.isRead = true
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }
  
  async function markAllAsRead() {
    try {
      await API.notifikasiReadAll()
      unreadCount.value = 0
      appStore.unreadCount = 0
      notifications.value.forEach(n => n.isRead = true)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }
  
  function startPolling(interval = 30000) {
    stopPolling()
    fetchNotifications()
    pollInterval = setInterval(() => {
      fetchNotifications()
    }, interval)
  }
  
  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }
  
  function getNotificationIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }
    return icons[type] || 'ℹ️'
  }
  
  function getNotificationBadge(type) {
    const badges = {
      info: 'info',
      success: 'success',
      warning: 'warning',
      error: 'danger'
    }
    return badges[type] || 'info'
  }
  
  onMounted(() => {
    fetchNotifications()
  })
  
  onUnmounted(() => {
    stopPolling()
  })
  
  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
    getNotificationIcon,
    getNotificationBadge
  }
}
