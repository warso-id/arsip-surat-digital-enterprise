<template>
  <DefaultLayout>
    <div class="surat-form-page">
      <!-- Header -->
      <div class="form-header">
        <div>
          <button class="btn btn-sm btn-secondary" @click="$router.back()">
            ← Kembali
          </button>
        </div>
        <h1 class="form-title">
          {{ isEdit ? '✏️ Edit Surat Masuk' : '📥 Tambah Surat Masuk' }}
        </h1>
        <div></div>
      </div>
      
      <form @submit.prevent="handleSubmit" class="form-card">
        <!-- Loading -->
        <div v-if="loadingInitial" class="form-loading">
          <LoadingSpinner text="Memuat data..." />
        </div>
        
        <div v-else class="form-grid">
          <!-- Kolom Kiri -->
          <div class="form-column">
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">📝 Data Surat</h3>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label>Nomor Surat <span class="text-danger">*</span></label>
                  <input
                    v-model="form.nomorSurat"
                    type="text"
                    class="form-control"
                    placeholder="Masukkan nomor surat"
                    required
                  />
                </div>
                
                <div class="form-group">
                  <label>Perihal <span class="text-danger">*</span></label>
                  <input
                    v-model="form.perihal"
                    type="text"
                    class="form-control"
                    placeholder="Masukkan perihal surat"
                    required
                  />
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Tanggal Surat <span class="text-danger">*</span></label>
                    <input
                      v-model="form.tanggalSurat"
                      type="date"
                      class="form-control"
                      required
                    />
                  </div>
                  
                  <div class="form-group">
                    <label>Tanggal Terima</label>
                    <input
                      v-model="form.tanggalTerima"
                      type="date"
                      class="form-control"
                    />
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Pengirim <span class="text-danger">*</span></label>
                  <input
                    v-model="form.pengirim"
                    type="text"
                    class="form-control"
                    placeholder="Nama pengirim/instansi"
                    required
                  />
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>Sifat Surat</label>
                    <select v-model="form.sifat" class="form-control">
                      <option value="biasa">Biasa</option>
                      <option value="penting">Penting</option>
                      <option value="rahasia">Rahasia</option>
                      <option value="segera">Segera</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label>Klasifikasi</label>
                    <select v-model="form.klasifikasi" class="form-control">
                      <option value="">Pilih Klasifikasi</option>
                      <option value="umum">Umum</option>
                      <option value="keuangan">Keuangan</option>
                      <option value="kepegawaian">Kepegawaian</option>
                      <option value="hukum">Hukum</option>
                      <option value="pendidikan">Pendidikan</option>
                      <option value="teknis">Teknis</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label>Status</label>
                  <select v-model="form.status" class="form-control">
                    <option value="diterima">Diterima</option>
                    <option value="diproses">Diproses</option>
                    <option value="selesai">Selesai</option>
                    <option value="diarsipkan">Diarsipkan</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label>Catatan</label>
                  <textarea
                    v-model="form.catatan"
                    class="form-control"
                    rows="3"
                    placeholder="Tambahkan catatan..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Kolom Kanan -->
          <div class="form-column">
            <!-- Upload File -->
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">📎 Lampiran File</h3>
              </div>
              <div class="card-body">
                <FileUploader
                  v-model="selectedFile"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                  :maxSize="10 * 1024 * 1024"
                  @upload="handleFileUpload"
                />
                <p class="form-hint mt-2">
                  Format: PDF, JPG, PNG, DOC, XLS (Max 10MB)
                </p>
              </div>
            </div>
            
            <!-- AI Auto Tag -->
            <div class="card" v-if="showAI">
              <div class="card-header">
                <h3 class="card-title">🤖 AI Suggestions</h3>
                <span class="badge badge-info">AI</span>
              </div>
              <div class="card-body">
                <div v-if="aiLoading" class="text-center">
                  <LoadingSpinner size="sm" text="Menganalisis..." />
                </div>
                <div v-else-if="aiTags.length > 0">
                  <div class="ai-tags">
                    <span v-for="tag in aiTags" :key="tag" class="badge badge-info">
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <p v-else class="text-sm text-muted">
                  AI akan otomatis menyarankan tag setelah form diisi.
                </p>
              </div>
            </div>
            
            <!-- Preview -->
            <div class="card" v-if="isEdit && existingFile">
              <div class="card-header">
                <h3 class="card-title">📄 File Saat Ini</h3>
              </div>
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
        
        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$router.back()" :disabled="submitting">
            Batal
          </button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting" class="spinner-small"></span>
            <span v-else>{{ isEdit ? '💾 Simpan Perubahan' : '➕ Simpan Surat Masuk' }}</span>
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

export default {
  name: 'SuratMasukForm',
  components: {
    DefaultLayout,
    FileUploader,
    LoadingSpinner
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const toast = inject('toast')
    
    const isEdit = computed(() => !!route.params.id)
    const id = computed(() => route.params.id)
    
    const loadingInitial = ref(false)
    const submitting = ref(false)
    const selectedFile = ref(null)
    const existingFile = ref(null)
    const showAI = ref(true)
    const aiLoading = ref(false)
    const aiTags = ref([])
    
    const form = reactive({
      nomorSurat: '',
      perihal: '',
      tanggalSurat: new Date().toISOString().split('T')[0],
      tanggalTerima: new Date().toISOString().split('T')[0],
      pengirim: '',
      sifat: 'biasa',
      klasifikasi: '',
      status: 'diterima',
      catatan: ''
    })
    
    const fetchExistingData = async () => {
      if (!isEdit.value) return
      
      loadingInitial.value = true
      try {
        const response = await API.suratMasukDetail(id.value)
        if (response.status === 'success') {
          const data = response.data
          form.nomorSurat = data.nomorSurat || ''
          form.perihal = data.perihal || ''
          form.tanggalSurat = data.tanggalSurat ? new Date(data.tanggalSurat).toISOString().split('T')[0] : ''
          form.tanggalTerima = data.tanggalTerima ? new Date(data.tanggalTerima).toISOString().split('T')[0] : ''
          form.pengirim = data.pengirim || ''
          form.sifat = data.sifat || 'biasa'
          form.klasifikasi = data.klasifikasi || ''
          form.status = data.status || 'diterima'
          form.catatan = data.catatan || ''
          
          if (data.fileUrl) {
            existingFile.value = {
              fileUrl: data.fileUrl,
              fileName: data.fileName,
              fileSize: data.fileSize
            }
          }
        }
      } catch (err) {
        toast?.error('Gagal memuat data surat')
      } finally {
        loadingInitial.value = false
      }
    }
    
    const handleFileUpload = async (formData, callbacks) => {
      try {
        const response = await API.fileUpload(formData)
        if (response.status === 'success') {
          callbacks?.onSuccess?.()
          return response.data
        }
        callbacks?.onError?.('Upload gagal')
      } catch (err) {
        callbacks?.onError?.('Upload gagal')
      }
    }
    
    const handleSubmit = async () => {
      submitting.value = true
      
      try {
        const data = {
          ...form,
          fileUrl: existingFile.value?.fileUrl || '',
          fileName: existingFile.value?.fileName || '',
          fileSize: existingFile.value?.fileSize || 0,
          aiTags: aiTags.value.join(',')
        }
        
        let response
        if (isEdit.value) {
          response = await API.suratMasukUpdate(id.value, data)
        } else {
          response = await API.suratMasukCreate(data)
        }
        
        if (response.status === 'success') {
          toast?.success(
            isEdit.value ? 'Surat berhasil diupdate' : 'Surat masuk berhasil dicatat',
            'Sukses'
          )
          router.push({ name: 'SuratMasuk' })
        } else {
          toast?.error(response.message || 'Gagal menyimpan surat')
        }
      } catch (err) {
        toast?.error('Gagal menyimpan surat')
      } finally {
        submitting.value = false
      }
    }
    
    onMounted(() => {
      fetchExistingData()
    })
    
    return {
      isEdit,
      form,
      selectedFile,
      existingFile,
      loadingInitial,
      submitting,
      showAI,
      aiLoading,
      aiTags,
      formatFileSize,
      handleFileUpload,
      handleSubmit
    }
  }
}
</script>

<style lang="scss" scoped>
.surat-form-page {
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeIn 0.4s ease-out;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  
  .form-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }
}

.form-card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 0;
}

.form-column {
  padding: 24px;
  
  &:first-child {
    border-right: 1px solid var(--border-color);
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 20px;
  
  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--text-primary);
  }
  
  .form-control {
    width: 100%;
    padding: 10px 14px;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.9375rem;
    background: var(--bg-card);
    color: var(--text-primary);
    transition: border-color var(--transition-fast);
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
    }
    
    &::placeholder {
      color: var(--text-tertiary);
    }
  }
  
  textarea.form-control {
    resize: vertical;
    min-height: 80px;
  }
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.form-actions {
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.ai-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  
  .file-icon {
    font-size: 28px;
  }
}

.text-danger {
  color: var(--color-danger);
}

.text-muted {
  color: var(--text-secondary);
}

.text-sm {
  font-size: 0.875rem;
}

.text-xs {
  font-size: 0.75rem;
}

.text-center {
  text-align: center;
}

.font-medium {
  font-weight: 500;
}

.mt-2 {
  margin-top: 8px;
}

.spinner-small {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-column:first-child {
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
