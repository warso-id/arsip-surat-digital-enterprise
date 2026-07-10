<template>
  <DefaultLayout>
    <div class="detail-page" v-if="!loading && surat">
      <div class="detail-header">
        <button class="btn btn-sm btn-secondary" @click="$router.back()">← Kembali</button>
        <div class="detail-actions">
          <button class="btn btn-sm btn-secondary" @click="editSurat">✏️ Edit</button>
          <button v-if="surat.fileUrl" class="btn btn-sm btn-secondary" @click="downloadFile">📥 Download</button>
          <button v-if="isAdmin" class="btn btn-sm btn-danger" @click="confirmDelete">🗑️ Hapus</button>
        </div>
      </div>
      
      <div class="detail-grid">
        <div class="detail-main">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Informasi Surat Keluar</h3>
              <span class="badge" :class="`badge-${getStatusBadge(surat.status)}`">{{ statusLabel(surat.status) }}</span>
            </div>
            <div class="card-body">
              <div class="info-grid">
                <div class="info-item"><label>Nomor Surat</label><span>{{ surat.nomorSurat || '-' }}</span></div>
                <div class="info-item"><label>Tanggal Surat</label><span>{{ formatDate(surat.tanggalSurat) }}</span></div>
                <div class="info-item"><label>Tujuan</label><span>{{ surat.tujuan || '-' }}</span></div>
                <div class="info-item"><label>Perihal</label><span class="font-medium">{{ surat.perihal || '-' }}</span></div>
                <div class="info-item"><label>Sifat</label><span class="badge" :class="`badge-${getSifatBadge(surat.sifat)}`">{{ sifatLabel(surat.sifat) }}</span></div>
                <div class="info-item"><label>Jenis Surat</label><span>{{ surat.jenisSurat || '-' }}</span></div>
                <div class="info-item"><label>Status</label><span class="badge" :class="`badge-${getStatusBadge(surat.status)}`">{{ statusLabel(surat.status) }}</span></div>
                <div class="info-item"><label>Approval</label><span class="badge" :class="`badge-${getApprovalBadge(surat.approvalStatus)}`">{{ surat.approvalStatus === 'approved' ? '✅ Disetujui' : surat.approvalStatus === 'rejected' ? '❌ Ditolak' : '⏳ Pending' }}</span></div>
                <div class="info-item info-full"><label>Catatan</label><span>{{ surat.catatan || '-' }}</span></div>
              </div>
            </div>
          </div>
          
          <div class="card" v-if="surat.fileUrl">
            <div class="card-header"><h3 class="card-title">📎 Lampiran</h3></div>
            <div class="card-body">
              <div class="file-info">
                <span class="file-icon">📄</span>
                <div class="file-details">
                  <div class="file-name">{{ surat.fileName || 'Lampiran' }}</div>
                  <div class="file-size" v-if="surat.fileSize">{{ formatFileSize(surat.fileSize) }}</div>
                </div>
                <a :href="surat.fileUrl" target="_blank" class="btn btn-sm btn-primary">👁️ Lihat</a>
              </div>
            </div>
          </div>
          
          <!-- Approval Timeline -->
          <div class="card" v-if="approvalList.length > 0">
            <div class="card-header"><h3 class="card-title">📋 Riwayat Approval</h3></div>
            <div class="card-body">
              <div class="timeline">
                <div v-for="app in approvalList" :key="app.id" class="timeline-item">
                  <div class="timeline-marker" :class="`marker-${app.status}`"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="font-medium">Level {{ app.level }}</span>
                      <span class="text-xs text-muted">{{ formatDate(app.createdAt) }}</span>
                    </div>
                    <span class="badge" :class="`badge-${app.status === 'approved' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}`">{{ app.status }}</span>
                    <p v-if="app.komentar" class="text-sm mt-1">{{ app.komentar }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="detail-sidebar">
          <div class="card">
            <div class="card-header"><h3 class="card-title">ℹ️ Informasi</h3></div>
            <div class="card-body">
              <div class="info-list">
                <div class="info-item-sm"><label>Dibuat Oleh</label><span>{{ surat.createdBy || '-' }}</span></div>
                <div class="info-item-sm"><label>Dibuat Pada</label><span>{{ formatDateTime(surat.createdAt) }}</span></div>
                <div class="info-item-sm"><label>Diupdate</label><span>{{ formatDateTime(surat.updatedAt) }}</span></div>
                <div class="info-item-sm" v-if="surat.approvedBy"><label>Disetujui Oleh</label><span>{{ surat.approvedBy }}</span></div>
                <div class="info-item-sm" v-if="surat.approvedAt"><label>Disetujui Pada</label><span>{{ formatDateTime(surat.approvedAt) }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="loading" class="loading-container"><LoadingSpinner size="lg" text="Memuat detail..." /></div>
    <div v-else class="error-container"><div class="empty-state"><span>❌</span><h2>Surat Tidak Ditemukan</h2><router-link to="/surat-keluar" class="btn btn-primary">Kembali</router-link></div></div>
    
    <ModalDialog v-model="showDeleteModal" title="Konfirmasi Hapus" confirmText="Hapus" :loading="deleting" @confirm="handleDelete">
      <p>Apakah Anda yakin ingin menghapus surat ini?</p>
    </ModalDialog>
  </DefaultLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import API from '@/api'
import { formatDate, formatDateTime, sifatLabel, statusLabel } from '@/utils/formatters'
import { formatFileSize } from '@/utils/helpers'

export default {
  name: 'SuratKeluarDetail',
  components: { DefaultLayout, LoadingSpinner, ModalDialog },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    
    const loading = ref(true)
    const surat = ref(null)
    const approvalList = ref([])
    const showDeleteModal = ref(false)
    const deleting = ref(false)
    
    const isAdmin = computed(() => authStore.isAdmin)
    
    const getSifatBadge = (s) => ({ biasa: 'secondary', penting: 'warning', rahasia: 'danger', segera: 'info' }[s] || 'secondary')
    const getStatusBadge = (s) => ({ draft: 'secondary', dikirim: 'info', selesai: 'success' }[s] || 'secondary')
    const getApprovalBadge = (s) => ({ pending: 'warning', approved: 'success', rejected: 'danger' }[s] || 'warning')
    
    const fetchDetail = async () => {
      loading.value = true
      try {
        const [detailRes, approvalRes] = await Promise.all([
          API.suratKeluarDetail(route.params.id),
          API.approvalList({ suratKeluarId: route.params.id })
        ])
        if (detailRes.status === 'success') surat.value = detailRes.data
        if (approvalRes.status === 'success') approvalList.value = approvalRes.data.items
      } catch (err) {} finally { loading.value = false }
    }
    
    const editSurat = () => router.push({ name: 'SuratKeluarEdit', params: { id: surat.value.id } })
    const downloadFile = () => { if (surat.value?.fileUrl) window.open(surat.value.fileUrl, '_blank') }
    const confirmDelete = () => { showDeleteModal.value = true }
    const handleDelete = async () => {
      deleting.value = true
      try { await API.suratKeluarDelete(surat.value.id); showDeleteModal.value = false; router.push({ name: 'SuratKeluar' }) } catch (err) {} finally { deleting.value = false }
    }
    
    onMounted(() => fetchDetail())
    
    return {
      loading, surat, approvalList, showDeleteModal, deleting, isAdmin,
      formatDate, formatDateTime, formatFileSize, sifatLabel, statusLabel,
      getSifatBadge, getStatusBadge, getApprovalBadge,
      editSurat, downloadFile, confirmDelete, handleDelete
    }
  }
}
</script>

<style lang="scss" scoped>
.detail-page { animation: fadeIn 0.4s ease-out; }
.detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.detail-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.detail-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
.detail-main { display: flex; flex-direction: column; gap: 20px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  .info-item {
    label { display: block; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    span { font-size: 0.9375rem; color: var(--text-primary); }
    &.info-full { grid-column: 1 / -1; }
  }
}
.file-info { display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);
  .file-icon { font-size: 32px; }
  .file-details { flex: 1; .file-name { font-weight: 500; } .file-size { font-size: 0.75rem; color: var(--text-secondary); } }
}
.timeline { position: relative; padding-left: 24px;
  &::before { content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: var(--border-color); }
}
.timeline-item { position: relative; margin-bottom: 20px; &:last-child { margin-bottom: 0; } }
.timeline-marker { position: absolute; left: -20px; top: 4px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border-color); background: var(--bg-card);
  &.marker-approved { background: var(--color-success); border-color: var(--color-success); }
  &.marker-rejected { background: var(--color-danger); border-color: var(--color-danger); }
}
.timeline-content { .timeline-header { display: flex; gap: 8px; align-items: center; } }
.info-list .info-item-sm { margin-bottom: 12px;
  label { display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; }
  span { font-size: 0.8125rem; color: var(--text-primary); }
}
.loading-container, .error-container { display: flex; align-items: center; justify-content: center; min-height: 400px; }
.font-medium { font-weight: 500; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-muted { color: var(--text-tertiary); }
.mt-1 { margin-top: 4px; }
@media (max-width: 1024px) { .detail-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } }
</style>
