<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <svg width="60" height="60" viewBox="0 0 80 80">
            <rect width="80" height="80" rx="16" fill="#1976D2"/>
            <path d="M20 25h40v5H20zM20 35h40v5H20zM20 45h30v5H20z" fill="white"/>
            <path d="M55 42l10 10-10 10" stroke="white" stroke-width="3" fill="none"/>
          </svg>
        </div>
        <h1>Arsip Surat Digital</h1>
        <p>Enterprise v3.1.0</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>
        
        <div class="form-group">
          <label for="username">Username</label>
          <div class="input-group">
            <span class="input-icon">👤</span>
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="Masukkan username"
              required
              autocomplete="username"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-group">
            <span class="input-icon">🔒</span>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Masukkan password"
              required
              autocomplete="current-password"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>
        
        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="rememberMe" />
            <span>Ingat saya</span>
          </label>
          <a href="#" class="forgot-password">Lupa password?</a>
        </div>
        
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading" class="spinner-small"></span>
          <span v-else>🔐 Masuk</span>
        </button>
        
        <div class="divider">
          <span>atau</span>
        </div>
        
        <button type="button" class="btn btn-outline btn-block" @click="handleBiometricLogin">
          <span>🖐️ Masuk dengan Biometrik</span>
        </button>
      </form>
      
      <div class="login-footer">
        <p>© 2026 Arsip Surat Digital Enterprise</p>
        <p class="version">v3.1.0</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    
    const form = reactive({
      username: '',
      password: ''
    })
    const showPassword = ref(false)
    const rememberMe = ref(false)
    const loading = ref(false)
    const error = ref('')
    
    const handleLogin = async () => {
      loading.value = true
      error.value = ''
      
      const result = await authStore.login(form)
      
      if (result.success) {
        const redirect = route.query.redirect || '/dashboard'
        router.push(redirect)
      } else {
        error.value = result.message
      }
      
      loading.value = false
    }
    
    const handleBiometricLogin = async () => {
      if (!window.PublicKeyCredential) {
        error.value = 'Biometrik tidak didukung di browser ini'
        return
      }
      
      try {
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            timeout: 30000,
            userVerification: 'required'
          }
        })
        
        const result = await authStore.biometricLogin(credential)
        
        if (result.success) {
          const redirect = route.query.redirect || '/dashboard'
          router.push(redirect)
        } else {
          error.value = result.message
        }
      } catch (err) {
        error.value = 'Gagal verifikasi biometrik'
      }
    }
    
    return {
      form,
      showPassword,
      rememberMe,
      loading,
      error,
      handleLogin,
      handleBiometricLogin
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  
  .logo {
    margin-bottom: 16px;
  }
  
  h1 {
    font-size: 24px;
    color: #1976D2;
    margin: 0 0 8px;
  }
  
  p {
    color: #666;
    margin: 0;
  }
}

.login-form {
  .alert {
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    
    &.alert-error {
      background: #FFF3F3;
      color: #D32F2F;
      border: 1px solid #FFCDD2;
    }
  }
}

.form-group {
  margin-bottom: 20px;
  
  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #333;
  }
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  
  .input-icon {
    position: absolute;
    left: 12px;
    font-size: 18px;
  }
  
  input {
    width: 100%;
    padding: 12px 12px 12px 40px;
    border: 2px solid #E0E0E0;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s;
    
    &:focus {
      outline: none;
      border-color: #1976D2;
    }
  }
  
  .toggle-password {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
    }
  }
  
  .forgot-password {
    color: #1976D2;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  
  &.btn-primary {
    background: #1976D2;
    color: white;
    
    &:hover {
      background: #1565C0;
    }
    
    &:disabled {
      background: #90CAF9;
      cursor: not-allowed;
    }
  }
  
  &.btn-outline {
    background: transparent;
    color: #1976D2;
    border: 2px solid #1976D2;
    
    &:hover {
      background: #E3F2FD;
    }
  }
  
  &.btn-block {
    width: 100%;
  }
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #E0E0E0;
  }
  
  span {
    padding: 0 16px;
    color: #999;
    font-size: 14px;
  }
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  
  p {
    margin: 4px 0;
    color: #999;
    font-size: 14px;
  }
  
  .version {
    font-size: 12px;
    color: #BBB;
  }
}

.spinner-small {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
