// Service Worker Registration
import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker() {
  const updateSW = registerSW({
    onNeedRefresh() {
      // Show update prompt
      if (confirm('Versi baru tersedia! Ingin memperbarui sekarang?')) {
        updateSW()
      }
    },
    onOfflineReady() {
      console.log('App siap digunakan offline')
    },
    onRegistered(registration) {
      console.log('Service Worker terdaftar:', registration)
      
      // Check for updates every hour
      setInterval(() => {
        registration?.update()
      }, 60 * 60 * 1000)
    },
    onRegisterError(error) {
      console.error('Service Worker registration failed:', error)
    }
  })
  
  return updateSW
}

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Browser tidak mendukung notifikasi')
    return false
  }
  
  if (Notification.permission === 'granted') {
    return true
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  
  return false
}

// Subscribe to push notifications
export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications tidak didukung')
    return null
  }
  
  try {
    const registration = await navigator.serviceWorker.ready
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      )
    })
    
    console.log('Push notification subscribed:', subscription)
    return subscription
  } catch (err) {
    console.error('Failed to subscribe to push:', err)
    return null
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}
