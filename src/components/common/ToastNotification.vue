<template>
  <Teleport to="body">
    <div class="toast-container">
      <transition-group name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast-${toast.type}`]"
        >
          <span class="toast-icon">{{ getIcon(toast.type) }}</span>
          <div class="toast-content">
            <div class="toast-title" v-if="toast.title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" @click="remove(toast.id)">✕</button>
          
          <div v-if="toast.duration > 0" class="toast-progress">
            <div
              class="toast-progress-bar"
              :class="`progress-${toast.type}`"
              :style="{ animationDuration: toast.duration + 'ms' }"
            ></div>
          </div>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<script>
import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

export default {
  name: 'ToastNotification',
  setup() {
    const getIcon = (type) => {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      }
      return icons[type] || 'ℹ️'
    }
    
    const addToast = (toast) => {
      const id = ++toastId
      const newToast = {
        id,
        title: toast.title || '',
        message: toast.message,
        type: toast.type || 'info',
        duration: toast.duration || 5000
      }
      
      toasts.value.push(newToast)
      
      if (newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, newToast.duration)
      }
      
      return id
    }
    
    const removeToast = (id) => {
      const index = toasts.value.findIndex(t => t.id === id)
      if (index > -1) {
        toasts.value.splice(index, 1)
      }
    }
    
    const success = (message, title = 'Sukses', duration = 5000) => {
      return addToast({ message, title, type: 'success', duration })
    }
    
    const error = (message, title = 'Error', duration = 7000) => {
      return addToast({ message, title, type: 'error', duration })
    }
    
    const warning = (message, title = 'Peringatan', duration = 5000) => {
      return addToast({ message, title, type: 'warning', duration })
    }
    
    const info = (message, title = 'Info', duration = 5000) => {
      return addToast({ message, title, type: 'info', duration })
    }
    
    return {
      toasts,
      getIcon,
      remove: removeToast,
      success,
      error,
      warning,
      info
    }
  }
}

// Export for use in other components
export const useToast = () => {
  const toastRef = ref(null)
  
  return {
    success: (msg, title) => toastRef.value?.success(msg, title),
    error: (msg, title) => toastRef.value?.error(msg, title),
    warning: (msg, title) => toastRef.value?.warning(msg, title),
    info: (msg, title) => toastRef.value?.info(msg, title)
  }
}
</script>

<style lang="scss" scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  
  > div {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.toast {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 320px;
  max-width: 420px;
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  
  &.toast-success {
    border-left: 4px solid var(--color-success);
  }
  
  &.toast-error {
    border-left: 4px solid var(--color-danger);
  }
  
  &.toast-warning {
    border-left: 4px solid var(--color-warning);
  }
  
  &.toast-info {
    border-left: 4px solid var(--color-info);
  }
}

.toast-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;
  
  .toast-title {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text-primary);
    margin-bottom: 2px;
  }
  
  .toast-message {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  font-size: 14px;
  padding: 4px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  
  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--border-light);
  
  .toast-progress-bar {
    height: 100%;
    animation: progress linear forwards;
    
    &.progress-success { background: var(--color-success); }
    &.progress-error { background: var(--color-danger); }
    &.progress-warning { background: var(--color-warning); }
    &.progress-info { background: var(--color-info); }
  }
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

.toast-enter-active {
  animation: slideIn 0.3s ease-out;
}

.toast-leave-active {
  animation: slideOut 0.3s ease-in forwards;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .toast-container {
    left: 12px;
    right: 12px;
    top: 70px;
  }
  
  .toast {
    min-width: auto;
    max-width: none;
  }
}
</style>
