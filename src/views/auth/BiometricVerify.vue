<template>
  <AuthLayout>
    <div class="biometric-page">
      <div class="biometric-content">
        <div class="biometric-icon">
          <span>🖐️</span>
        </div>
        
        <h2>Verifikasi Biometrik</h2>
        <p>Gunakan fingerprint atau face recognition untuk login</p>
        
        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>
        
        <div v-if="status === 'idle'" class="biometric-status">
          <p>Klik tombol di bawah untuk memulai verifikasi</p>
        </div>
        
        <div v-else-if="status === 'checking'" class="biometric-status">
          <div class="spinner-large"></div>
          <p>Memeriksa ketersediaan biometrik...</p>
        </div>
        
        <div v-else-if="status === 'prompt'" class="biometric-status">
          <div class="fingerprint-animation">
            <span>🖐️</span>
          </div>
          <p>Silakan verifikasi identitas Anda</p>
        </div>
        
        <div v-else-if="status === 'success'" class="biometric-status success">
          <span class="success-icon">✅</span>
          <p>Verifikasi berhasil!</p>
        </div>
        
        <button
          class="btn btn-primary btn-lg btn-block"
          @click="startVerification"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner-small"></span>
          <span v-else>🖐️ Verifikasi Biometrik</span>
        </button>
        
        <div class="biometric-divider">
          <span>atau</span>
        </div>
        
        <router-link to="/login" class="btn btn-outline btn-block">
          🔐 Login dengan Password
        </router-link>
      </div>
    </div>
  </AuthLayout>
</template>

<script>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'

export default {
  name: 'BiometricVerify',
  components: { AuthLayout },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    
    const status = ref('idle')
    const loading = ref(false)
    const error = ref('')
    
    const startVerification = async () => {
      if (!window.PublicKeyCredential) {
        error.value = 'Biometrik tidak didukung di browser ini. Gunakan Chrome, Edge, atau Safari terbaru.'
        return
      }
      
      loading.value = true
      error.value = ''
      status.value = 'checking'
      
      try {
        // Check if platform authenticator is available
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        
        if (!available) {
          error.value = 'Autentikasi biometrik tidak tersedia di perangkat ini.'
          status.value = 'idle'
          loading.value = false
          return
        }
        
        status.value = 'prompt'
        
        // Create credential request options
        const challenge = new Uint8Array(32)
        crypto.getRandomValues(challenge)
        
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            timeout: 30000,
            userVerification: 'required',
            rpId: window.location.hostname
          }
        })
        
        // Send to server for verification
        const result = await authStore.biometricLogin(credential)
        
        if (result.success) {
          status.value = 'success'
          setTimeout(() => {
            const redirect = route.query.redirect || '/dashboard'
            router.push(redirect)
          }, 1000)
        } else {
          error.value = result.message || 'Verifikasi gagal'
          status.value = 'idle'
        }
      } catch (err) {
        console.error('Biometric error:', err)
        error.value = 'Verifikasi biometrik gagal atau dibatalkan.'
        status.value = 'idle'
      } finally {
        loading.value = false
      }
    }
    
    return {
      status,
      loading,
      error,
      startVerification
    }
  }
}
</script>

<style lang="scss" scoped>
.biometric-content {
  text-align: center;
  
  .biometric-icon {
    font-size: 64px;
    margin-bottom: 20px;
    animation: float 3s ease-in-out infinite;
  }
  
  h2 {
    font-size: 1.5rem;
    color: var(--text-primary);
    margin: 0 0 8px;
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: 24px;
  }
}

.biometric-status {
  margin-bottom: 24px;
  padding: 24px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  
  p {
    margin: 12px 0 0;
  }
  
  &.success {
    background: #E8F5E9;
    
    .success-icon {
      font-size: 48px;
    }
  }
}

.fingerprint-animation {
  font-size: 48px;
  animation: pulse 1.5s ease-in-out infinite;
}

.spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

.biometric-divider {
  display: flex;
  align-items: center;
  margin: 16px 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }
  
  span {
    padding: 0 16px;
    color: var(--text-tertiary);
    font-size: 0.8125rem;
  }
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

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
