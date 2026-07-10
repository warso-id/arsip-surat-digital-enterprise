/**
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0
 * Application Constants
 */

export const APP_NAME = 'Arsip Surat Digital Enterprise'
export const APP_VERSION = '3.1.0'
export const BUILD_DATE = '2026-07-10'
export const API_VERSION = 'v3'

export const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzzmttzSRYsM7KodsEdFqHRdwBs2kY7VTzFPOpsiab3p3v-6CBl-eKIuUI0Vhqd0opYtA/exec'

export const SIFAT_SURAT = [
  { value: 'biasa', label: 'Biasa', color: '#4CAF50', icon: '📄' },
  { value: 'penting', label: 'Penting', color: '#FF9800', icon: '⭐' },
  { value: 'rahasia', label: 'Rahasia', color: '#F44336', icon: '🔒' },
  { value: 'segera', label: 'Segera', color: '#2196F3', icon: '⚡' }
]

export const STATUS_SURAT = [
  { value: 'diterima', label: 'Diterima', color: '#4CAF50' },
  { value: 'diproses', label: 'Diproses', color: '#FF9800' },
  { value: 'selesai', label: 'Selesai', color: '#2196F3' },
  { value: 'diarsipkan', label: 'Diarsipkan', color: '#9E9E9E' }
]

export const KLASIFIKASI_SURAT = [
  { value: 'umum', label: 'Umum' },
  { value: 'keuangan', label: 'Keuangan' },
  { value: 'kepegawaian', label: 'Kepegawaian' },
  { value: 'hukum', label: 'Hukum' },
  { value: 'pendidikan', label: 'Pendidikan' },
  { value: 'teknis', label: 'Teknis' }
]

export const JENIS_SURAT = [
  { value: 'surat_keputusan', label: 'Surat Keputusan' },
  { value: 'surat_edaran', label: 'Surat Edaran' },
  { value: 'nota_dinas', label: 'Nota Dinas' },
  { value: 'surat_undangan', label: 'Surat Undangan' },
  { value: 'surat_tugas', label: 'Surat Tugas' },
  { value: 'surat_pemberitahuan', label: 'Surat Pemberitahuan' },
  { value: 'memo_internal', label: 'Memo Internal' },
  { value: 'lainnya', label: 'Lainnya' }
]

export const APPROVAL_STATUS = [
  { value: 'pending', label: 'Menunggu', color: '#FF9800' },
  { value: 'approved', label: 'Disetujui', color: '#4CAF50' },
  { value: 'rejected', label: 'Ditolak', color: '#F44336' }
]

export const USER_ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'kepala', label: 'Kepala' },
  { value: 'sekretaris', label: 'Sekretaris' },
  { value: 'staff', label: 'Staff' },
  { value: 'user', label: 'Pengguna' }
]

export const DISPOSISI_STATUS = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' }
]

export const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Informasi', icon: 'ℹ️' },
  { value: 'success', label: 'Sukses', icon: '✅' },
  { value: 'warning', label: 'Peringatan', icon: '⚠️' },
  { value: 'error', label: 'Error', icon: '❌' }
]

export const FILE_TYPES = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz']
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  pageSizeOptions: [10, 20, 50, 100]
}

export const CHART_COLORS = [
  '#1976D2', '#4CAF50', '#FF9800', '#F44336',
  '#9C27B0', '#00BCD4', '#FF5722', '#607D8B',
  '#E91E63', '#3F51B5', '#009688', '#795548'
]

export const SESSION_TIMEOUT = 3600000 // 1 hour

export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export const ACADEMIC_MONTHS = {
  ganjil: ['September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari'],
  genap: ['Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus']
}
