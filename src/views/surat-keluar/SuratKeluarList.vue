<template>
  <DefaultLayout>
    <div class="surat-keluar-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">📤 Surat Keluar</h1>
          <p class="page-subtitle">Kelola surat keluar dan approval</p>
        </div>
        <div class="page-actions">
          <router-link to="/surat-keluar/create" class="btn btn-primary">
            <span>➕</span> Buat Surat Keluar
          </router-link>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="filters-section">
        <SearchBar
          v-model="searchQuery"
          placeholder="Cari surat keluar..."
          @search="handleSearch"
          @clear="handleClearSearch"
        />
        
        <div class="filter-row">
          <select v-model="filterStatus" class="filter-select" @change="applyFilters">
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="dikirim">Dikirim</option>
            <option value="selesai">Selesai</option>
          </select>
          
          <select v-model="filterApproval" class="filter-select" @change="applyFilters">
            <option value="">Semua Approval</option>
            <option value="pending">Pending</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
          
          <select v-model="filterTahun" class="filter-select" @change="applyFilters">
            <option value="">Semua Tahun</option>
            <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
      </div>
      
      <!-- Table -->
      <div class="card">
        <div class="card-body" style="padding: 0;">
          <DataTable
            :columns="columns"
            :data="items"
            :loading="loading"
            :showPagination="true"
            :currentPage="pagination.page"
            :totalPages="pagination.totalPages"
            :total="pagination.total"
            :pageSize="pagination.limit"
            emptyText="Belum ada surat keluar"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          >
            <template #cell-nomorSurat="{ row }">
              <div class="font-medium">{{ row.nomorSurat || '-' }}</div>
            </template>
            
            <template #cell-perihal="{ row }">
              <div class="max-w-xs">
                <div class="truncate font-medium">{{ row.perihal || '-' }}</div>
                <div class="text-xs text-muted">{{ row.tujuan }}</div>
              </div>
            </template>
            
            <template #cell-sifat="{ row }">
              <span class="badge" :class="`badge-${getSifatBadge(row.sifat)}`">
                {{ sifatLabel(row.sifat) }}
              </span>
            </template>
            
            <template #cell-status="{ row }">
              <span class="badge" :class="`badge-${getStatusBadge(row.status)}`">
                {{ statusLabel(row.status) }}
              </span>
            </template>
            
            <template #cell-approvalStatus="{ row }">
              <span class="badge" :class="`badge-${getApprovalBadge(row.approvalStatus)}`">
                {{ row.approvalStatus === 'approved' ? '✅ Disetujui' : row.approvalStatus === 'rejected' ? '❌ Ditolak' : '⏳ Pending' }}
              </span>
            </template>
            
            <template #cell-tanggalSurat="{ row }">
              <div class="text-sm">{{ formatDate(row.tanggalSurat) }}</div>
            </template>
            
            <template #actions="{ row }">
              <div class="action-buttons">
                <button class="btn btn-sm btn-icon" title="Lihat" @click="viewDetail(row.id)">👁️</button>
                <button class="btn btn-sm btn-icon" title="Edit" @click="editSurat(row.id)">✏️</button>
                <button
                  v-if="row.approvalStatus === 'pending' || !row.approvalStatus"
                  class="btn btn-sm btn-icon"
                  title="Submit Approval"
                  @click="submitApproval(row.id)"
                >✅</button>
                <button v-if="isAdmin" class="btn btn-sm btn-icon btn-danger-icon" title="Hapus" @click="confirmDelete(row)">🗑️</button>
              </div>
            </template>
          </DataTable>
        </div>
      </div>
    </div>
    
    <!-- Delete Modal -->
    <ModalDialog
      v-model="showDeleteModal"
      title="Konfirmasi Hapus"
      confirmText="Hapus"
      :loading="deleting"
      @confirm="handleDelete"
    >
      <p>Apakah Anda yakin ingin menghapus surat keluar ini?</p>
      <p class="text-danger text-sm mt-2">Tindakan ini tidak dapat dibatalkan.</p>
    </ModalDialog>
  </DefaultLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSuratKeluarStore } from '@/stores/suratKeluar'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import { formatDate, sifatLabel, statusLabel } from '@/utils/formatters'

export default {
  name: 'SuratKeluarList',
  components: { DefaultLayout, DataTable, SearchBar, ModalDialog },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const store = useSuratKeluarStore()
    
    const searchQuery = ref('')
    const filterStatus = ref('')
    const filterApproval = ref('')
    const filterTahun = ref('')
    const showDeleteModal = ref(false)
    const deleting = ref(false)
    const selectedSurat = ref(null)
    
    const isAdmin = computed(() => authStore.isAdmin)
    const items = computed(() => store.items)
    const loading = computed(() => store.loading)
    const pagination = computed(() => store.pagination)
    
    const yearOptions = computed(() => {
      const years = []
      const now = new Date().getFullYear()
      for (let i = now; i >= now - 5; i--) years.push(i)
      return years
    })
    
    const columns = [
      { key: 'nomorSurat', label: 'Nomor Surat', sortable: true, minWidth: '160px' },
      { key: 'perihal', label: 'Perihal/Tujuan', sortable: true, minWidth: '200px' },
      { key: 'sifat', label: 'Sifat', width: '90px' },
      { key: 'jenisSurat', label: 'Jenis', width: '130px' },
      { key: 'status', label: 'Status', width: '100px' },
      { key: 'approvalStatus', label: 'Approval', width: '120px' },
      { key: 'tanggalSurat', label: 'Tanggal', width: '120px' }
    ]
    
    const getSifatBadge = (s) => ({ biasa: 'secondary', penting: 'warning', rahasia: 'danger', segera: 'info' }[s] || 'secondary')
    const getStatusBadge = (s) => ({ draft: 'secondary', dikirim: 'info', selesai: 'success' }[s] || 'secondary')
    const getApprovalBadge = (s) => ({ pending: 'warning', approved: 'success', rejected: 'danger' }[s] || 'warning')
    
    const fetchData = () => store.fetchList()
    
    const applyFilters = () => {
      store.setFilters({
        search: searchQuery.value,
        status: filterStatus.value,
        approvalStatus: filterApproval.value,
        tahun: filterTahun.value
      })
    }
    
    const handleSearch = (q) => { searchQuery.value = q; applyFilters() }
    const handleClearSearch = () => { searchQuery.value = ''; applyFilters() }
    const handlePageChange = (p) => store.setPage(p)
    const handlePageSizeChange = (s) => { store.pagination.limit = s; store.setPage(1) }
    const viewDetail = (id) => router.push({ name: 'SuratKeluarDetail', params: { id } })
    const editSurat = (id) => router.push({ name: 'SuratKeluarEdit', params: { id } })
    
    const submitApproval = async (id) => {
      const result = await store.submitApproval(id)
      if (result.success) fetchData()
    }
    
    const confirmDelete = (row) => {
      selectedSurat.value = row
      showDeleteModal.value = true
    }
    
    const handleDelete = async () => {
      if (!selectedSurat.value) return
      deleting.value = true
      await store.remove(selectedSurat.value.id)
      deleting.value = false
      showDeleteModal.value = false
    }
    
    onMounted(() => fetchData())
    
    return {
      searchQuery, filterStatus, filterApproval, filterTahun,
      showDeleteModal, deleting, selectedSurat,
      isAdmin, items, loading, pagination, yearOptions, columns,
      formatDate, sifatLabel, statusLabel,
      getSifatBadge, getStatusBadge, getApprovalBadge,
      applyFilters, handleSearch, handleClearSearch,
      handlePageChange, handlePageSizeChange,
      viewDetail, editSurat, submitApproval, confirmDelete, handleDelete
    }
  }
}
</script>

<style lang="scss" scoped>
.surat-keluar-page {
  animation: fadeIn 0.4s ease-out;
}
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 24px; flex-wrap: wrap; gap: 16px;
  .page-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px; }
  .page-subtitle { color: var(--text-secondary); font-size: 0.875rem; margin: 0; }
  .page-actions { display: flex; gap: 8px; }
}
.filters-section { margin-bottom: 16px; }
.filter-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.filter-select {
  padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md);
  font-size: 0.8125rem; background: var(--bg-card); color: var(--text-primary); min-width: 150px;
  &:focus { outline: none; border-color: var(--color-primary); }
}
.action-buttons { display: flex; gap: 4px; }
.btn-icon {
  width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md); background: transparent; border: 1px solid var(--border-color);
  cursor: pointer; font-size: 14px; transition: all var(--transition-fast);
  &:hover { background: var(--bg-hover); }
  &.btn-danger-icon:hover { background: #FFEBEE; border-color: var(--color-danger); color: var(--color-danger); }
}
.max-w-xs { max-width: 250px; }
.font-medium { font-weight: 500; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-muted { color: var(--text-tertiary); }
.text-danger { color: var(--color-danger); }
.mt-2 { margin-top: 8px; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
