<template>
  <div class="backup-manage">
    <div class="section-header">
      <h2>💾 Backup & Restore</h2>
      <button class="btn btn-primary" @click="createBackup" :disabled="backingUp">
        {{ backingUp ? '⏳ Membuat Backup...' : '➕ Buat Backup' }}
      </button>
    </div>
    
    <div class="card mb-4">
      <div class="card-header"><h3 class="card-title">Informasi Backup</h3></div>
      <div class="card-body">
        <p class="text-sm text-muted">
          Backup akan menyimpan seluruh data dari spreadsheet ke folder backup di Google Drive.
          Proses backup mungkin memerlukan beberapa saat tergantung jumlah data.
        </p>
        <div class="info-grid mt-3">
          <div class="info-item">
            <label>Total Sheet</label>
            <span>13+ Sheets</span>
          </div>
          <div class="info-item">
            <label>Lokasi Backup</label>
            <span>Google Drive / Backup</span>
          </div>
          <div class="info-item">
            <label>Format</label>
            <span>Excel (.xlsx)</span>
          </div>
          <div class="info-item">
            <label>Auto Backup</label>
            <span class="badge badge-warning">Manual</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Riwayat Backup</h3>
        <button class="btn btn-sm btn-secondary" @click="fetchBackups">🔄 Refresh</button>
      </div>
      <div class="card-body" style="padding: 0;">
        <table class="data-table" v-if="!loading && backups.length > 0">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama File</th>
              <th>Ukuran</th>
              <th>Dibuat Oleh</th>
              <th>Tanggal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(backup, index) in backups" :key="backup.id">
              <td>{{ index + 1 }}</td>
              <td class="font-medium">{{ backup.fileName }}</td>
              <td>{{ formatFileSize(backup.fileSize) }}</td>
              <td>{{ backup.createdBy || '-' }}</td>
              <td>{{ formatDateTime(backup.createdAt) }}</td>
              <td>
                <a v-if="backup.fileUrl" :href="backup.fileUrl" target="_blank" class="btn btn-sm btn-primary">📥 Download</a>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="loading" class="p-4 text-center"><LoadingSpinner /></div>
        <div v-else class="empty-state p-4"><span>💾</span><p>Belum ada backup</p></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDateTime } from '@/utils/formatters'
import { formatFileSize } from '@/utils/helpers'

export default {
  name: 'BackupManage',
  components: { LoadingSpinner },
  setup() {
    const adminStore = useAdminStore()
    const loading = ref(false)
    const backingUp = ref(false)
    const backups = ref([])
    
    const fetchBackups = async () => {
      loading.value = true
      const result = await adminStore.fetchBackups()
      if (result.success) backups.value = result.data || []
      loading.value = false
    }
    
    const createBackup = async () => {
      backingUp.value = true
      const result = await adminStore.createBackup()
      if (result.success) {
        await fetchBackups()
      }
      backingUp.value = false
    }
    
    onMounted(() => fetchBackups())
    
    return { loading, backingUp, backups, formatDateTime, formatFileSize, fetchBackups, createBackup }
  }
}
</script>

<style lang="scss" scoped>
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; h2 { font-size: 1.25rem; font-weight: 700; margin: 0; } }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.info-item {
  label { display: block; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px; }
  span { font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; }
}
.data-table { width: 100%; border-collapse: collapse;
  th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border-light); }
  th { background: var(--bg-tertiary); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); }
  tbody tr:hover { background: var(--bg-hover); }
}
.font-medium { font-weight: 500; }
.text-sm { font-size: 0.875rem; }
.text-muted { color: var(--text-secondary); }
.mb-4 { margin-bottom: 16px; }
.mt-3 { margin-top: 12px; }
.p-4 { padding: 16px; }
</style>
