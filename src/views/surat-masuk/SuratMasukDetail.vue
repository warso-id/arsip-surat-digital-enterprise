<template>
  <DefaultLayout>
    <div class="surat-detail-page" v-if="!loading && surat">
      <!-- Header -->
      <div class="detail-header">
        <div>
          <button class="btn btn-sm btn-secondary" @click="$router.back()">
            ← Kembali
          </button>
        </div>
        <div class="detail-actions">
          <button class="btn btn-sm btn-secondary" @click="editSurat">
            ✏️ Edit
          </button>
          <button class="btn btn-sm btn-secondary" @click="downloadFile" v-if="surat.fileUrl">
            📥 Download
          </button>
          <button class="btn btn-sm btn-primary" @click="showDisposisiModal = true">
            📋 Disposisi
          </button>
          <button
            v-if="isAdmin"
            class="btn btn-sm btn-danger"
            @click="confirmDelete"
          >
            🗑️ Hapus
          </button>
        </div>
      </div>
      
      <div class="detail-grid">
        <!-- Main Content -->
        <div class="detail-main">
          <!-- Info Card -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Informasi Surat</h3>
              <span class="badge" :class="`badge-${getStatusBadge(surat.status)}`">
                {{ statusLabel(surat.status) }}
              </span>
            </div>
            <div class="card-body">
              <div class="info-grid">
                <div class="info-item">
                  <label>Nomor Surat</label>
                  <span>{{ surat.nomorSurat || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>Nomor Agenda</label>
                  <span class="font-mono font-bold">{{ surat.nomorAgenda || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>Tanggal Surat</label>
                  <span>{{ formatDate(surat.tanggalSurat) }}</span>
                </div>
                <div class="info-item">
                  <label>Tanggal Terima</label>
                  <span>{{ formatDate(surat.tanggalTerima) }}</span>
                </div>
                <div class="info-item">
                  <label>Pengirim</label>
                  <span>{{ surat.pengirim || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>Perihal</label>
                  <span class="font-medium">{{ surat.perihal || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>Sifat</label>
                  <span class="badge" :class="`badge-${getSifatBadge(surat.sifat)}`">
                    {{ sifatLabel(surat.sifat) }}
                  </span>
                </div>
                <div class="info-item">
                  <label>Klasifikasi</label>
                  <span>{{ surat.klasifikasi || '-' }}</span>
                </div>
                <div class="info-item info-full">
                  <label>Catatan</label>
                  <span>{{ surat.catatan || 'Tidak ada catatan' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- File Preview -->
          <div class="card" v-if="surat.fileUrl">
            <div class="card-header">
              <h3 class="card-title">📎 File Lampiran</h3>
            </div>
            <div class="card-body">
              <div class="file-info">
                <div class="file-icon">📄</div>
                <div class="file-details">
                  <div class="file-name">{{ surat.fileName || 'Lampiran' }}</div>
                  <div class="file-size" v-if="surat.fileSize">
                    {{ formatFileSize(surat.fileSize) }}
                  </div>
                </div>
                <a :href="surat.fileUrl" target="_blank" class="btn btn-sm btn-primary">
                  👁️ Lihat File
                </a>
              </div>
              
              <!-- PDF Preview -->
              <div v-if="isPDF" class="file-preview">
                <iframe :src="surat.fileUrl" width="100%" height="500px"></iframe>
              </div>
              
              <!-- Image Preview -->
              <div v-else-if="isImage" class="file-preview">
                <img :src="surat.fileUrl" :alt="surat.fileName" class="preview-image" />
              </div>
            </div>
          </div>
          
          <!-- AI Tags -->
          <div class="card" v-if="surat.aiTags && surat.aiTags.length > 0">
            <div class="card-header">
              <h3 class="card-title">🤖 AI Auto Tags</h3>
              <span class="text-xs text-muted">Confidence: {{ (surat.aiConfidence * 100).toFixed(0) }}%</span>
            </div>
            <div class="card-body">
              <div class="ai-tags">
                <span v-for="tag in surat.aiTags" :key="tag" class="badge badge-info">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Disposisi History -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">📋 Riwayat Disposisi</h3>
            </div>
            <div class="card-body">
              <div v-if="disposisiList.length > 0" class="timeline">
                <div v-for="(disp, index) in disposisiList" :key="disp.id" class="timeline-item">
                  <div class="timeline-marker" :class="`marker-${disp.status}`"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="font-medium">{{ disp.dariUser || 'Sistem' }}</span>
                      <span class="text-xs text-muted">→ {{ disp.kepadaUser || '-' }}</span>
                      <span class="text-xs text-muted">{{ formatDate(disp.createdAt) }}</span>
                    </div>
                    <p class="timeline-text">{{ disp.instruksi || '-' }}</p>
                    <div class="timeline-meta">
                      <span class="badge badge-sm" :class="`badge-${disp.status === 'selesai' ? 'success' : 'warning'}`">
                        {{ disp.status }}
                      </span>
                      <span v-if="disp.batasWaktu" class="text-xs text-muted">
                        Deadline: {{ formatDate(disp.batasWaktu) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <span>📋</span>
                <p>Belum ada disposisi</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sidebar -->
        <div class="detail-sidebar">
          <!-- QR Code -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">🔳 QR Code</h3>
            </div>
            <div class="card-body text-center">
              <img
                v-if="surat.qrCode"
                :src="surat.qrCode"
                alt="QR Code"
                class="qr-code"
              />
              <button class="btn btn-sm btn-secondary mt-2" @click="downloadQR">
                📥 Download QR
              </button>
            </div>
          </div>
          
          <!-- Informasi Tambahan -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">ℹ️ Informasi</h3>
            </div>
            <div class="card-body">
              <div class="info-list">
                <div class="info-item-sm">
                  <label>Dibuat Oleh</label>
                  <span>{{ surat.creatorName || '-' }}</span>
                </div>
                <div class="info-item-sm">
                  <label>Dibuat Pada</label>
                  <span>{{ formatDateTime(surat.createdAt) }}</span>
                </div>
                <div class="info-item-sm">
                  <label>Diupdate Pada</label>
                  <span>{{ formatDateTime(surat.updatedAt) }}</span>
                </div>
                <div class="info-item-sm" v-if="surat.blockchainHash">
                  <label>Blockchain Hash</label>
                  <span class="font-mono text-xxs">{{ surat.blockchainHash.substring(0, 20) }}...</span>
                </div>
                <div class="info-item-sm" v-if="surat.anomalyScore > 0">
                  <label>Anomaly Score</label>
                  <span class="text-warning">{{ surat.anomalyScore }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">⚡ Quick Actions</h3>
            </div>
            <div class="card-body">
              <div class="action-list">
                <button class="btn btn-sm btn-block btn-secondary" @click="printSurat">
                  🖨️ Cetak
                </button>
                <button class="btn btn-sm btn-block btn-secondary" @click="shareSurat">
                  📤 Bagikan
                </button>
                <button class="btn btn-sm btn-block btn-secondary" @click="copyLink">
                  🔗 Salin Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-else-if="loading" class="loading-container">
      <LoadingSpinner size="lg" text="Memuat detail surat..." />
    </div>
    
    <!-- Error State -->
    <div v-else class="error-container">
      <div class="empty-state">
        <span>❌</span>
        <h2>Surat Tidak Ditemukan</h2>
        <p>Surat yang Anda cari tidak ditemukan atau telah dihapus.</p>
        <router-link to="/surat-masuk" class="btn btn-primary">
          Kembali ke Daftar Surat
        </router-link>
      </div>
    </div>
    
    <!-- Delete Modal -->
    <ModalDialog
      v-model="showDeleteConfirm"
      title="Konfirmasi Hapus"
      confirmText="Hapus"
      :loading="deleting"
      @confirm="handleDelete"
    >
      <p>Apakah Anda yakin ingin menghapus surat ini?</p>
      <p class="text-danger text-sm mt-2">Tindakan ini tidak dapat dibatalkan.</p>
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
        <label>Tujuan</label>
        <select v-model="disposisiForm.kepadaUserId" class="form-control">
          <option value="">Pilih Penerima</option>
          <option v-for="u in userList" :key="u.id" :value="u.id">
            {{ u.namaLengkap }} ({{ u.jabatan }})
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Instruksi</label>
        <textarea v-model="disposisiForm.instruksi" class="form-control" rows="3"></textarea>
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
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import API from '@/api'
import { formatDate, formatDateTime, sifatLabel, statusLabel } from '@/utils/formatters'
import { formatFileSize, isImageFile, isPDFFile } from '@/utils/helpers'

export default {
  name: 'SuratMasukDetail',
  components: {
    DefaultLayout,
    LoadingSpinner,
    ModalDialog
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    
    const loading = ref(true)
    const surat = ref(null)
    const disposisiList = ref([])
    const userList = ref([])
    
    const showDeleteConfirm = ref(false)
    const deleting = ref(false)
    const showDisposisiModal = ref(false)
    const disposisiForm = reactive({
      kepadaUserId: '',
      instruksi: '',
      sifat: 'biasa',
      batasWaktu: ''
    })
    
    const isAdmin = computed(() => authStore.isAdmin)
    const isPDF = computed(() => surat.value?.fileName && isPDFFile(surat.value.fileName))
    const isImage = computed(() => surat.value?.fileName && isImageFile(surat.value.fileName))
    
    const getSifatBadge = (s) => {
      const map = { biasa: 'secondary', penting: 'warning', rahasia: 'danger', segera: 'info' }
      return map[s] || 'secondary'
    }
    
    const getStatusBadge = (s) => {
      const map = { diterima: 'info', diproses: 'warning', selesai: 'success', diarsipkan: 'secondary' }
      return map[s] || 'info'
    }
    
    const fetchDetail = async () => {
      loading.value = true
      const id = route.params.id
      
      try {
        const response = await API.suratMasukDetail(id)
        if (response.status === 'success') {
          surat.value = response.data
          
          // Fetch disposisi
          const dispRes = await API.disposisiList({ suratMasukId: id })
          if (dispRes.status === 'success') {
            disposisiList.value = dispRes.data.items
          }
        }
      } catch (err) {
        console.error('Error fetching detail:', err)
      } finally {
        loading.value = false
      }
    }
    
    const fetchUsers = async () => {
      try {
        const response = await API.usersList({ isActive: 'true' })
        if (response.status === 'success') {
          userList.value = response.data.items.filter(u => u.id !== authStore.user?.id)
        }
      } catch (err) {}
    }
    
    const editSurat = () => {
      router.push({ name: 'SuratMasukEdit', params: { id: surat.value.id } })
    }
    
    const downloadFile = () => {
      if (surat.value?.fileUrl) {
        window.open(surat.value.fileUrl, '_blank')
      }
    }
    
    const confirmDelete = () => {
      showDeleteConfirm.value = true
    }
    
    const handleDelete = async () => {
      deleting.value = true
      try {
        await API.suratMasukDelete(surat.value.id)
        showDeleteConfirm.value = false
        router.push({ name: 'SuratMasuk' })
      } catch (err) {
        console.error('Delete error:', err)
      } finally {
        deleting.value = false
      }
    }
    
    const handleDisposisi = async () => {
      if (!disposisiForm.kepadaUserId) return
      
      try {
        const response = await API.disposisiCreate({
          suratMasukId: surat.value.id,
          ...disposisiForm
        })
        
        if (response.status === 'success') {
          showDisposisiModal.value = false
          fetchDetail()
        }
      } catch (err) {
        console.error('Disposisi error:', err)
      }
    }
    
    const downloadQR = () => {
      if (surat.value?.qrCode) {
        window.open(surat.value.qrCode, '_blank')
      }
    }
    
    const printSurat = () => {
      window.print()
    }
    
    const shareSurat = () => {
      if (navigator.share) {
        navigator.share({
          title: surat.value.perihal,
          text: `Surat Masuk: ${surat.value.nomorSurat}`,
          url: window.location.href
        })
      }
    }
    
    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
      } catch (err) {}
    }
    
    onMounted(() => {
      fetchDetail()
      fetchUsers()
    })
    
    return {
      loading,
      surat,
      disposisiList,
      userList,
      showDeleteConfirm,
      deleting,
      showDisposisiModal,
      disposisiForm,
      isAdmin,
      isPDF,
      isImage,
      formatDate,
      formatDateTime,
      formatFileSize,
      sifatLabel,
      statusLabel,
      getSifatBadge,
      getStatusBadge,
      editSurat,
      downloadFile,
      confirmDelete,
      handleDelete,
      handleDisposisi,
      downloadQR,
      printSurat,
      shareSurat,
      copyLink
    }
  }
}
</script>

<style lang="scss" scoped>
.surat-detail-page {
  animation: fadeIn 0.4s ease-out;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
  
  .detail-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  .info-item {
    label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    span {
      font-size: 0.9375rem;
      color: var(--text-primary);
    }
    
    &.info-full {
      grid-column: 1 / -1;
    }
  }
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  
  .file-icon {
    font-size: 32px;
  }
  
  .file-details {
    flex: 1;
    
    .file-name {
      font-weight: 500;
    }
    
    .file-size {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
  }
}

.file-preview {
  margin-top: 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  
  .preview-image {
    width: 100%;
    max-height: 500px;
    object-fit: contain;
  }
}

.ai-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline {
  position: relative;
  padding-left: 24px;
  
  &::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--border-color);
  }
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.timeline-marker {
  position: absolute;
  left: -20px;
  top: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--bg-card);
  
  &.marker-selesai {
    background: var(--color-success);
    border-color: var(--color-success);
  }
  
  &.marker-diproses {
    background: var(--color-warning);
    border-color: var(--color-warning);
  }
  
  &.marker-pending {
    background: var(--bg-card);
    border-color: var(--color-info);
  }
}

.timeline-content {
  .timeline-header {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .timeline-text {
    margin: 4px 0;
    font-size: 0.875rem;
    color: var(--text-primary);
  }
  
  .timeline-meta {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.qr-code {
  width: 180px;
  height: 180px;
}

.info-list {
  .info-item-sm {
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    label {
      display: block;
      font-size: 0.7rem;
      color: var(--text-secondary);
      text-transform: uppercase;
    }
    
    span {
      font-size: 0.8125rem;
      color: var(--text-primary);
    }
  }
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.font-mono {
  font-family: var(--font-mono);
}

.font-bold {
  font-weight: 700;
}

.text-xxs {
  font-size: 0.625rem;
}

.text-center {
  text-align: center;
}

.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
