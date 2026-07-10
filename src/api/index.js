import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzzmttzSRYsM7KodsEdFqHRdwBs2kY7VTzFPOpsiab3p3v-6CBl-eKIuUI0Vhqd0opYtA/exec'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor
api.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.params = {
        ...config.params,
        token: authStore.token
      }
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response Interceptor
api.interceptors.response.use(
  response => {
    const data = response.data
    if (data.code === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    }
    return data
  },
  error => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API Methods
const API = {
  // Auth
  login: (credentials) => api.get('', { params: { action: 'login', ...credentials } }),
  me: () => api.get('', { params: { action: 'me' } }),
  changePassword: (data) => api.post('', { ...data, action: 'changePassword' }),
  logout: () => api.get('', { params: { action: 'logout' } }),
  
  // Ping
  ping: () => api.get('', { params: { action: 'ping' } }),
  checkSetup: () => api.get('', { params: { action: 'checkSetup' } }),
  setup: (data) => api.post('', { ...data, action: 'setup' }),
  generateFolders: () => api.post('', { action: 'generateFolders' }),
  
  // Dashboard
  dashboardStats: () => api.get('', { params: { action: 'dashboard.stats' } }),
  dashboardChart: (params) => api.get('', { params: { action: 'dashboard.chart', ...params } }),
  dashboardAIInsights: () => api.get('', { params: { action: 'dashboard.aiInsights' } }),
  
  // Surat Masuk
  suratMasukList: (params) => api.get('', { params: { action: 'suratMasuk.list', ...params } }),
  suratMasukDetail: (id) => api.get('', { params: { action: 'suratMasuk.detail', id } }),
  suratMasukCreate: (data) => api.post('', { ...data, action: 'suratMasuk.create' }),
  suratMasukUpdate: (id, data) => api.post('', { ...data, action: 'suratMasuk.update', id }),
  suratMasukDelete: (id) => api.post('', { action: 'suratMasuk.delete', id }),
  suratMasukStats: (params) => api.get('', { params: { action: 'suratMasuk.stats', ...params } }),
  
  // Surat Keluar
  suratKeluarList: (params) => api.get('', { params: { action: 'suratKeluar.list', ...params } }),
  suratKeluarDetail: (id) => api.get('', { params: { action: 'suratKeluar.detail', id } }),
  suratKeluarCreate: (data) => api.post('', { ...data, action: 'suratKeluar.create' }),
  suratKeluarUpdate: (id, data) => api.post('', { ...data, action: 'suratKeluar.update', id }),
  suratKeluarDelete: (id) => api.post('', { action: 'suratKeluar.delete', id }),
  suratKeluarSubmitApproval: (id) => api.post('', { action: 'suratKeluar.submitApproval', id }),
  
  // Disposisi
  disposisiList: (params) => api.get('', { params: { action: 'disposisi.list', ...params } }),
  disposisiCreate: (data) => api.post('', { ...data, action: 'disposisi.create' }),
  disposisiTindakLanjut: (id, data) => api.post('', { ...data, action: 'disposisi.tindakLanjut', id }),
  
  // Approval
  approvalList: (params) => api.get('', { params: { action: 'approval.list', ...params } }),
  approvalProcess: (id, data) => api.post('', { ...data, action: 'approval.process', id }),
  
  // Search
  search: (params) => api.get('', { params: { action: 'search', ...params } }),
  
  // Users
  usersList: (params) => api.get('', { params: { action: 'users.list', ...params } }),
  usersCreate: (data) => api.post('', { ...data, action: 'users.create' }),
  usersUpdate: (id, data) => api.post('', { ...data, action: 'users.update', id }),
  usersDelete: (id) => api.post('', { action: 'users.delete', id }),
  usersProfile: () => api.get('', { params: { action: 'users.profile' } }),
  usersUpdateProfile: (data) => api.post('', { ...data, action: 'users.updateProfile' }),
  
  // Master Data
  masterDataList: (params) => api.get('', { params: { action: 'masterData.list', ...params } }),
  masterDataCreate: (data) => api.post('', { ...data, action: 'masterData.create' }),
  masterDataUpdate: (id, data) => api.post('', { ...data, action: 'masterData.update', id }),
  masterDataDelete: (id) => api.post('', { action: 'masterData.delete', id }),
  
  // Config
  configGet: () => api.get('', { params: { action: 'config.get' } }),
  configUpdate: (data) => api.post('', { ...data, action: 'config.update' }),
  
  // Audit Log
  auditLogList: (params) => api.get('', { params: { action: 'auditLog.list', ...params } }),
  
  // Notifikasi
  notifikasiList: (params) => api.get('', { params: { action: 'notifikasi.list', ...params } }),
  notifikasiUnreadCount: () => api.get('', { params: { action: 'notifikasi.unreadCount' } }),
  notifikasiRead: (id) => api.post('', { action: 'notifikasi.read', id }),
  notifikasiReadAll: () => api.post('', { action: 'notifikasi.readAll' }),
  
  // File Upload
  fileUpload: (formData) => {
    return axios.post(API_BASE_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { 
        action: 'file.upload',
        token: useAuthStore().token
      }
    })
  },
  
  // Backup
  backupCreate: () => api.post('', { action: 'backup.create' }),
  backupList: () => api.get('', { params: { action: 'backup.list' } }),
  
  // Export
  exportAll: () => api.post('', { action: 'export.all' }),
  
  // System
  systemStatus: () => api.get('', { params: { action: 'system.status' } }),
  systemInfo: () => api.get('', { params: { action: 'system.info' } }),
  
  // AI
  aiSmartSearch: (params) => api.get('', { params: { action: 'ai.smartSearch', ...params } }),
  aiAutoTag: (data) => api.post('', { ...data, action: 'ai.autoTag' }),
  aiAnalyzeDocument: (data) => api.post('', { ...data, action: 'ai.analyzeDocument' }),
  
  // Blockchain
  blockchainGetChain: () => api.get('', { params: { action: 'blockchain.getChain' } }),
  blockchainVerifyChain: () => api.get('', { params: { action: 'blockchain.verifyChain' } }),
  blockchainGetStats: () => api.get('', { params: { action: 'blockchain.getStats' } }),
  
  // Biometric
  biometricRegister: (data) => api.post('', { ...data, action: 'biometric.register' }),
  biometricVerify: (data) => api.post('', { ...data, action: 'biometric.verify' }),
  biometricStatus: () => api.get('', { params: { action: 'biometric.status' } }),
  biometricRemove: () => api.post('', { action: 'biometric.remove' })
}

export default API
