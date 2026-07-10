import { defineStore } from 'pinia'
import { ref } from 'vue'
import API from '@/api'

export const useAdminStore = defineStore('admin', () => {
  const users = ref([])
  const usersLoading = ref(false)
  
  const masterData = ref([])
  const masterDataLoading = ref(false)
  
  const auditLogs = ref([])
  const auditLogsLoading = ref(false)
  
  const config = ref({})
  const configLoading = ref(false)
  
  const blockchain = ref({ chain: [], stats: {} })
  const blockchainLoading = ref(false)
  
  // Users
  async function fetchUsers(params = {}) {
    usersLoading.value = true
    try {
      const response = await API.usersList(params)
      if (response.status === 'success') {
        users.value = response.data.items
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (err) {
      return { success: false, message: 'Gagal memuat data user' }
    } finally {
      usersLoading.value = false
    }
  }
  
  async function createUser(data) {
    try {
      const response = await API.usersCreate(data)
      if (response.status === 'success') {
        await fetchUsers()
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (err) {
      return { success: false, message: 'Gagal membuat user' }
    }
  }
  
  async function updateUser(id, data) {
    try {
      const response = await API.usersUpdate(id, data)
      if (response.status === 'success') {
        await fetchUsers()
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (err) {
      return { success: false, message: 'Gagal update user' }
    }
  }
  
  async function deleteUser(id) {
    try {
      const response = await API.usersDelete(id)
      if (response.status === 'success') {
        await fetchUsers()
        return { success: true }
      }
      return { success: false, message: response.message }
    } catch (err) {
      return { success: false, message: 'Gagal menghapus user' }
    }
  }
  
  // Master Data
  async function fetchMasterData(params = {}) {
    masterDataLoading.value = true
    try {
      const response = await API.masterDataList(params)
      if (response.status === 'success') {
        masterData.value = response.data.items
        return { success: true }
      }
      return { success: false }
    } catch (err) {
      return { success: false }
    } finally {
      masterDataLoading.value = false
    }
  }
  
  async function createMasterData(data) {
    try {
      const response = await API.masterDataCreate(data)
      if (response.status === 'success') {
        await fetchMasterData()
        return { success: true }
      }
      return { success: false }
    } catch (err) {
      return { success: false }
    }
  }
  
  async function updateMasterData(id, data) {
    try {
      const response = await API.masterDataUpdate(id, data)
      if (response.status === 'success') {
        await fetchMasterData()
        return { success: true }
      }
      return { success: false }
    } catch (err) {
      return { success: false }
    }
  }
  
  async function deleteMasterData(id) {
    try {
      const response = await API.masterDataDelete(id)
      if (response.status === 'success') {
        await fetchMasterData()
        return { success: true }
      }
      return { success: false }
    } catch (err) {
      return { success: false }
    }
  }
  
  // Audit Log
  async function fetchAuditLogs(params = {}) {
    auditLogsLoading.value = true
    try {
      const response = await API.auditLogList(params)
      if (response.status === 'success') {
        auditLogs.value = response.data.items
        return { success: true }
      }
      return { success: false }
    } catch (err) {
      return { success: false }
    } finally {
      auditLogsLoading.value = false
    }
  }
  
  // Config
  async function fetchConfig() {
    configLoading.value = true
    try {
      const response = await API.configGet()
      if (response.status === 'success') {
        config.value = response.data
        return { success: true }
      }
      return { success: false }
    } catch (err) {
      return { success: false }
    } finally {
      configLoading.value = false
    }
  }
  
  async function updateConfig(data) {
    try {
      const response = await API.configUpdate(data)
      if (response.status === 'success') {
        await fetchConfig()
        return { success: true }
      }
      return { success: false }
    } catch (err) {
      return { success: false }
    }
  }
  
  // Blockchain
  async function fetchBlockchain() {
    blockchainLoading.value = true
    try {
      const [chainRes, statsRes, verifyRes] = await Promise.all([
        API.blockchainGetChain(),
        API.blockchainGetStats(),
        API.blockchainVerifyChain()
      ])
      
      blockchain.value = {
        chain: chainRes.status === 'success' ? chainRes.data.chain : [],
        stats: statsRes.status === 'success' ? statsRes.data : {},
        isValid: verifyRes.status === 'success' ? verifyRes.data.isValid : false
      }
      return { success: true }
    } catch (err) {
      return { success: false }
    } finally {
      blockchainLoading.value = false
    }
  }
  
  // Backup
  async function createBackup() {
    try {
      const response = await API.backupCreate()
      return { success: response.status === 'success', data: response.data }
    } catch (err) {
      return { success: false, message: 'Gagal membuat backup' }
    }
  }
  
  async function fetchBackups() {
    try {
      const response = await API.backupList()
      if (response.status === 'success') {
        return { success: true, data: response.data.items }
      }
      return { success: false }
    } catch (err) {
      return { success: false }
    }
  }
  
  return {
    users,
    usersLoading,
    masterData,
    masterDataLoading,
    auditLogs,
    auditLogsLoading,
    config,
    configLoading,
    blockchain,
    blockchainLoading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchMasterData,
    createMasterData,
    updateMasterData,
    deleteMasterData,
    fetchAuditLogs,
    fetchConfig,
    updateConfig,
    fetchBlockchain,
    createBackup,
    fetchBackups
  }
})
