<template>
  <div class="auditlog-view">
    <div class="section-header">
      <h2>📝 Audit Log</h2>
      <button class="btn btn-secondary" @click="refreshData">🔄 Refresh</button>
    </div>
    
    <div class="filters-section">
      <SearchBar v-model="searchQuery" placeholder="Cari audit log..." @search="handleSearch" />
    </div>
    
    <div class="card">
      <div class="card-body" style="padding: 0;">
        <table class="data-table" v-if="!loading && logs.length > 0">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>User</th>
              <th>Aksi</th>
              <th>Modul</th>
              <th>Deskripsi</th>
              <th>Blockchain</th>
              <th>AI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="text-sm">{{ formatDateTime(log.createdAt) }}</td>
              <td>{{ log.userId || '-' }}</td>
              <td><span class="badge badge-info">{{ log.aksi }}</span></td>
              <td>{{ log.modul }}</td>
              <td class="max-w-xs truncate">{{ log.deskripsi || '-' }}</td>
              <td>
                <span v-if="log.verified" class="badge badge-success">✅ Verified</span>
                <span v-else class="badge badge-warning">⏳ Pending</span>
              </td>
              <td>
                <span v-if="log.aiDetected" class="badge badge-info">🤖 AI</span>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="loading" class="p-4 text-center"><LoadingSpinner /></div>
        <div v-else class="empty-state p-4"><span>📝</span><p>Belum ada audit log</p></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import SearchBar from '@/components/common/SearchBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDateTime } from '@/utils/formatters'

export default {
  name: 'AuditLogView',
  components: { SearchBar, LoadingSpinner },
  setup() {
    const adminStore = useAdminStore()
    const loading = ref(false)
    const logs = ref([])
    const searchQuery = ref('')
    
    const fetchData = async () => {
      loading.value = true
      await adminStore.fetchAuditLogs({ search: searchQuery.value })
      logs.value = adminStore.auditLogs
      loading.value = false
    }
    
    const handleSearch = () => fetchData()
    const refreshData = () => fetchData()
    
    onMounted(() => fetchData())
    
    return { loading, logs, searchQuery, formatDateTime, handleSearch, refreshData }
  }
}
</script>

<style lang="scss" scoped>
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; h2 { font-size: 1.25rem; font-weight: 700; margin: 0; } }
.filters-section { margin-bottom: 16px; }
.data-table { width: 100%; border-collapse: collapse;
  th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border-light); font-size: 0.8125rem; }
  th { background: var(--bg-tertiary); font-weight: 600; font-size: 0.7rem; text-transform: uppercase; color: var(--text-secondary); white-space: nowrap; }
  tbody tr:hover { background: var(--bg-hover); }
}
.max-w-xs { max-width: 200px; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-sm { font-size: 0.8125rem; }
.p-4 { padding: 16px; }
</style>
