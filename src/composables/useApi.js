import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import API from '@/api'

export function useApi() {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)
  
  const execute = async (apiCall, ...args) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiCall(...args)
      
      if (response.status === 'success') {
        data.value = response.data
        return { success: true, data: response.data }
      } else {
        error.value = response.message || 'Terjadi kesalahan'
        return { success: false, message: error.value }
      }
    } catch (err) {
      error.value = err.message || 'Gagal terhubung ke server'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }
  
  return {
    loading,
    error,
    data,
    execute
  }
}

// Specific API composables
export function useSuratMasuk() {
  const { execute, loading, error } = useApi()
  
  return {
    loading,
    error,
    list: (params) => execute(API.suratMasukList, params),
    detail: (id) => execute(API.suratMasukDetail, id),
    create: (data) => execute(API.suratMasukCreate, data),
    update: (id, data) => execute(API.suratMasukUpdate, id, data),
    delete: (id) => execute(API.suratMasukDelete, id),
    stats: (params) => execute(API.suratMasukStats, params)
  }
}

export function useSuratKeluar() {
  const { execute, loading, error } = useApi()
  
  return {
    loading,
    error,
    list: (params) => execute(API.suratKeluarList, params),
    detail: (id) => execute(API.suratKeluarDetail, id),
    create: (data) => execute(API.suratKeluarCreate, data),
    update: (id, data) => execute(API.suratKeluarUpdate, id, data),
    delete: (id) => execute(API.suratKeluarDelete, id),
    submitApproval: (id) => execute(API.suratKeluarSubmitApproval, id)
  }
}

export function useUsers() {
  const { execute, loading, error } = useApi()
  
  return {
    loading,
    error,
    list: (params) => execute(API.usersList, params),
    create: (data) => execute(API.usersCreate, data),
    update: (id, data) => execute(API.usersUpdate, id, data),
    delete: (id) => execute(API.usersDelete, id)
  }
}
