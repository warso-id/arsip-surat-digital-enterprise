<template>
  <div class="config-manage">
    <div class="section-header">
      <h2>⚙️ Konfigurasi Sistem</h2>
    </div>
    
    <div class="card" v-if="!loading">
      <div class="card-body">
        <form @submit.prevent="handleSave">
          <div class="config-section">
            <h3 class="config-section-title">Informasi Instansi</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Nama Instansi</label>
                <input v-model="form.instansi_nama" type="text" class="form-control" />
              </div>
              <div class="form-group">
                <label>Email Instansi</label>
                <input v-model="form.instansi_email" type="email" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label>Alamat</label>
              <textarea v-model="form.instansi_alamat" class="form-control" rows="2"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Telepon</label>
                <input v-model="form.instansi_telepon" type="text" class="form-control" />
              </div>
              <div class="form-group">
                <label>Website</label>
                <input v-model="form.instansi_website" type="text" class="form-control" />
              </div>
            </div>
          </div>
          
          <div class="config-section">
            <h3 class="config-section-title">Fitur Sistem</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="toggle-label">
                  <span>🤖 AI Features</span>
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="form.ai_enabled" />
                    <span class="toggle-slider"></span>
                  </label>
                </label>
              </div>
              <div class="form-group">
                <label class="toggle-label">
                  <span>⛓️ Blockchain</span>
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="form.blockchain_enabled" />
                    <span class="toggle-slider"></span>
                  </label>
                </label>
              </div>
              <div class="form-group">
                <label class="toggle-label">
                  <span>🖐️ Biometric</span>
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="form.biometric_enabled" />
                    <span class="toggle-slider"></span>
                  </label>
                </label>
              </div>
            </div>
          </div>
          
          <div class="config-section">
            <h3 class="config-section-title">Pengaturan Sistem</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Session Timeout (menit)</label>
                <input v-model="form.session_timeout" type="number" class="form-control" />
              </div>
              <div class="form-group">
                <label>Max File Size (MB)</label>
                <input v-model="form.max_file_size" type="number" class="form-control" />
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Menyimpan...' : '💾 Simpan Konfigurasi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <LoadingSpinner v-else text="Memuat konfigurasi..." />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

export default {
  name: 'ConfigManage',
  components: { LoadingSpinner },
  setup() {
    const adminStore = useAdminStore()
    const loading = ref(true)
    const saving = ref(false)
    
    const form = reactive({
      instansi_nama: '', instansi_alamat: '', instansi_telepon: '',
      instansi_email: '', instansi_website: '',
      ai_enabled: true, blockchain_enabled: true, biometric_enabled: true,
      session_timeout: 60, max_file_size: 10
    })
    
    const fetchConfig = async () => {
      loading.value = true
      await adminStore.fetchConfig()
      const config = adminStore.config
      if (config) {
        Object.keys(form).forEach(k => {
          if (config[k] !== undefined) form[k] = config[k]
        })
      }
      loading.value = false
    }
    
    const handleSave = async () => {
      saving.value = true
      await adminStore.updateConfig(form)
      saving.value = false
    }
    
    onMounted(() => fetchConfig())
    
    return { loading, saving, form, handleSave }
  }
}
</script>

<style lang="scss" scoped>
.section-header { margin-bottom: 20px; h2 { font-size: 1.25rem; font-weight: 700; margin: 0; } }
.config-section { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border-color);
  &:last-child { border-bottom: none; margin-bottom: 0; }
}
.config-section-title { font-size: 1rem; font-weight: 600; margin: 0 0 16px; color: var(--color-primary); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { margin-bottom: 16px;
  label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.875rem; }
  .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem;
    &:focus { outline: none; border-color: var(--color-primary); }
  }
}
.toggle-label { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md); }
.toggle-switch { position: relative; width: 48px; height: 26px; display: inline-block;
  input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: var(--border-dark); border-radius: 26px; transition: 0.3s;
    &::before { content: ''; position: absolute; height: 20px; width: 20px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
  }
  input:checked + .toggle-slider { background: var(--color-primary); &::before { transform: translateX(22px); } }
}
.form-actions { display: flex; justify-content: flex-end; padding-top: 16px; }
@media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
</style>
