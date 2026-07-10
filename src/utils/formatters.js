/**
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0
 * Formatters
 */

/**
 * Format date to Indonesian locale
 */
export function formatDate(date, options = {}) {
  if (!date) return '-'
  
  const defaultOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }
  
  return new Date(date).toLocaleDateString('id-ID', { ...defaultOptions, ...options })
}

/**
 * Format date time
 */
export function formatDateTime(date) {
  if (!date) return '-'
  
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format date to ISO string
 */
export function formatISO(date) {
  if (!date) return ''
  return new Date(date).toISOString()
}

/**
 * Format date for input[type="date"]
 */
export function formatDateInput(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

/**
 * Format number to Indonesian locale
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Format currency
 */
export function formatCurrency(amount) {
  return 'Rp ' + formatNumber(amount, 0)
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format phone number
 */
export function formatPhone(phone) {
  if (!phone) return '-'
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('62')) {
    return `+62 ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`
  } else if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`
  }
  
  return phone
}

/**
 * Format NIP
 */
export function formatNIP(nip) {
  if (!nip) return '-'
  const cleaned = nip.replace(/\D/g, '')
  if (cleaned.length === 18) {
    return `${cleaned.slice(0, 8)} ${cleaned.slice(8, 14)} ${cleaned.slice(14, 15)} ${cleaned.slice(15)}`
  }
  return nip
}

/**
 * Get status label
 */
export function statusLabel(status) {
  const labels = {
    diterima: 'Diterima',
    diproses: 'Diproses',
    selesai: 'Selesai',
    diarsipkan: 'Diarsipkan',
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Disetujui',
    rejected: 'Ditolak'
  }
  return labels[status] || status || '-'
}

/**
 * Get status color
 */
export function statusColor(status) {
  const colors = {
    diterima: 'info',
    diproses: 'warning',
    selesai: 'success',
    diarsipkan: 'secondary',
    draft: 'secondary',
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return colors[status] || 'secondary'
}

/**
 * Get sifat surat label
 */
export function sifatLabel(sifat) {
  const labels = {
    biasa: 'Biasa',
    penting: 'Penting',
    rahasia: 'Rahasia',
    segera: 'Segera'
  }
  return labels[sifat] || sifat || 'Biasa'
}

/**
 * Get role label
 */
export function roleLabel(role) {
  const labels = {
    admin: 'Administrator',
    staff: 'Staff',
    user: 'Pengguna',
    kepala: 'Kepala',
    sekretaris: 'Sekretaris'
  }
  return labels[role] || role || 'User'
}

/**
 * Format nomor surat
 */
export function formatNomorSurat(nomor) {
  if (!nomor) return '-'
  return nomor
}

/**
 * Format QR code URL
 */
export function formatQRCode(id, size = 150) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(id)}`
}

/**
 * Get month name
 */
export function monthName(month) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[month] || ''
}

/**
 * Get day name
 */
export function dayName(day) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return days[day] || ''
}
