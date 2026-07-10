<template>
  <div class="blockchain-view">
    <div class="section-header">
      <h2>⛓️ Blockchain Audit</h2>
      <div class="header-actions">
        <span class="badge" :class="blockchain.isValid ? 'badge-success' : 'badge-danger'">
          {{ blockchain.isValid ? '✅ Chain Valid' : '❌ Chain Invalid' }}
        </span>
        <button class="btn btn-secondary" @click="refreshData">🔄 Refresh</button>
      </div>
    </div>
    
    <!-- Stats -->
    <div class="stats-grid mb-4" v-if="!loading">
      <div class="stat-card">
        <div class="stat-value">{{ blockchain.stats.totalBlocks || 0 }}</div>
        <div class="stat-label">Total Blocks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-success">{{ blockchain.isValid ? 'Valid' : 'Invalid' }}</div>
        <div class="stat-label">Chain Status</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ CONFIG.BLOCKCHAIN.DIFFICULTY }}</div>
        <div class="stat-label">Difficulty</div>
      </div>
    </div>
    
    <!-- Chain -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">📦 Blockchain</h3>
      </div>
      <div class="card-body" style="padding: 0;">
        <table class="data-table" v-if="!loading && chain.length > 0">
          <thead>
            <tr>
              <th>Index</th>
              <th>Timestamp</th>
              <th>Data</th>
              <th>Hash</th>
              <th>Previous Hash</th>
              <th>Nonce</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="block in chain" :key="block.index">
              <td><span class="badge badge-primary">#{{ block.index }}</span></td>
              <td class="text-xs">{{ formatDateTime(block.timestamp) }}</td>
              <td class="max-w-xs truncate text-xs">{{ block.data }}</td>
              <td class="max-w-xs truncate font-mono text-xxs">{{ block.hash }}</td>
              <td class="max-w-xs truncate font-mono text-xxs">{{ block.previousHash }}</td>
              <td>{{ block.nonce }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="loading" class="p-4 text-center"><LoadingSpinner /></div>
        <div v-else class="empty-state p-4"><span>⛓️</span><p>Blockchain kosong</p></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDateTime } from '@/utils/formatters'

const CONFIG = { BLOCKCHAIN: { DIFFICULTY: 3 } }

export default {
  name: 'BlockchainView',
  components: { LoadingSpinner },
  setup() {
    const adminStore = useAdminStore()
    const loading = ref(false)
    const blockchain = ref({ chain: [], stats: {}, isValid: false })
    const chain = ref([])
    
    const refreshData = async () => {
      loading.value = true
      await adminStore.fetchBlockchain()
      blockchain.value = adminStore.blockchain
      chain.value = adminStore.blockchain.chain || []
      loading.value = false
    }
    
    onMounted(() => refreshData())
    
    return { loading, blockchain, chain, CONFIG, formatDateTime, refreshData }
  }
}
</script>

<style lang="scss" scoped>
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
  h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
  .header-actions { display: flex; gap: 8px; align-items: center; }
}
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
.stat-card { background: var(--bg-card); padding: 16px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); text-align: center;
  .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); &.text-success { color: var(--color-success); } }
  .stat-label { font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px; }
}
.data-table { width: 100%; border-collapse: collapse;
  th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border-light); font-size: 0.75rem; }
  th { background: var(--bg-tertiary); font-weight: 600; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); white-space: nowrap; }
  tbody tr:hover { background: var(--bg-hover); }
}
.max-w-xs { max-width: 150px; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.font-mono { font-family: var(--font-mono); }
.text-xs { font-size: 0.75rem; }
.text-xxs { font-size: 0.625rem; }
.mb-4 { margin-bottom: 16px; }
.p-4 { padding: 16px; }
</style>
