import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/main.scss'
import './assets/styles/tailwind.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Global Error Handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global Error:', err, info)
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered:', registration)
    }).catch(error => {
      console.log('SW registration failed:', error)
    })
  })
}

app.mount('#app')
