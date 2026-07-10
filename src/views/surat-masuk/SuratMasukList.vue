<template>
  <DefaultLayout>
    <div class="surat-masuk-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">📥 Surat Masuk</h1>
          <p class="page-subtitle">Kelola surat masuk dan disposisi</p>
        </div>
        <div class="page-actions">
          <router-link to="/surat-masuk/create" class="btn btn-primary">
            <span>➕</span> Tambah Surat Masuk
          </router-link>
          <button class="btn btn-secondary" @click="exportData">
            <span>📊</span> Export
          </button>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="filters-section">
        <SearchBar
          v-model="searchQuery"
          placeholder="Cari surat masuk..."
          @search="handleSearch"
          @clear="handleClearSearch"
        />
        
        <div class="filter-row">
          <select v-model="filterStatus" class="filter-select" @change="applyFilters">
            <option value="">Semua Status</option>
            <option value="diterima">Diterima</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="diarsipkan">Diarsipkan</option>
          </select>
          
          <select v-model="filterSifat" class="filter-select" @change="applyFilters">
            <option value="">Semua Sifat</option>
            <option value="biasa">Biasa</option>
            <option value="penting">Penting</option>
            <option value="rahasia">Rahasia</option>
            <option value="segera">Segera</option>
          </select>
          
          <select v-model="filterTahun" class="filter-select" @change="applyFilters">
            <option value="">Semua Tahun</option>
            <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
          </select>
          
          <button v-if="hasActiveFilters" class="btn btn-sm btn-secondary" @click="clearAllFilters">
            ✕ Hapus Filter
          </button>
        </div>
      </div>
      
      <!-- Stats Summary -->
      <div class="stats-summary" v-if="!loading">
        <div class="summary-item">
          <span class="summary-value">{{ stats.total || 0 }}</span>
          <span class="summary-label">Total Surat</span>
        </div>
        <div class="summary-item">
          <span class="summary-value text-warning">{{ stats.pending || 0 }}</span>
          <span class="summary-label">Pending</span>
        </div>
        <div class="summary-item">
          <span class="summary-value text-success">{{ stats.selesai || 0 }}</span>
          <span class="summary-label">Selesai</span>
        </div>
        <div class="summary-item">
          <span class="summary-value text-info">{{ stats.hariIni || 0 }}</span>
          <span class="summary-label">Hari Ini</span>
        </div>
      </div>
      
      <!-- Table -->
      <div class="card">
        <div class="card-body" style="padding: 0;">
          <DataTable
            :columns="columns"
            :data="items"
            :loading="loading"
            :selectable="true"
            :selectedIds="selectedIds"
            :showPagination="true"
            :currentPage="pagination.page"
            :totalPages="pagination.totalPages"
            :total="pagination.total"
            :pageSize="pagination.limit"
            emptyText="Belum ada surat masuk"
            @selection-change="selectedIds = $event"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          >
            <!-- Custom Cell Templates -->
            <template #cell-nomorSurat="{ row }">
              <div>
                <div class="font-medium">{{ row.nomorSurat || '-' }}</div>
                <div class="text-xs text-muted">{{ row.nomorAgenda }}</div>
              </div>
            </template>
            
            <template #cell-perihal="{ row }">
              <div class="max-w-xs">
                <div class="truncate font-medium">{{ row.perihal || '-' }}</div>
                <div class="text-xs text-muted">{{ row.pengirim }}</div>
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
            
            <template #cell-tanggalSurat="{ row }">
              <div class="text-sm">
                <div>{{ formatDate(row.tanggalSurat) }}</div>
                <div class="text-xs text-muted">{{ formatDate(row.tanggalTerima) }}</div>
              </div>
            </template>
            
            <template #cell-aiTags="{ row }">
              <div class="flex gap-1 flex-wrap" v-if="row.aiTags && row.aiTags.length > 0">
                <span v-for="tag in row.aiTags.slice(0, 3)" :key="tag" class="badge badge-info text-xxs">
                  {{ tag }}
                </span>
              </div>
              <span v-else class="text-muted">-</span>
            </template>
            
            <!-- Actions -->
            <template #actions="{ row }">
              <div class="action-buttons">
                <button
                  class="btn btn-sm btn-icon"
                  title="Lihat Detail"
                  @click="viewDetail(row.id)"
                >
                  👁️
                </button>
                <button
                  class="btn btn-sm btn-icon"
                  title="Edit"
                  @click="editSurat(row.id)"
                >
                  ✏️
                </button>
                <button
                  class="btn btn-sm btn-icon"
                  title="Disposisi"
                  @click="openDisposisi(row.id)"
                >
                  📋
                </button>
                <button
                  v-if="isAdmin"
                  class="btn btn-sm btn-icon btn-danger-icon"
                  title="Hapus"
                  @click="confirmDelete(row)"
                >
                  🗑️
                </button>
              </div>
            </template>
          </DataTable>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <ModalDialog
      v-model="showDeleteModal"
      title="Konfirmasi Hapus"
      confirmText="Hapus"
      cancelText="Batal"
      :loading="deleting"
      @confirm="handleDelete"
    >
      <p>Apakah Anda yakin ingin menghapus surat masuk ini?</p>
      <p class="text-sm text-muted mt-2">
        <strong>{{ selectedSurat?.nomorSurat || selectedSurat?.nomorAgenda }}</strong>
      </p>
      <p class="text-sm text-danger mt-2">Tindakan ini tidak dapat dibatalkan.</p>
    </ModalDialog>
    
    <!-- Disposisi Modal -->
    <ModalDialog
      v-model="showDisposisiModal"
      title="Buat Disposisi"
      size="lg"
      confirmText="Kirim Disposisi"
      @confirm="handleDisposisi"
    >
      <div class="form-group">
        <label>Tujuan Disposisi</label>
        <select v-model="disposisiForm.kepadaUserId" class="form-control">
          <option value="">Pilih Penerima</option>
          <option v-for="user in userList" :key="user.id" :value="user.id">
            {{ user.namaLengkap }} ({{ user.jabatan }})
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Instruksi</label>
        <textarea v-model="disposisiForm.instruksi" class="form-control" rows="3" placeholder="Tulis instruksi disposisi..."></textarea>
      </div>
      <div class="form-group">
        <label>Sifat</label>
        <select v-model="disposisiForm.sifat" class="form-control">
          <option value="biasa">Biasa</option>
          <option value="segera">Segera</option>
          <option value="penting">Penting</option>
        </select>
      </div>
      <div class="form-group">
        <label>Batas Waktu</label>
        <input type="date" v-model="disposisiForm.batasWaktu" class="form-control" />
      </div>
    </ModalDialog>
  </DefaultLayout>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSuratMasukStore } from '@/stores/suratMasuk'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import { formatDate, sifatLabel, statusLabel } from '@/utils/formatters'

export default {
  name: 'SuratMasukList',
  components: {
    DefaultLayout,
    DataTable,
    SearchBar,
    ModalDialog
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const store = useSuratMasukStore()
    
    const searchQuery = ref('')
    const filterStatus = ref('')
    const filterSifat = ref('')
    const filterTahun = ref('')
    const selectedIds = ref([])
    
    const showDeleteModal = ref(false)
    const deleting = ref(false)
    const selectedSurat = ref(null)
    
    const showDisposisiModal = ref(false)
    const disposisiForm = reactive({
      kepadaUserId: '',
      instruksi: '',
      sifat: 'biasa',
      batasWaktu: ''
    })
    
    const userList = ref([])
    
    const isAdmin = computed(() => authStore.isAdmin)
    const items = computed(() => store.items)
    const loading = computed(() => store.loading)
    const pagination = computed(() => store.pagination)
    const stats = computed(() => ({
      total: store.items.length,
      pending: store.items.filter(i => i.status === 'diterima' || i.status === 'diproses').length,
      selesai: store.items.filter(i => i.status === 'selesai').length,
      hariIni: store.items.filter(i => {
        const d = new Date(i.tanggalTerima || i.tanggalSurat)
        return d.toDateString() === new Date().toDateString()
      }).length
    }))
    
    const hasActiveFilters = computed(() => {
      return filterStatus.value || filterSifat.value || filterTahun.value || searchQuery.value
    })
    
    const yearOptions = computed(() => {
      const years = []
      const now = new Date().getFullYear()
      for (let i = now; i >= now - 5; i--) {
        years.push(i)
      }
      return years
    })
    
    const columns = [
      { key: 'nomorSurat', label: 'Nomor Surat', sortable: true, minWidth: '180px' },
      { key: 'perihal', label: 'Perihal', sortable: true, minWidth: '200px' },
      { key: 'sifat', label: 'Sifat', width: '100px' },
      { key: 'klasifikasi', label: 'Klasifikasi', width: '120px' },
      { key: 'status', label: 'Status', width: '110px' },
      { key: 'tanggalSurat', label: 'Tanggal', width: '130px' },
      { key: 'aiTags', label: 'AI Tags', width: '150px' }
    ]
    
    const getSifatBadge = (sifat) => {
      const map = { biasa: 'secondary', penting: 'warning', rahasia: 'danger', segera: 'info' }
      return map[sifat] || 'secondary'
    }
    
    const getStatusBadge = (status) => {
      const map = { diterima: 'info', diproses: 'warning', selesai: 'success', diarsipkan: 'secondary' }
      return map[status] || 'info'
    }
    
    const fetchData = () => {
      store.fetchList()
    }
    
    const applyFilters = () => {
      store.setFilters({
        search: searchQuery.value,
        status: filterStatus.value,
        sifat: filterSifat.value,
        tahun: filterTahun.value
      })
    }
    
    const handleSearch = (query) => {
      searchQuery.value = query
      applyFilters()
    }
    
    const handleClearSearch = () => {
      searchQuery.value = ''
      applyFilters()
    }
    
    const clearAllFilters = () => {
      searchQuery.value = ''
      filterStatus.value = ''
      filterSifat.value = ''
      filterTahun.value = ''
      store.clearFilters()
    }
    
    const handlePageChange = (page) => {
      store.setPage(page)
    }
    
    const handlePageSizeChange = (size) => {
      store.pagination.limit = size
      store.setPage(1)
    }
    
    const viewDetail = (id) => {
      router.push({ name: 'SuratMasukDetail', params: { id } })
    }
    
    const editSurat = (id) => {
      router.push({ name: 'SuratMasukEdit', params: { id } })
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
      selectedSurat.value = null
    }
    
    const openDisposisi = async (id) => {
      selectedSurat.value = store.items.find(i => i.id === id)
      disposisiForm.kepadaUserId = ''
      disposisiForm.instruksi = ''
      disposisiForm.sifat = 'biasa'
      disposisiForm.batasWaktu = ''
      
      // Fetch user list for disposisi
      try {
        const API = (await import('@/api')).default
        const response = await API.usersList({ isActive: 'true' })
        if (response.status === 'success') {
          userList.value = response.data.items.filter(u => u.id !== authStore.user?.id)
        }
      } catch (err) {}
      
      showDisposisiModal.value = true
    }
    
    const handleDisposisi = async () => {
      if (!selectedSurat.value || !disposisiForm.kepadaUserId) return
      
      try {
        const API = (await import('@/api')).default
        const response = await API.disposisiCreate({
          suratMasukId: selectedSurat.value.id,
          ...disposisiForm
        })
        
        if (response.status === 'success') {
          showDisposisiModal.value = false
          fetchData()
        }
      } catch (err) {
        console.error('Disposisi error:', err)
      }
    }
    
    const exportData = () => {
      // Export functionality
      console.log('Export data...')
    }
    
    onMounted(() => {
      fetchData()
    })
    
    return {
      searchQuery,
      filterStatus,
      filterSifat,
      filterTahun,
      selectedIds,
      showDeleteModal,
      deleting,
      selectedSurat,
      showDisposisiModal,
      disposisiForm,
      userList,
      isAdmin,
      items,
      loading,
      pagination,
      stats,
      hasActiveFilters,
      yearOptions,
      columns,
      formatDate,
      sifatLabel,
      statusLabel,
      getSifatBadge,
      getStatusBadge,
      applyFilters,
      handleSearch,
      handleClearSearch,
      clearAllFilters,
      handlePageChange,
      handlePageSizeChange,
      viewDetail,
      editSurat,
      confirmDelete,
      handleDelete,
      openDisposisi,
      handleDisposisi,
      exportData,
      fetchData
    }
  }
}
</script>

<style lang="scss" scoped>
.surat-masuk-page {
  animation: fadeIn 0.4s ease-out;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  
  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 4px;
  }
  
  .page-subtitle {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0;
  }
  
  .page-actions {
    display: flex;
    gap: 8px;
  }
}

.filters-section {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  background: var(--bg-card);
  color: var(--text-primary);
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.stats-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  
  .summary-item {
    background: var(--bg-card);
    padding: 12px 20px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-light);
    text-align: center;
    min-width: 100px;
    
    .summary-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      
      &.text-warning { color: var(--color-warning); }
      &.text-success { color: var(--color-success); }
      &.text-info { color: var(--color-info); }
    }
    
    .summary-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
  }
}

.action-buttons {
  display: flex;
  gap: 4px;
  
  .btn-icon {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: transparent;
    border: 1px solid var(--border-color);
    cursor: pointer;
    font-size: 14px;
    transition: all var(--transition-fast);
    
    &:hover {
      background: var(--bg-hover);
    }
    
    &.btn-danger-icon:hover {
      background: #FFEBEE;
      border-color: var(--color-danger);
      color: var(--color-danger);
    }
  }
}

.max-w-xs {
  max-width: 250px;
}

.font-medium {
  font-weight: 500;
}

.text-xs {
  font-size: 0.75rem;
}

.text-xxs {
  font-size: 0.625rem;
}

.text-muted {
  color: var(--text-tertiary);
}

.text-danger {
  color: var(--color-danger);
}

.text-sm {
  font-size: 0.875rem;
}

.flex {
  display: flex;
}

.gap-1 {
  gap: 4px;
}

.flex-wrap {
  flex-wrap: wrap;
}

.mt-2 {
  margin-top: 8px;
}

.form-group {
  margin-bottom: 16px;
  
  label {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .form-control {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    background: var(--bg-card);
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    
    .page-actions {
      width: 100%;
      
      .btn {
        flex: 1;
        justify-content: center;
      }
    }
  }
  
  .stats-summary {
    .summary-item {
      flex: 1;
    }
  }
}
</style>
