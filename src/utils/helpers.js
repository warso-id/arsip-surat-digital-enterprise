/**
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0
 * Utility Helpers
 */

/**
 * Generate unique ID
 */
export function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * Throttle function
 */
export function throttle(fn, limit = 300) {
  let inThrottle = false
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (obj instanceof Object) {
    const cloned = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
}

/**
 * Group array by key
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {})
}

/**
 * Sort array by key
 */
export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const valA = typeof key === 'function' ? key(a) : a[key]
    const valB = typeof key === 'function' ? key(b) : b[key]
    
    if (valA < valB) return order === 'asc' ? -1 : 1
    if (valA > valB) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * Filter unique values
 */
export function unique(array, key) {
  const seen = new Set()
  return array.filter(item => {
    const val = key ? item[key] : item
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}

/**
 * Chunk array
 */
export function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Random integer between min and max
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Random string
 */
export function randomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Truncate text
 */
export function truncate(str, length = 50, suffix = '...') {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length).trim() + suffix
}

/**
 * Slugify string
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Parse JWT token
 */
export function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token) {
  const decoded = parseJWT(token)
  if (!decoded) return true
  return decoded.exp < Math.floor(Date.now() / 1000)
}

/**
 * Get file extension
 */
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}

/**
 * Check if file is image
 */
export function isImageFile(filename) {
  const ext = getFileExtension(filename)
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
}

/**
 * Check if file is PDF
 */
export function isPDFFile(filename) {
  return getFileExtension(filename) === 'pdf'
}

/**
 * Download file from URL
 */
export function downloadFile(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'download'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // Fallback
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  }
}

/**
 * Get query params from URL
 */
export function getQueryParams(url) {
  const params = {}
  const parser = new URL(url || window.location.href)
  parser.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

/**
 * Build query string
 */
export function buildQueryString(params) {
  return Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
}

/**
 * Sleep/Delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry async function
 */
export async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries - 1) throw err
      await sleep(delay * Math.pow(2, i))
    }
  }
}

/**
 * Memoize function
 */
export function memoize(fn) {
  const cache = new Map()
  return function (...args) {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const result = fn.apply(this, args)
    cache.set(key, result)
    return result
  }
}

/**
 * Escape HTML
 */
export function escapeHTML(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * Strip HTML tags
 */
export function stripHTML(str) {
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Highlight search text
 */
export function highlightText(text, query) {
  if (!query) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

/**
 * Get avatar color from name
 */
export function getAvatarColor(name) {
  const colors = [
    '#1976D2', '#4CAF50', '#FF9800', '#F44336',
    '#9C27B0', '#00BCD4', '#FF5722', '#607D8B',
    '#E91E63', '#3F51B5', '#009688', '#795548'
  ]
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Convert bytes to human readable
 */
export function bytesToSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get time ago
 */
export function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  
  const intervals = {
    tahun: 31536000,
    bulan: 2592000,
    minggu: 604800,
    hari: 86400,
    jam: 3600,
    menit: 60,
    detik: 1
  }
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval} ${unit} yang lalu`
    }
  }
  
  return 'Baru saja'
}

/**
 * Get academic year
 */
export function getAcademicYear(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 1-12
  
  if (month >= 9) {
    return `TA_${year}_${year + 1}`
  } else {
    return `TA_${year - 1}_${year}`
  }
}

/**
 * Get semester from date
 */
export function getSemester(date = new Date()) {
  const month = date.getMonth() + 1
  return month >= 9 || month <= 2 ? 'Semester_Ganjil' : 'Semester_Genap'
}
