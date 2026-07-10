import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// 🔥 API Base URL untuk Google Apps Script
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzzmttzSRYsM7KodsEdFqHRdwBs2kY7VTzFPOpsiab3p3v-6CBl-eKIuUI0Vhqd0opYtA/exec'

// 🔥 Fallback mock API untuk development/demo
const USE_MOCK = false  // Set true untuk demo tanpa backend

const api = axios.create({
  baseURL: USE_MOCK ? '' : API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Mock data untuk demo
const mockData = {
  users: [
    {
      id: '1',
      username: 'admin',
      email: 'admin@instansi.id',
      namaLengkap: 'Administrator',
      nip: '198001012010011001',
      jabatan: 'Administrator Sistem',
      unitKerja: 'Teknologi Informasi',
      role: 'admin',
      isActive: true,
      biometricEnabled: false,
      language: 'id',
      theme: 'light'
    },
    {
      id: '2',
      username: 'staff',
      email: 'staff@instansi.id',
      namaLengkap: 'Staff User',
      nip: '198501012015011002',
      jabatan: 'Staff',
      unitKerja: 'Umum',
      role: 'staff',
      isActive: true,
      biometricEnabled: false,
      language: 'id',
      theme: 'light'
    }
  ],
  suratMasuk: [],
  suratKeluar: [],
  disposisi: [],
  approval: [],
  notifikasi: []
}

// Mock responses
function mockResponse(data, code = 200) {
  return {
    status: 'success',
    code,
    data,
    version: '3.1.0',
    apiVersion: 'v3',
    timestamp: new Date().toISOString()
  }
}

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
  error => Promise.reject(error)
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
    
    // 🔥 Jika API gagal dan USE_MOCK=true, gunakan mock
    if (USE_MOCK) {
      console.warn('API Error, using mock data:', error.message)
      return mockResponse({})
    }
    
    return Promise.reject(error)
  }
)

// API Methods
const API = {
  // Auth
  login: (credentials) => {
    if (USE_MOCK) {
      const user = mockData.users.find(u => 
        u.username === credentials.username && 
        u.isActive
      )
      if (user) {
        const token = 'mock-token-' + Date.now()
        return Promise.resolve(mockResponse({ token, user }))
      }
      return Promise.resolve({ status: 'error', code: 401, message: 'Username atau password salah' })
    }
    return api.get('', { params: { action: 'login', ...credentials } })
  },
  
  me: () => {
    if (USE_MOCK) {
      return Promise.resolve(mockResponse(mockData.users[0]))
    }
    return api.get('', { params: { action: 'me' } })
  },
  
  changePassword: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ message: 'Password berhasil diubah' }))
    return api.post('', { ...data, action: 'changePassword' })
  },
  
  logout: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({}))
    return api.get('', { params: { action: 'logout' } })
  },
  
  // Ping
  ping: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ message: 'OK' }))
    return api.get('', { params: { action: 'ping' } })
  },
  
  checkSetup: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ isSetup: true }))
    return api.get('', { params: { action: 'checkSetup' } })
  },
  
  setup: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ message: 'Setup berhasil' }))
    return api.post('', { ...data, action: 'setup' })
  },
  
  generateFolders: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ message: 'Folder dibuat' }))
    return api.post('', { action: 'generateFolders' })
  },
  
  // Dashboard
  dashboardStats: () => {
    if (USE_MOCK) {
      return Promise.resolve(mockResponse({
        suratMasuk: { total: 156, hariIni: 3, bulanIni: 25, pending: 12, selesai: 140 },
        suratKeluar: { total: 89, bulanIni: 15, draft: 5, pending: 3, disetujui: 81 },
        disposisi: { total: 45, pending: 8, selesai: 37 }
      }))
    }
    return api.get('', { params: { action: 'dashboard.stats' } })
  },
  
  dashboardChart: (params) => {
    if (USE_MOCK) {
      return Promise.resolve(mockResponse({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
        datasets: [
          { label: 'Surat Masuk', data: [12, 15, 10, 18, 14, 20, 16, 13, 19, 22, 17, 25] },
          { label: 'Surat Keluar', data: [8, 11, 9, 14, 10, 16, 12, 9, 15, 18, 13, 20] }
        ]
      }))
    }
    return api.get('', { params: { action: 'dashboard.chart', ...params } })
  },
  
  dashboardAIInsights: () => {
    if (USE_MOCK) {
      return Promise.resolve(mockResponse({
        recommendations: [
          { icon: '📊', title: 'Tren Surat Masuk', description: 'Terjadi peningkatan 15% surat masuk bulan ini' },
          { icon: '⚠️', title: 'Perhatian', description: '3 surat penting belum ditindaklanjuti' }
        ]
      }))
    }
    return api.get('', { params: { action: 'dashboard.aiInsights' } })
  },
  
  // Surat Masuk
  suratMasukList: (params) => {
    if (USE_MOCK) {
      const items = [
        { id: '1', nomorSurat: '001/UND/DISDIK/2026', nomorAgenda: 'AGD-001/2026', tanggalSurat: '2026-07-01', tanggalTerima: '2026-07-03', pengirim: 'Dinas Pendidikan', perihal: 'Undangan Rapat Koordinasi', sifat: 'penting', klasifikasi: 'umum', status: 'diproses', aiTags: ['rapat', 'koordinasi', 'pendidikan'], aiConfidence: 0.85 },
        { id: '2', nomorSurat: '002/SEK/DISDIK/2026', nomorAgenda: 'AGD-002/2026', tanggalSurat: '2026-07-05', tanggalTerima: '2026-07-07', pengirim: 'Sekretariat Daerah', perihal: 'Pemberitahuan Anggaran', sifat: 'biasa', klasifikasi: 'keuangan', status: 'diterima', aiTags: ['anggaran', 'keuangan'], aiConfidence: 0.78 }
      ]
      return Promise.resolve(mockResponse({ items, pagination: { page: 1, limit: 20, total: 2, totalPages: 1, hasNext: false, hasPrev: false } }))
    }
    return api.get('', { params: { action: 'suratMasuk.list', ...params } })
  },
  
  suratMasukDetail: (id) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({
      id, nomorSurat: '001/UND/DISDIK/2026', nomorAgenda: 'AGD-001/2026',
      tanggalSurat: '2026-07-01', tanggalTerima: '2026-07-03',
      pengirim: 'Dinas Pendidikan', perihal: 'Undangan Rapat Koordinasi',
      sifat: 'penting', klasifikasi: 'umum', status: 'diproses',
      catatan: 'Mohon segera ditindaklanjuti',
      aiTags: ['rapat', 'koordinasi'], aiConfidence: 0.85
    }))
    return api.get('', { params: { action: 'suratMasuk.detail', id } })
  },
  
  suratMasukCreate: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id: Date.now().toString(), ...data }))
    return api.post('', { ...data, action: 'suratMasuk.create' })
  },
  
  suratMasukUpdate: (id, data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id, ...data }))
    return api.post('', { ...data, action: 'suratMasuk.update', id })
  },
  
  suratMasukDelete: (id) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id }))
    return api.post('', { action: 'suratMasuk.delete', id })
  },
  
  suratMasukStats: (params) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ total: 156 }))
    return api.get('', { params: { action: 'suratMasuk.stats', ...params } })
  },
  
  // Surat Keluar
  suratKeluarList: (params) => {
    if (USE_MOCK) {
      const items = [
        { id: '1', nomorSurat: '001/SK/INST/2026', tanggalSurat: '2026-07-02', tujuan: 'Dinas Pendidikan', perihal: 'Balasan Undangan', sifat: 'biasa', jenisSurat: 'surat_edaran', status: 'dikirim', approvalStatus: 'approved' }
      ]
      return Promise.resolve(mockResponse({ items, pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false } }))
    }
    return api.get('', { params: { action: 'suratKeluar.list', ...params } })
  },
  
  suratKeluarDetail: (id) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id, nomorSurat: '001/SK/INST/2026', tanggalSurat: '2026-07-02', tujuan: 'Dinas Pendidikan', perihal: 'Balasan Undangan', sifat: 'biasa', jenisSurat: 'surat_edaran', status: 'dikirim', approvalStatus: 'approved' }))
    return api.get('', { params: { action: 'suratKeluar.detail', id } })
  },
  
  suratKeluarCreate: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id: Date.now().toString() }))
    return api.post('', { ...data, action: 'suratKeluar.create' })
  },
  
  suratKeluarUpdate: (id, data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id }))
    return api.post('', { ...data, action: 'suratKeluar.update', id })
  },
  
  suratKeluarDelete: (id) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id }))
    return api.post('', { action: 'suratKeluar.delete', id })
  },
  
  suratKeluarSubmitApproval: (id) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id }))
    return api.post('', { action: 'suratKeluar.submitApproval', id })
  },
  
  // Disposisi
  disposisiList: (params) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }))
    return api.get('', { params: { action: 'disposisi.list', ...params } })
  },
  
  disposisiCreate: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id: Date.now().toString() }))
    return api.post('', { ...data, action: 'disposisi.create' })
  },
  
  disposisiTindakLanjut: (id, data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id }))
    return api.post('', { ...data, action: 'disposisi.tindakLanjut', id })
  },
  
  // Approval
  approvalList: (params) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ items: [] }))
    return api.get('', { params: { action: 'approval.list', ...params } })
  },
  
  approvalProcess: (id, data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id }))
    return api.post('', { ...data, action: 'approval.process', id })
  },
  
  // Search
  search: (params) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ results: [], totalResults: 0, pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }))
    return api.get('', { params: { action: 'search', ...params } })
  },
  
  // Users
  usersList: (params) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ items: mockData.users, total: mockData.users.length }))
    return api.get('', { params: { action: 'users.list', ...params } })
  },
  
  usersCreate: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id: Date.now().toString() }))
    return api.post('', { ...data, action: 'users.create' })
  },
  
  usersUpdate: (id, data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id }))
    return api.post('', { ...data, action: 'users.update', id })
  },
  
  usersDelete: (id) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id }))
    return api.post('', { action: 'users.delete', id })
  },
  
  usersProfile: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse(mockData.users[0]))
    return api.get('', { params: { action: 'users.profile' } })
  },
  
  usersUpdateProfile: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse(data))
    return api.post('', { ...data, action: 'users.updateProfile' })
  },
  
  // Master Data
  masterDataList: (params) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ items: [], total: 0 }))
    return api.get('', { params: { action: 'masterData.list', ...params } })
  },
  
  masterDataCreate: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id: Date.now().toString() }))
    return api.post('', { ...data, action: 'masterData.create' })
  },
  
  masterDataUpdate: (id, data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id }))
    return api.post('', { ...data, action: 'masterData.update', id })
  },
  
  masterDataDelete: (id) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id }))
    return api.post('', { action: 'masterData.delete', id })
  },
  
  // Config
  configGet: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({
      instansi_nama: 'Instansi Pemerintah',
      instansi_alamat: 'Jl. Contoh No. 123',
      ai_enabled: true,
      blockchain_enabled: true,
      biometric_enabled: true
    }))
    return api.get('', { params: { action: 'config.get' } })
  },
  
  configUpdate: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({}))
    return api.post('', { ...data, action: 'config.update' })
  },
  
  // Audit Log
  auditLogList: (params) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ items: [] }))
    return api.get('', { params: { action: 'auditLog.list', ...params } })
  },
  
  // Notifikasi
  notifikasiList: (params) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }))
    return api.get('', { params: { action: 'notifikasi.list', ...params } })
  },
  
  notifikasiUnreadCount: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ count: 0 }))
    return api.get('', { params: { action: 'notifikasi.unreadCount' } })
  },
  
  notifikasiRead: (id) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ id }))
    return api.post('', { action: 'notifikasi.read', id })
  },
  
  notifikasiReadAll: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({}))
    return api.post('', { action: 'notifikasi.readAll' })
  },
  
  // File Upload
  fileUpload: (formData) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ fileUrl: '#' }))
    return axios.post(API_BASE_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { action: 'file.upload', token: useAuthStore().token }
    })
  },
  
  // Backup
  backupCreate: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ fileName: 'backup.xlsx' }))
    return api.post('', { action: 'backup.create' })
  },
  
  backupList: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ items: [] }))
    return api.get('', { params: { action: 'backup.list' } })
  },
  
  // Export
  exportAll: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({}))
    return api.post('', { action: 'export.all' })
  },
  
  // System
  systemStatus: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({
      version: '3.1.0',
      spreadsheetId: 'demo',
      masterFolderId: 'demo',
      features: { ai: true, blockchain: true, biometric: true }
    }))
    return api.get('', { params: { action: 'system.status' } })
  },
  
  systemInfo: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ version: '3.1.0' }))
    return api.get('', { params: { action: 'system.info' } })
  },
  
  // AI
  aiSmartSearch: (params) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ results: [] }))
    return api.get('', { params: { action: 'ai.smartSearch', ...params } })
  },
  
  aiAutoTag: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ tags: ['surat', 'dokumen'] }))
    return api.post('', { ...data, action: 'ai.autoTag' })
  },
  
  aiAnalyzeDocument: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ wordCount: 100, sentiment: 'neutral' }))
    return api.post('', { ...data, action: 'ai.analyzeDocument' })
  },
  
  // Blockchain
  blockchainGetChain: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ chain: [], length: 0 }))
    return api.get('', { params: { action: 'blockchain.getChain' } })
  },
  
  blockchainVerifyChain: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ isValid: true }))
    return api.get('', { params: { action: 'blockchain.verifyChain' } })
  },
  
  blockchainGetStats: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ totalBlocks: 0 }))
    return api.get('', { params: { action: 'blockchain.getStats' } })
  },
  
  // Biometric
  biometricRegister: (data) => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ message: 'Registered' }))
    return api.post('', { ...data, action: 'biometric.register' })
  },
  
  biometricVerify: (data) => {
    if (USE_MOCK) {
      const token = 'mock-biometric-token-' + Date.now()
      return Promise.resolve(mockResponse({ token, user: mockData.users[0] }))
    }
    return api.post('', { ...data, action: 'biometric.verify' })
  },
  
  biometricStatus: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ enabled: false }))
    return api.get('', { params: { action: 'biometric.status' } })
  },
  
  biometricRemove: () => {
    if (USE_MOCK) return Promise.resolve(mockResponse({ message: 'Removed' }))
    return api.post('', { action: 'biometric.remove' })
  }
}

export default API
export { USE_MOCK }
