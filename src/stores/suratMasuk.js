import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import API from '@/api'

export const useSuratMasukStore = defineStore('suratMasuk', () => {
  const items = ref([])
  const currentItem = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const filters = ref({
    search: '',
    status: '',
    sifat: '',
    tahun: ''
  })
  
  const hasNext = computed(() => pagination.value.page < pagination.value.totalPages)
  const hasPrev = computed(() => pagination.value.page > 1)
  
  async function fetchList(params = {}) {
    loading.value = true
    error.value = null
    
    try {
      const queryParams = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        ...filters.value,
        ...params
      }
      
      const response = await API.suratMasukList(queryParams)
      
      if (response.status === 'success') {
        items.value = response.data.items
        pagination.value = response.data.pagination
        return { success: true }
      } else {
        error.value = response.message
        return { success: false, message: response.message }
      }
    } catch (err) {
      error.value = 'Gagal memuat data surat masuk'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }
  
  async function fetchDetail(id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await API.suratMasukDetail(id)
      
      if (response.status === 'success') {
        currentItem.value = response.data
        return { success: true, data: response.data }
      } else {
        error.value = response.message
        return { success: false, message: response.message }
      }
    } catch (err) {
      error.value = 'Gagal memuat detail surat'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }
  
  async function create(data) {
    loading.value = true
    error.value = null
    
    try {
      const response = await API.suratMasukCreate(data)
      
      if (response.status === 'success') {
        await fetchList()
        return { success: true, data: response.data }
      } else {
        error.value = response.message
        return { success: false, message: response.message }
      }
    } catch (err) {
      error.value = 'Gagal membuat surat masuk'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }
  
  async function update(id, data) {
    loading.value = true
    error.value = null
    
    try {
      const response = await API.suratMasukUpdate(id, data)
      
      if (response.status === 'success') {
        currentItem.value = { ...currentItem.value, ...data }
        return { success: true }
      } else {
        error.value = response.message
        return { success: false, message: response.message }
      }
    } catch (err) {
      error.value = 'Gagal mengupdate surat'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }
  
  async function remove(id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await API.suratMasukDelete(id)
      
      if (response.status === 'success') {
        await fetchList()
        return { success: true }
      } else {
        error.value = response.message
        return { success: false, message: response.message }
      }
    } catch (err) {
      error.value = 'Gagal menghapus surat'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }
  
  function setPage(page) {
    pagination.value.page = page
    fetchList()
  }
  
  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
    fetchList()
  }
  
  function clearFilters() {
    filters.value = {
      search: '',
      status: '',
      sifat: '',
      tahun: ''
    }
    pagination.value.page = 1
    fetchList()
  }
  
  return {
    items,
    currentItem,
    loading,
    error,
    pagination,
    filters,
    hasNext,
    hasPrev,
    fetchList,
    fetchDetail,
    create,
    update,
    remove,
    setPage,
    setFilters,
    clearFilters
  }
})
