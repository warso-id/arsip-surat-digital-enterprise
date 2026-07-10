import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import API from '@/api'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)
  
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  
  async function login(credentials) {
    loading.value = true
    error.value = null
    
    try {
      const response = await API.login(credentials)
      
      if (response.status === 'success') {
        token.value = response.data.token
        user.value = response.data.user
        
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
        
        return { success: true }
      } else {
        error.value = response.message
        return { success: false, message: response.message }
      }
    } catch (err) {
      error.value = 'Gagal terhubung ke server'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }
  
  async function checkAuth() {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      try {
        user.value = JSON.parse(savedUser)
        // Verify token with server
        const response = await API.me()
        if (response.status === 'success') {
          user.value = response.data
          localStorage.setItem('user', JSON.stringify(user.value))
        }
      } catch (err) {
        console.log('Token verification failed, using cached data')
      }
    }
  }
  
  async function biometricLogin(credential) {
    loading.value = true
    error.value = null
    
    try {
      const response = await API.biometricVerify(credential)
      
      if (response.status === 'success') {
        token.value = response.data.token
        user.value = response.data.user
        
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
        
        return { success: true }
      } else {
        error.value = response.message
        return { success: false, message: response.message }
      }
    } catch (err) {
      error.value = 'Gagal terhubung ke server'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }
  
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }
  
  async function updateProfile(data) {
    try {
      const response = await API.usersUpdateProfile(data)
      if (response.status === 'success') {
        user.value = { ...user.value, ...data }
        localStorage.setItem('user', JSON.stringify(user.value))
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (err) {
      return { success: false, message: 'Gagal update profil' }
    }
  }
  
  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    checkAuth,
    biometricLogin,
    logout,
    updateProfile
  }
})
