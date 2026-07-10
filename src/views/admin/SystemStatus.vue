<template>
  <div class="system-status">
    <div class="section-header">
      <h2>🖥️ Status Sistem</h2>
      <button class="btn btn-secondary" @click="refreshStatus">🔄 Refresh</button>
    </div>
    
    <!-- System Info Cards -->
    <div class="stats-grid" v-if="!loading">
      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div>
          <div class="stat-value">{{ info?.version || '3.1.0' }}</div>
          <div class="stat-label">Versi Aplikasi</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🟢</div>
        <div>
          <div class="stat-value text-success">Online</div>
          <div class="stat-label">Status API</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div>
          <div class="stat-value">{{ info?.spreadsheetId ? '✅' : '❌' }}</div>
          <div class="stat-label">Spreadsheet</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div>
          <div class="stat-value">{{ info?.masterFolderId ? '✅' : '❌' }}</div>
          <div class="stat-label">Master Folder</div>
        </div>
      </div>
    </div>
    
    <div v-else class="stats-grid">
      <div v-for="i in 4" :key="i" class="skeleton-card"></div>
    </div>
    
    <!-- Detailed Info -->
    <div class="card mt-4" v-if="!loading && info">
      <div class="card-header"><h3 class="card-title">Informasi Detail</h3></div>
      <div class="card-body">
        <div class="info-grid">
          <div class="info-item"><label>Nama Aplikasi</label><span>Arsip Surat Digital Enterprise</span></div>
          <div class="info-item"><label>Versi</label><span>{{ info.version || '3.1.0' }}</span></div>
          <div class="info-item"><label>API Version</label><span>{{ info.apiVersion || 'v3' }}</span></div>
          <div class="info-item"><label>Build Date</label><span>2026-07-10</span></div>
          <div class="info-item"><label>Timezone</label><span>Asia/Jakarta</span></div>
          <div class="info-item"><label>Spreadsheet ID</label><span class="font-mono text-xs">{{ info.spreadsheetId || '-' }}</span></div>
          <div class="info-item"><label>Master Folder ID</label><span class="font-mono text-xs">{{ info.masterFolderId || '-' }}</span></div>
          <div class="info-item"><label>Features</label>
            <span>
              <span class="badge badge-success">AI</span>
              <span class="badge badge-info ml-1">Blockchain</span>
              <span class="badge badge-warning ml-1">Biometric</span>
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- API Test -->
    <div class="card mt-4">
      <div class="card-header"><h3 class="card-title">API Connection Test</h3></div>
      <div class="card-body">
        <div class="test-results">
          <div class="test-item">
            <span>Ping Test</span>
            <span v-if="pingResult === null">⏳ Testing...</span>
            <span v-else-if="pingResult" class="text-success">✅ Connected</span>
            <span v-else class="text-danger">❌ Failed</span>
          </div>
          <div class="test-item">
            <span>Auth Test</span>
            <span v-if="authResult === null">⏳ Testing...</span>
            <span v-else-if="authResult" class="text-success">✅ Authenticated</span>
            <span v-else class="text-danger">❌ Failed</span>
          </div>
          <div class="test-item">
            <span>Database Test</span>
            <span v-if="dbResult === null">⏳ Testing...</span>
            <span v-else-if="dbResult" class="text-success">✅ Accessible</span>
            <span v-else class="text-danger">❌ Failed</span>
          </div>
        </div>
        <button class="btn btn-secondary mt-3" @click="runTests">🔄 Run Tests</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import API from '@/api'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

export default {
  name: 'SystemStatus',
  components: { LoadingSpinner },
  setup() {
    const loading = ref(true)
    const info = ref(null)
    const pingResult = ref(null)
    const authResult = ref(null)
    const dbResult = ref(null)
    
    const refreshStatus = async () => {
      loading.value = true
      try {
        const res = await API.systemStatus()
        if (res.status === 'success') info.value = res.data
      } catch (err) {} finally { loading.value = false }
    }
    
    const runTests = async () => {
      pingResult.value = null
      authResult.value = null
      dbResult.value = null
      
      // Ping test
      try {
        const ping = await API.ping()
        pingResult.value = ping.status === 'success'
      } catch { pingResult.value = false }
      
      // Auth test
      try {
        const auth = await API.me()
        authResult.value = auth.status === 'success'
      } catch { authResult.value = false }
      
      // DB test
      try {
        const db = await API.dashboardStats()
        dbResult.value = db.status === 'success'
      } catch { dbResult.value = false }
    }
    
    onMounted(() => {
      refreshStatus()
      runTests()
    })
    
    return { loading, info, pingResult, authResult, dbResult, refreshStatus, runTests }
  }
}
</script>

<style lang="scss" scoped>
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; h2 { font-size: 1.25rem; font-weight: 700; margin: 0; } }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.stat-card { background: var(--bg-card); padding: 16px 20px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 16px;
  .stat-icon { font-size: 32px; }
  .stat-value { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); &.text-success { color: var(--color-success); } }
  .stat-label { font-size: 0.75rem; color: var(--text-secondary); }
}
.skeleton-card { height: 80px; background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 50%, var(--bg-secondary) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: var(--radius-lg); }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.info-item {
  label { display: block; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px; }
  span { font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; }
}
.font-mono { font-family: var(--font-mono); }
.text-xs { font-size: 0.75rem; }
.text-success { color: var(--color-success); }
.text-danger { color: var(--color-danger); }
.ml-1 { margin-left: 4px; }
.mt-3 { margin-top: 12px; }
.mt-4 { margin-top: 16px; }
.test-results { display: flex; flex-direction: column; gap: 12px; }
.test-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md); font-size: 0.875rem; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } }
</style>
