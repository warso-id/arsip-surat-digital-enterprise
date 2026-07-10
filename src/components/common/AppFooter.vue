<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-left">
        <span class="footer-brand">📁 Arsip Surat Digital Enterprise v3.1.0</span>
        <span class="footer-separator">|</span>
        <span class="footer-build">Build: 2026-07-10</span>
      </div>
      
      <div class="footer-center">
        <span class="footer-status" :class="systemStatusClass">
          <span class="status-dot"></span>
          {{ systemStatusText }}
        </span>
        <span class="footer-separator">|</span>
        <span class="footer-blockchain" v-if="blockchainInfo">
          <span>⛓️ Block #{{ blockchainInfo.totalBlocks }}</span>
        </span>
      </div>
      
      <div class="footer-right">
        <span class="footer-copyright">© 2026 Arsip Surat Digital Enterprise</span>
        <span class="footer-separator">|</span>
        <span class="footer-credit">Made with ❤️</span>
      </div>
    </div>
  </footer>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import API from '@/api'

export default {
  name: 'AppFooter',
  setup() {
    const appStore = useAppStore()
    const blockchainInfo = ref(null)
    const systemStatus = ref('online')
    
    const systemStatusClass = computed(() => {
      return systemStatus.value === 'online' ? 'status-online' : 'status-offline'
    })
    
    const systemStatusText = computed(() => {
      return systemStatus.value === 'online' ? '🟢 Sistem Online' : '🔴 Sistem Offline'
    })
    
    const fetchSystemInfo = async () => {
      try {
        const [blockchainRes] = await Promise.all([
          API.blockchainGetStats().catch(() => null)
        ])
        
        if (blockchainRes?.status === 'success') {
          blockchainInfo.value = blockchainRes.data
        }
        
        systemStatus.value = 'online'
      } catch (err) {
        systemStatus.value = 'offline'
      }
    }
    
    let interval = null
    
    onMounted(() => {
      fetchSystemInfo()
      interval = setInterval(fetchSystemInfo, 30000)
    })
    
    onUnmounted(() => {
      if (interval) clearInterval(interval)
    })
    
    return {
      blockchainInfo,
      systemStatus,
      systemStatusClass,
      systemStatusText
    }
  }
}
</script>

<style lang="scss" scoped>
.app-footer {
  background: var(--bg-card);
  border-top: 1px solid var(--border-color);
  padding: 12px 24px;
  margin-top: auto;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.footer-left,
.footer-center,
.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-brand {
  font-weight: 600;
  color: var(--text-primary);
}

.footer-build {
  font-family: var(--font-mono);
  font-size: 0.7rem;
}

.footer-separator {
  color: var(--border-dark);
}

.footer-status {
  display: flex;
  align-items: center;
  gap: 6px;
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  &.status-online .status-dot {
    background: var(--color-success);
    box-shadow: 0 0 6px var(--color-success);
  }
  
  &.status-offline .status-dot {
    background: var(--color-danger);
  }
}

.footer-blockchain {
  font-family: var(--font-mono);
  font-size: 0.7rem;
}

.footer-copyright {
  color: var(--text-tertiary);
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-left,
  .footer-center,
  .footer-right {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
