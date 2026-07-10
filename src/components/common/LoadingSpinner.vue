<template>
  <div class="loading-spinner" :class="[`size-${size}`, { 'fullscreen': fullscreen }]">
    <div class="spinner-ring"></div>
    <p v-if="text" class="spinner-text">{{ text }}</p>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  props: {
    size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
    text: { type: String, default: '' },
    fullscreen: { type: Boolean, default: false }
  }
}
</script>

<style lang="scss" scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  
  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
  }
  
  &.size-sm .spinner-ring {
    width: 24px;
    height: 24px;
    border-width: 3px;
  }
  
  &.size-md .spinner-ring {
    width: 40px;
    height: 40px;
    border-width: 4px;
  }
  
  &.size-lg .spinner-ring {
    width: 64px;
    height: 64px;
    border-width: 5px;
  }
}

.spinner-ring {
  border-style: solid;
  border-color: var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-text {
  margin-top: 12px;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
