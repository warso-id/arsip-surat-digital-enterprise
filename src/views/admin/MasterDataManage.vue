<template>
  <div class="masterdata-manage">
    <div class="section-header">
      <h2>🗄️ Master Data</h2>
      <button class="btn btn-primary" @click="openCreateModal">➕ Tambah Data</button>
    </div>
    
    <!-- Filter Kategori -->
    <div class="filter-row mb-4">
      <select v-model="filterKategori" class="filter-select" @change="fetchData">
        <option value="">Semua Kategori</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>
    
    <div class="card">
      <div class="card-body" style="padding: 0;">
        <table class="data-table" v-if="!loading && items.length > 0">
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Kode</th>
              <th>Nama</th>
              <th>Nilai</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td><span class="badge badge-info">{{ item.kategori }}</span></td>
              <td class="font-mono">{{ item.kode }}</td>
              <td>{{ item.nama }}</td>
              <td>
                <span v-if="item.kategori === 'sifat_surat'" class="badge" :class="`badge-${getSifatBadge(item.kode)}`">{{ item.nilai }}</span>
                <span v-else>{{ item.nilai }}</span>
              </td>
              <td>
                <span class="badge" :class="item.isActive ? 'badge-success' : 'badge-danger'">
                  {{ item.isActive ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-sm btn-icon" title="Edit" @click="openEditModal(item)">✏️</button>
                  <button class="btn btn-sm btn-icon btn-danger-icon" title="Hapus" @click="confirmDelete(item)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="loading" class="p-4 text-center"><LoadingSpinner /></div>
        <div v-else class="empty-state p-4"><span>🗄️</span><p>Belum ada data</p></div>
      </div>
    </div>
    
    <ModalDialog v-model="showFormModal" :title="isEditing ? 'Edit Master Data' : 'Tambah Master Data'" confirmText="Simpan" @confirm="handleSave">
      <div class="form-group">
        <label>Kategori</label>
        <select v-model="form.kategori" class="form-control">
          <option value="sifat_surat">Sifat Surat</option>
          <option value="status_surat">Status Surat</option>
          <option value="klasifikasi">Klasifikasi</option>
          <option value="jenis_surat">Jenis Surat</option>
        </select>
      </div>
      <div class="form-group"><label>Kode</label><input v-model="form.kode" type="text" class="form-control" /></div>
      <div class="form-group"><label>Nama</label><input v-model="form.nama" type="text" class="form-control" /></div>
      <div class="form-group"><label>Nilai</label><input v-model="form.nilai" type="text" class="form-control" /></div>
      <div class="form-group">
        <label>Status</label>
        <select v-model="form.isActive" class="form-control">
          <option :value="true">Aktif</option>
          <option :value="false">Nonaktif</option>
        </select>
      </div>
    </ModalDialog>
    
    <ModalDialog v-model="showDeleteModal" title="Hapus Data" confirmText="Hapus" @confirm="handleDelete">
      <p>Hapus data ini?</p>
    </ModalDialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useAdminStore } from '@/stores/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'

export default {
  name: 'MasterDataManage',
  components: { LoadingSpinner, ModalDialog },
  setup() {
    const adminStore = useAdminStore()
    
    const loading = ref(false)
    const items = ref([])
    const filterKategori = ref('')
    const showFormModal = ref(false)
    const isEditing = ref(false)
    const selectedItem = ref(null)
    const showDeleteModal = ref(false)
    
    const form = reactive({ kategori: '', kode: '', nama: '', nilai: '', isActive: true })
    
    const categories = computed(() => [...new Set(items.value.map(i => i.kategori))])
    
    const getSifatBadge = (s) => ({ biasa: 'secondary', penting: 'warning', rahasia: 'danger', segera: 'info' }[s] || 'secondary')
    
    const fetchData = async () => {
      loading.value = true
      await adminStore.fetchMasterData({ kategori: filterKategori.value })
      items.value = adminStore.masterData
      loading.value = false
    }
    
    const openCreateModal = () => {
      isEditing.value = false
      Object.keys(form).forEach(k => form[k] = '')
      form.isActive = true
      showFormModal.value = true
    }
    
    const openEditModal = (item) => {
      isEditing.value = true
      selectedItem.value = item
      form.kategori = item.kategori
      form.kode = item.kode
      form.nama = item.nama
      form.nilai = item.nilai
      form.isActive = item.isActive
      showFormModal.value = true
    }
    
    const handleSave = async () => {
      if (isEditing.value && selectedItem.value) {
        await adminStore.updateMasterData(selectedItem.value.id, form)
      } else {
        await adminStore.createMasterData(form)
      }
      showFormModal.value = false
      fetchData()
    }
    
    const confirmDelete = (item) => {
      selectedItem.value = item
      showDeleteModal.value = true
    }
    
    const handleDelete = async () => {
      if (selectedItem.value) {
        await adminStore.deleteMasterData(selectedItem.value.id)
        showDeleteModal.value = false
        fetchData()
      }
    }
    
    onMounted(() => fetchData())
    
    return {
      loading, items, filterKategori, showFormModal, isEditing, selectedItem, showDeleteModal, form, categories,
      getSifatBadge, fetchData, openCreateModal, openEditModal, handleSave, confirmDelete, handleDelete
    }
  }
}
</script>

<style lang="scss" scoped>
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; h2 { font-size: 1.25rem; font-weight: 700; margin: 0; } }
.filter-row { display: flex; gap: 8px; }
.filter-select { padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.8125rem; background: var(--bg-card); }
.data-table { width: 100%; border-collapse: collapse;
  th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border-light); }
  th { background: var(--bg-tertiary); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
  tbody tr:hover { background: var(--bg-hover); }
}
.action-buttons { display: flex; gap: 4px; }
.btn-icon { width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: transparent; border: 1px solid var(--border-color); cursor: pointer; }
.form-group { margin-bottom: 16px;
  label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.875rem; }
  .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; }
}
.font-mono { font-family: var(--font-mono); font-size: 0.8125rem; }
.mb-4 { margin-bottom: 16px; }
.p-4 { padding: 16px; }
</style>
