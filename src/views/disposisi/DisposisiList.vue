<template>
  <DefaultLayout>
    <div class="disposisi-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">📋 Disposisi</h1>
          <p class="page-subtitle">Kelola disposisi surat masuk</p>
        </div>
      </div>
      
      <div class="filters-section">
        <div class="filter-row">
          <select v-model="filterStatus" class="filter-select" @change="fetchData">
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>
      </div>
      
      <div class="card" v-if="!loading">
        <div class="card-body" style="padding: 0;">
          <table class="data-table" v-if="items.length > 0">
            <thead>
              <tr>
                <th>Surat</th>
                <th>Dari</th>
                <th>Kepada</th>
                <th>Instruksi</th>
                <th>Status</th>
                <th>Batas Waktu</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>
                  <div class="font-medium">{{ item.suratMasukId }}</div>
                </td>
                <td>{{ item.dariUserId }}</td>
                <td>{{ item.kepadaUserId }}</td>
                <td>
                  <div class="max-w-xs truncate">{{ item.instruksi || '-' }}</div>
                </td>
                <td>
                  <span class="badge" :class="`badge-${getStatusBadge(item.status)}`">{{ item.status }}</span>
                </td>
                <td>{{ formatDate(item.batasWaktu) }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-sm btn-icon" title="Tindak Lanjut" @click="openTindakLanjut(item)">✅</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <span>📋</span>
            <p>Belum ada disposisi</p>
          </div>
        </div>
      </div>
      
      <LoadingSpinner v-else text="Memuat data..." />
    </div>
    
    <ModalDialog v-model="showTLModal" title="Tindak Lanjut Disposisi" confirmText="Simpan" @confirm="handleTindakLanjut">
      <div class="form-group">
        <label>Status</label>
        <select v-model="tlForm.status" class="form-control">
          <option value="diproses">Diproses</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>
      <div class="form-group">
        <label>Catatan Tindak Lanjut</label>
        <textarea v-model="tlForm.tindakLanjut" class="form-control" rows="3"></textarea>
      </div>
    </ModalDialog>
  </DefaultLayout>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import API from '@/api'
import { formatDate } from '@/utils/formatters'

export default {
  name: 'DisposisiList',
  components: { DefaultLayout, LoadingSpinner, ModalDialog },
  setup() {
    const loading = ref(false)
    const items = ref([])
    const filterStatus = ref('')
    const showTLModal = ref(false)
    const selectedItem = ref(null)
    const tlForm = reactive({ status: 'selesai', tindakLanjut: '' })
    
    const getStatusBadge = (s) => ({ pending: 'warning', diproses: 'info', selesai: 'success' }[s] || 'warning')
    
    const fetchData = async () => {
      loading.value = true
      try {
        const res = await API.disposisiList({ status: filterStatus.value || undefined })
        if (res.status === 'success') items.value = res.data.items
      } catch (err) {} finally { loading.value = false }
    }
    
    const openTindakLanjut = (item) => {
      selectedItem.value = item
      tlForm.status = 'selesai'
      tlForm.tindakLanjut = item.tindakLanjut || ''
      showTLModal.value = true
    }
    
    const handleTindakLanjut = async () => {
      if (!selectedItem.value) return
      try {
        await API.disposisiTindakLanjut(selectedItem.value.id, tlForm)
        showTLModal.value = false
        fetchData()
      } catch (err) {}
    }
    
    onMounted(() => fetchData())
    
    return {
      loading, items, filterStatus, showTLModal, selectedItem, tlForm,
      formatDate, getStatusBadge, fetchData, openTindakLanjut, handleTindakLanjut
    }
  }
}
</script>

<style lang="scss" scoped>
.disposisi-page { animation: fadeIn 0.4s ease-out; }
.page-header { margin-bottom: 24px; .page-title { font-size: 1.5rem; font-weight: 700; } .page-subtitle { color: var(--text-secondary); font-size: 0.875rem; } }
.filters-section { margin-bottom: 16px; }
.filter-row { display: flex; gap: 8px; }
.filter-select { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.8125rem; background: var(--bg-card); min-width: 150px; }
.data-table { width: 100%; border-collapse: collapse;
  th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border-light); }
  th { background: var(--bg-tertiary); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); }
  td { font-size: 0.875rem; }
  tbody tr:hover { background: var(--bg-hover); }
}
.action-buttons { display: flex; gap: 4px; }
.btn-icon { width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: transparent; border: 1px solid var(--border-color); cursor: pointer; }
.max-w-xs { max-width: 200px; }
.font-medium { font-weight: 500; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.form-group { margin-bottom: 16px;
  label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.875rem; }
  .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; }
}
</style>
