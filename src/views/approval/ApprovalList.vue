<template>
  <DefaultLayout>
    <div class="approval-page">
      <div class="page-header">
        <h1 class="page-title">✅ Approval Surat Keluar</h1>
        <p class="page-subtitle">Proses persetujuan surat keluar</p>
      </div>
      
      <div class="filters-section">
        <div class="filter-row">
          <select v-model="filterStatus" class="filter-select" @change="fetchData">
            <option value="">Semua</option>
            <option value="pending">Pending</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>
      
      <div class="card" v-if="!loading">
        <div class="card-body" style="padding: 0;">
          <table class="data-table" v-if="items.length > 0">
            <thead>
              <tr>
                <th>Surat</th>
                <th>Level</th>
                <th>Status</th>
                <th>Komentar</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td><div class="font-medium">{{ item.suratKeluarId }}</div></td>
                <td>Level {{ item.level }}</td>
                <td><span class="badge" :class="`badge-${getStatusBadge(item.status)}`">{{ item.status }}</span></td>
                <td>{{ item.komentar || '-' }}</td>
                <td>{{ formatDate(item.createdAt) }}</td>
                <td>
                  <div class="action-buttons" v-if="item.status === 'pending'">
                    <button class="btn btn-sm btn-success" @click="processApproval(item.id, 'approved')">✅ Setuju</button>
                    <button class="btn btn-sm btn-danger" @click="openReject(item)">❌ Tolak</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state"><span>✅</span><p>Belum ada approval</p></div>
        </div>
      </div>
      <LoadingSpinner v-else text="Memuat..." />
    </div>
    
    <ModalDialog v-model="showRejectModal" title="Tolak Approval" confirmText="Tolak" @confirm="handleReject">
      <div class="form-group">
        <label>Alasan Penolakan</label>
        <textarea v-model="rejectKomentar" class="form-control" rows="3" placeholder="Tulis alasan penolakan..."></textarea>
      </div>
    </ModalDialog>
  </DefaultLayout>
</template>

<script>
import { ref, onMounted } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import API from '@/api'
import { formatDate } from '@/utils/formatters'

export default {
  name: 'ApprovalList',
  components: { DefaultLayout, LoadingSpinner, ModalDialog },
  setup() {
    const loading = ref(false)
    const items = ref([])
    const filterStatus = ref('')
    const showRejectModal = ref(false)
    const rejectId = ref(null)
    const rejectKomentar = ref('')
    
    const getStatusBadge = (s) => ({ pending: 'warning', approved: 'success', rejected: 'danger' }[s] || 'warning')
    
    const fetchData = async () => {
      loading.value = true
      try {
        const res = await API.approvalList({ status: filterStatus.value || undefined })
        if (res.status === 'success') items.value = res.data.items
      } catch (err) {} finally { loading.value = false }
    }
    
    const processApproval = async (id, status) => {
      try {
        await API.approvalProcess(id, { status, komentar: '' })
        fetchData()
      } catch (err) {}
    }
    
    const openReject = (item) => {
      rejectId.value = item.id
      rejectKomentar.value = ''
      showRejectModal.value = true
    }
    
    const handleReject = async () => {
      if (!rejectId.value) return
      try {
        await API.approvalProcess(rejectId.value, { status: 'rejected', komentar: rejectKomentar.value })
        showRejectModal.value = false
        fetchData()
      } catch (err) {}
    }
    
    onMounted(() => fetchData())
    
    return {
      loading, items, filterStatus, showRejectModal, rejectKomentar,
      formatDate, getStatusBadge, fetchData, processApproval, openReject, handleReject
    }
  }
}
</script>

<style lang="scss" scoped>
.approval-page { animation: fadeIn 0.4s ease-out; }
.page-header { margin-bottom: 24px; .page-title { font-size: 1.5rem; font-weight: 700; } .page-subtitle { color: var(--text-secondary); font-size: 0.875rem; } }
.filters-section { margin-bottom: 16px; }
.filter-row { display: flex; gap: 8px; }
.filter-select { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.8125rem; background: var(--bg-card); }
.data-table { width: 100%; border-collapse: collapse;
  th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border-light); }
  th { background: var(--bg-tertiary); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
  tbody tr:hover { background: var(--bg-hover); }
}
.action-buttons { display: flex; gap: 4px; }
.font-medium { font-weight: 500; }
.form-group { margin-bottom: 16px;
  label { display: block; margin-bottom: 4px; font-weight: 500; }
  .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); }
}
.btn-sm { padding: 6px 12px; font-size: 0.75rem; border-radius: var(--radius-md); cursor: pointer; border: none; font-weight: 500; }
.btn-success { background: var(--color-success); color: white; }
.btn-danger { background: var(--color-danger); color: white; }
</style>
