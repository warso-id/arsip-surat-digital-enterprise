import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import API from '@/api'

export const useSuratKeluarStore = defineStore('suratKeluar', () => {
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
    approvalStatus: '',
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
      
      const response = await API.suratKeluarList(queryParams)
      
      if (response.status === 'success') {
        items.value = response.data.items
        pagination.value = response.data.pagination
        return { success: true }
      } else {
        error.value = response.message
        return { success: false }
      }
    } catch (err) {
      error.value = 'Gagal memuat data surat keluar'
      return { success: false }
    } finally {
      loading.value = false
    }
  }
  
  async function fetchDetail(id) {
    loading.value = true
    
    try {
      const response = await API.suratKeluarDetail(id)
      if (response.status === 'success') {
        currentItem.value = response.data
        return { success: true, data: response.data }
      }
      return { success: false, message: response.message }
    } catch (err) {
      return { success: false, message: 'Gagal memuat detail' }
    } finally {
      loading.value = false
    }
  }
  
  async function create(data) {
    loading.value = true
    
    try {
      const response = await API.suratKeluarCreate(data)
      if (response.status === 'success') {
        await fetchList()
        return { success: true, data: response.data }
      }
      return { success: false, message: response.message }
    } catch (err) {
      return { success: false, message: 'Gagal membuat surat' }
    } finally {
      loading.value = false
    }
  }
  
  async function update(id, data) {
    loading.value = true
    
    try {
      const response = await API.suratKeluarUpdate(id, data)
      if (response.status === 'success') {
        currentItem.value = { ...currentItem.value, ...data }
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (err) {
      return { success: false, message: 'Gagal update surat' }
    } finally {
      loading.value = false
    }
  }
  
  async function remove(id) {
    loading.value = true
    
    try {
      const response = await API.suratKeluarDelete(id)
      if (response.status === 'success') {
        await fetchList()
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (err) {
      return { success: false, message: 'Gagal menghapus surat' }
    } finally {
      loading.value = false
    }
  }
  
  async function submitApproval(id) {
    try {
      const response = await API.suratKeluarSubmitApproval(id)
      return { success: response.status === 'success', message: response.message }
    } catch (err) {
      return { success: false, message: 'Gagal submit approval' }
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
    submitApproval,
    setPage,
    setFilters
  }
})
