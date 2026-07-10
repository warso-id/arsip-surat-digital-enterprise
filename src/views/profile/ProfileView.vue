<template>
  <DefaultLayout>
    <div class="profile-page">
      <div class="page-header">
        <h1 class="page-title">👤 Profil Saya</h1>
      </div>
      
      <div class="profile-grid">
        <!-- Profile Info -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Informasi Profil</h3>
          </div>
          <div class="card-body">
            <div class="profile-avatar-section">
              <div class="profile-avatar" :style="{ background: avatarColor }">
                {{ userInitials }}
              </div>
              <div>
                <h3>{{ user?.namaLengkap || user?.username }}</h3>
                <span class="badge" :class="`badge-${roleBadge}`">
                  {{ roleLabel(user?.role) }}
                </span>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <label>Username</label>
                <span>{{ user?.username }}</span>
              </div>
              <div class="info-item">
                <label>Email</label>
                <span>{{ user?.email || '-' }}</span>
              </div>
              <div class="info-item">
                <label>NIP</label>
                <span>{{ formatNIP(user?.nip) }}</span>
              </div>
              <div class="info-item">
                <label>Jabatan</label>
                <span>{{ user?.jabatan || '-' }}</span>
              </div>
              <div class="info-item">
                <label>Unit Kerja</label>
                <span>{{ user?.unitKerja || '-' }}</span>
              </div>
              <div class="info-item">
                <label>Role</label>
                <span>{{ roleLabel(user?.role) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Update Profile -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Edit Profil</h3>
          </div>
          <div class="card-body">
            <form @submit.prevent="handleUpdateProfile">
              <div class="form-group">
                <label>Nama Lengkap</label>
                <input v-model="profileForm.namaLengkap" type="text" class="form-control" />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input v-model="profileForm.email" type="email" class="form-control" />
              </div>
              <div class="form-group">
                <label>NIP</label>
                <input v-model="profileForm.nip" type="text" class="form-control" />
              </div>
              <div class="form-group">
                <label>Jabatan</label>
                <input v-model="profileForm.jabatan" type="text" class="form-control" />
              </div>
              <div class="form-group">
                <label>Unit Kerja</label>
                <input v-model="profileForm.unitKerja" type="text" class="form-control" />
              </div>
              <button type="submit" class="btn btn-primary" :disabled="updating">
                {{ updating ? 'Menyimpan...' : '💾 Simpan Perubahan' }}
              </button>
            </form>
          </div>
        </div>
        
        <!-- Change Password -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Ubah Password</h3>
          </div>
          <div class="card-body">
            <form @submit.prevent="handleChangePassword">
              <div class="form-group">
                <label>Password Lama</label>
                <input v-model="passwordForm.oldPassword" type="password" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Password Baru</label>
                <input v-model="passwordForm.newPassword" type="password" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Konfirmasi Password Baru</label>
                <input v-model="passwordForm.confirmPassword" type="password" class="form-control" required />
              </div>
              <p v-if="passwordError" class="text-danger text-sm">{{ passwordError }}</p>
              <p v-if="passwordSuccess" class="text-success text-sm">{{ passwordSuccess }}</p>
              <button type="submit" class="btn btn-primary" :disabled="changingPassword">
                {{ changingPassword ? 'Mengubah...' : '🔒 Ubah Password' }}
              </button>
            </form>
          </div>
        </div>
        
        <!-- Settings -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Pengaturan</h3>
          </div>
          <div class="card-body">
            <div class="setting-item">
              <div>
                <div class="setting-label">Tema</div>
                <div class="setting-desc">Pilih tema tampilan</div>
              </div>
              <select v-model="theme" class="form-control" style="width: auto;" @change="changeTheme">
                <option value="light">☀️ Terang</option>
                <option value="dark">🌙 Gelap</option>
                <option value="auto">🔄 Otomatis</option>
              </select>
            </div>
            
            <div class="setting-item">
              <div>
                <div class="setting-label">Bahasa</div>
                <div class="setting-desc">Pilih bahasa aplikasi</div>
              </div>
              <select v-model="language" class="form-control" style="width: auto;" @change="changeLanguage">
                <option value="id">🇮🇩 Indonesia</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
            
            <div class="setting-item" v-if="biometricSupported">
              <div>
                <div class="setting-label">Biometrik</div>
                <div class="setting-desc">Aktifkan login dengan fingerprint</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="biometricEnabled" @change="toggleBiometric" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import API from '@/api'
import { roleLabel } from '@/utils/formatters'
import { formatNIP, getInitials, getAvatarColor } from '@/utils/helpers'

export default {
  name: 'ProfileView',
  components: { DefaultLayout },
  setup() {
    const authStore = useAuthStore()
    const themeStore = useThemeStore()
    
    const user = computed(() => authStore.user)
    const userInitials = computed(() => getInitials(user.value?.namaLengkap || user.value?.username))
    const avatarColor = computed(() => getAvatarColor(user.value?.namaLengkap || user.value?.username))
    const roleBadge = computed(() => {
      const map = { admin: 'primary', kepala: 'success', staff: 'info', user: 'secondary' }
      return map[user.value?.role] || 'secondary'
    })
    
    const theme = ref(themeStore.theme)
    const language = ref(themeStore.language)
    const biometricSupported = ref(false)
    const biometricEnabled = ref(false)
    
    const updating = ref(false)
    const changingPassword = ref(false)
    const passwordError = ref('')
    const passwordSuccess = ref('')
    
    const profileForm = reactive({
      namaLengkap: '',
      email: '',
      nip: '',
      jabatan: '',
      unitKerja: ''
    })
    
    const passwordForm = reactive({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
    const initForm = () => {
      if (user.value) {
        profileForm.namaLengkap = user.value.namaLengkap || ''
        profileForm.email = user.value.email || ''
        profileForm.nip = user.value.nip || ''
        profileForm.jabatan = user.value.jabatan || ''
        profileForm.unitKerja = user.value.unitKerja || ''
      }
    }
    
    const handleUpdateProfile = async () => {
      updating.value = true
      const result = await authStore.updateProfile(profileForm)
      updating.value = false
      
      if (result.success) {
        // Toast success
      }
    }
    
    const handleChangePassword = async () => {
      passwordError.value = ''
      passwordSuccess.value = ''
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        passwordError.value = 'Konfirmasi password tidak cocok'
        return
      }
      
      if (passwordForm.newPassword.length < 8) {
        passwordError.value = 'Password minimal 8 karakter'
        return
      }
      
      changingPassword.value = true
      
      try {
        const response = await API.changePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
        
        if (response.status === 'success') {
          passwordSuccess.value = 'Password berhasil diubah'
          passwordForm.oldPassword = ''
          passwordForm.newPassword = ''
          passwordForm.confirmPassword = ''
        } else {
          passwordError.value = response.message || 'Gagal mengubah password'
        }
      } catch (err) {
        passwordError.value = 'Gagal mengubah password'
      } finally {
        changingPassword.value = false
      }
    }
    
    const changeTheme = () => {
      themeStore.setTheme(theme.value)
    }
    
    const changeLanguage = () => {
      themeStore.setLanguage(language.value)
    }
    
    const toggleBiometric = async () => {
      if (biometricEnabled.value) {
        // Register biometric
        try {
          await API.biometricRegister({})
        } catch (err) {
          biometricEnabled.value = false
        }
      } else {
        // Remove biometric
        try {
          await API.biometricRemove()
        } catch (err) {}
      }
    }
    
    onMounted(async () => {
      initForm()
      
      // Check biometric support
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          biometricSupported.value = available
          biometricEnabled.value = user.value?.biometricEnabled || false
        } catch (err) {}
      }
    })
    
    return {
      user,
      userInitials,
      avatarColor,
      roleBadge,
      theme,
      language,
      biometricSupported,
      biometricEnabled,
      profileForm,
      passwordForm,
      updating,
      changingPassword,
      passwordError,
      passwordSuccess,
      roleLabel,
      formatNIP,
      handleUpdateProfile,
      handleChangePassword,
      changeTheme,
      changeLanguage,
      toggleBiometric
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
}

.profile-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  
  .profile-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
    flex-shrink: 0;
  }
  
  h3 {
    margin: 0 0 4px;
  }
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
    }
    
    span {
      font-size: 0.9375rem;
      color: var(--text-primary);
      font-weight: 500;
    }
  }
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid var(--border-light);
  }
  
  .setting-label {
    font-weight: 500;
    font-size: 0.9375rem;
  }
  
  .setting-desc {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 26px;
  display: inline-block;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--border-dark);
    border-radius: 26px;
    transition: all 0.3s;
    
    &::before {
      content: '';
      position: absolute;
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: all 0.3s;
    }
  }
  
  input:checked + .toggle-slider {
    background: var(--color-primary);
    
    &::before {
      transform: translateX(22px);
    }
  }
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
