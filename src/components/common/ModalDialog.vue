<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeOnOverlay && close()">
        <div class="modal-container" :class="[`modal-${size}`, { 'modal-fullscreen': fullscreen }]">
          <!-- Header -->
          <div class="modal-header" v-if="!hideHeader">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="modal-close" @click="close" :disabled="loading">✕</button>
          </div>
          
          <!-- Body -->
          <div class="modal-body" :class="{ 'modal-body-loading': loading }">
            <div v-if="loading" class="modal-loader">
              <div class="spinner"></div>
              <p>{{ loadingText }}</p>
            </div>
            <slot v-else></slot>
          </div>
          
          <!-- Footer -->
          <div class="modal-footer" v-if="!hideFooter">
            <slot name="footer">
              <button class="btn btn-secondary" @click="close" :disabled="loading">
                {{ cancelText }}
              </button>
              <button
                class="btn btn-primary"
                @click="confirm"
                :disabled="loading || confirmDisabled"
              >
                {{ confirmText }}
              </button>
            </slot>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'

export default {
  name: 'ModalDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: 'Konfirmasi' },
    size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg', 'xl'].includes(v) },
    fullscreen: { type: Boolean, default: false },
    hideHeader: { type: Boolean, default: false },
    hideFooter: { type: Boolean, default: false },
    confirmText: { type: String, default: 'OK' },
    cancelText: { type: String, default: 'Batal' },
    confirmDisabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    loadingText: { type: String, default: 'Memproses...' },
    closeOnOverlay: { type: Boolean, default: true },
    closeOnEscape: { type: Boolean, default: true }
  },
  emits: ['update:modelValue', 'confirm', 'close'],
  setup(props, { emit }) {
    const close = () => {
      if (!props.loading) {
        emit('update:modelValue', false)
        emit('close')
      }
    }
    
    const confirm = () => {
      emit('confirm')
    }
    
    const handleKeydown = (e) => {
      if (e.key === 'Escape' && props.closeOnEscape) {
        close()
      }
    }
    
    onMounted(() => {
      if (props.modelValue) {
        document.addEventListener('keydown', handleKeydown)
        document.body.style.overflow = 'hidden'
      }
    })
    
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = ''
    })
    
    return { close, confirm }
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-container {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  &.modal-sm { max-width: 400px; }
  &.modal-md { max-width: 520px; }
  &.modal-lg { max-width: 720px; }
  &.modal-xl { max-width: 960px; }
  
  &.modal-fullscreen {
    max-width: none;
    width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  
  .modal-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 4px 8px;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    
    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  
  &.modal-body-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }
}

.modal-loader {
  text-align: center;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-color);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }
  
  p {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: var(--bg-tertiary);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
  
  .modal-container {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  
  .modal-container {
    transform: scale(0.95) translateY(20px);
    opacity: 0;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }
  
  .modal-container {
    max-height: 85vh;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    
    &.modal-fullscreen {
      max-height: 100vh;
      border-radius: 0;
    }
  }
}
</style>
