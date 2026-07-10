<template>
  <DefaultLayout>
    <div class="surat-form-page">
      <div class="form-header">
        <button class="btn btn-sm btn-secondary" @click="$router.back()">← Kembali</button>
        <h1 class="form-title">{{ isEdit ? '✏️ Edit Surat Keluar' : '📤 Buat Surat Keluar' }}</h1>
        <div></div>
      </div>
      
      <form @submit.prevent="handleSubmit" class="form-card">
        <div v-if="loadingInitial" class="form-loading">
          <LoadingSpinner text="Memuat data..." />
        </div>
        
        <div v-else class="form-grid">
          <div class="form-column">
            <div class="card">
              <div class="card-header"><h3 class="card-title">📝 Data Surat</h3></div>
              <div class="card-body">
                <div class="form-group">
                  <label>Nomor Surat <span class="text-danger">*</span></label>
                  <input v-model="form.nomorSurat" type="text" class="form-control" placeholder="Nomor surat" required />
                </div>
                
                <div class="form-group">
                  <label>Perihal <span class="text-danger">*</span></label>
                  <input v-model="form.perihal" type="text" class="form-control" placeholder="Perihal surat" required />
                </div>
                
                <div class="form-group">
                  <label>Tujuan <span class="text-danger">*</span></label>
                  <input v-model="form.tujuan" type="text" class="form-control" placeholder="Tujuan surat" required />
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Tanggal Surat <span class="text-danger">*</span></label>
                    <input v-model="form.tanggalSurat" type="date" class="form-control" required />
                  </div>
                  <div class="form-group">
                    <label>Jenis Surat</label>
                    <select v-model="form.jenisSurat" class="form-control">
                      <option value="">Pilih Jenis</option>
                      <option v-for="j in jenisSuratOptions" :key="j.value" :value="j.value">{{ j.label }}</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Sifat</label>
                    <select v-model="form.sifat" class="form-control">
                      <option value="biasa">Biasa</option>
                      <option value="penting">Penting</option>
                      <option value="rahasia">Rahasia</option>
                      <option value="segera">Segera</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Status</label>
                    <select v-model="form.status" class="form-control">
                      <option value="draft">Draft</option>
                      <option value="dikirim">Dikirim</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Catatan</label>
                  <textarea v-model="form.catatan" class="form-control" rows="3" placeholder="Catatan..."></textarea>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-column">
            <div class="card">
              <div class="card-header"><h3 class="card-title">📎 Lampiran</h3></div>
              <div class="card-body">
                <FileUploader
                  v-model="selectedFile"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  :maxSize="10 * 1024 * 1024"
                  @upload="handleFileUpload"
                />
                <p class="form-hint mt-2">Format: PDF, JPG, PNG, DOC, XLS (Max 10MB)</p>
              </div>
            </div>
            
            <div class="card" v-if="isEdit && existingFile">
              <div class="card-header"><h3 class="card-title">📄 File Saat Ini</h3></div>
              <div class="card-body">
                <div class="file-info">
                  <span class="file-icon">📄</span>
                  <div>
                    <div class="font-medium">{{ existingFile.fileName }}</div>
                    <div class="text-xs text-muted">{{ formatFileSize(existingFile.fileSize) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$router.back()" :disabled="submitting">Batal</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting" class="spinner-small"></span>
            <span v-else>{{ isEdit ? '💾 Simpan Perubahan' : '➕ Simpan Surat Keluar' }}</span>
          </button>
        </div>
      </form>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import FileUploader from '@/components/common/FileUploader.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import API from '@/api'
import { formatFileSize } from '@/utils/helpers'
import { JENIS_SURAT } from '@/utils/constants'

export default {
  name: 'SuratKeluarForm',
  components: { DefaultLayout, FileUploader, LoadingSpinner },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const toast = inject('toast')
    
    const isEdit = computed(() => !!route.params.id)
    const id = computed(() => route.params.id)
    const jenisSuratOptions = JENIS_SURAT
    
    const loadingInitial = ref(false)
    const submitting = ref(false)
    const selectedFile = ref(null)
    const existingFile = ref(null)
    
    const form = reactive({
      nomorSurat: '', perihal: '', tujuan: '',
      tanggalSurat: new Date().toISOString().split('T')[0],
      sifat: 'biasa', jenisSurat: '', status: 'draft', catatan: ''
    })
    
    const fetchExisting = async () => {
      if (!isEdit.value) return
      loadingInitial.value = true
      try {
        const res = await API.suratKeluarDetail(id.value)
        if (res.status === 'success') {
          const d = res.data
          form.nomorSurat = d.nomorSurat || ''
          form.perihal = d.perihal || ''
          form.tujuan = d.tujuan || ''
          form.tanggalSurat = d.tanggalSurat ? new Date(d.tanggalSurat).toISOString().split('T')[0] : ''
          form.sifat = d.sifat || 'biasa'
          form.jenisSurat = d.jenisSurat || ''
          form.status = d.status || 'draft'
          form.catatan = d.catatan || ''
          if (d.fileUrl) existingFile.value = { fileUrl: d.fileUrl, fileName: d.fileName, fileSize: d.fileSize }
        }
      } catch (err) { toast?.error('Gagal memuat data') } finally { loadingInitial.value = false }
    }
    
    const handleFileUpload = async (formData, callbacks) => {
      try {
        const res = await API.fileUpload(formData)
        if (res.status === 'success') { callbacks?.onSuccess?.(); return res.data }
        callbacks?.onError?.('Upload gagal')
      } catch (err) { callbacks?.onError?.('Upload gagal') }
    }
    
    const handleSubmit = async () => {
      submitting.value = true
      try {
        const data = { ...form, fileUrl: existingFile.value?.fileUrl || '', fileName: existingFile.value?.fileName || '', fileSize: existingFile.value?.fileSize || 0 }
        const res = isEdit.value ? await API.suratKeluarUpdate(id.value, data) : await API.suratKeluarCreate(data)
        if (res.status === 'success') {
          toast?.success(isEdit.value ? 'Surat berhasil diupdate' : 'Surat keluar berhasil dibuat')
          router.push({ name: 'SuratKeluar' })
        } else { toast?.error(res.message || 'Gagal menyimpan') }
      } catch (err) { toast?.error('Gagal menyimpan') } finally { submitting.value = false }
    }
    
    onMounted(() => fetchExisting())
    
    return {
      isEdit, form, selectedFile, existingFile, loadingInitial, submitting, jenisSuratOptions,
      formatFileSize, handleFileUpload, handleSubmit
    }
  }
}
</script>

<style lang="scss" scoped>
.surat-form-page { max-width: 1000px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
.form-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.form-title { font-size: 1.5rem; font-weight: 700; margin: 0; }
.form-card { background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); overflow: hidden; }
.form-grid { display: grid; grid-template-columns: 1fr 380px; gap: 0; }
.form-column { padding: 24px; &:first-child { border-right: 1px solid var(--border-color); } }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { margin-bottom: 20px;
  label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.875rem; }
  .form-control { width: 100%; padding: 10px 14px; border: 2px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.9375rem; background: var(--bg-card); color: var(--text-primary);
    &:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(25,118,210,0.1); }
  }
}
.form-hint { font-size: 0.75rem; color: var(--text-tertiary); }
.form-actions { padding: 20px 24px; border-top: 1px solid var(--border-color); background: var(--bg-tertiary); display: flex; justify-content: flex-end; gap: 12px; }
.form-loading { display: flex; align-items: center; justify-content: center; min-height: 300px; }
.file-info { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);
  .file-icon { font-size: 28px; }
}
.text-danger { color: var(--color-danger); }
.text-muted { color: var(--text-secondary); }
.text-xs { font-size: 0.75rem; }
.font-medium { font-weight: 500; }
.mt-2 { margin-top: 8px; }
.spinner-small { display: inline-block; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-column:first-child { border-right: none; border-bottom: 1px solid var(--border-color); }
  .form-row { grid-template-columns: 1fr; }
}
</style>
