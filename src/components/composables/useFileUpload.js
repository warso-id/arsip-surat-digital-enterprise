import { ref } from 'vue'
import API from '@/api'

export function useFileUpload() {
  const uploading = ref(false)
  const progress = ref(0)
  const error = ref(null)
  const uploadedFile = ref(null)
  
  async function uploadFile(file, options = {}) {
    uploading.value = true
    progress.value = 0
    error.value = null
    
    const {
      onProgress,
      onSuccess,
      onError,
      maxSize = 10 * 1024 * 1024 // 10MB
    } = options
    
    // Validate file
    if (!file) {
      error.value = 'Tidak ada file yang dipilih'
      uploading.value = false
      return { success: false, message: error.value }
    }
    
    if (file.size > maxSize) {
      error.value = `Ukuran file terlalu besar. Maksimal ${formatSize(maxSize)}`
      uploading.value = false
      return { success: false, message: error.value }
    }
    
    // Simulate progress (real API call)
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 15
        onProgress?.(Math.round(progress.value))
      }
    }, 300)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', file.name)
      formData.append('fileSize', file.size)
      
      const response = await API.fileUpload(formData)
      
      clearInterval(progressInterval)
      
      if (response.status === 'success') {
        progress.value = 100
        uploadedFile.value = response.data
        onProgress?.(100)
        onSuccess?.(response.data)
        return { success: true, data: response.data }
      } else {
        error.value = response.message || 'Upload gagal'
        onError?.(error.value)
        return { success: false, message: error.value }
      }
    } catch (err) {
      clearInterval(progressInterval)
      error.value = 'Gagal mengupload file'
      onError?.(error.value)
      return { success: false, message: error.value }
    } finally {
      uploading.value = false
    }
  }
  
  function validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024,
      allowedTypes = [],
      allowedExtensions = []
    } = options
    
    if (!file) {
      return { valid: false, message: 'Tidak ada file' }
    }
    
    if (file.size > maxSize) {
      return { valid: false, message: `Ukuran file maksimal ${formatSize(maxSize)}` }
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { valid: false, message: `Tipe file tidak didukung. Gunakan: ${allowedTypes.join(', ')}` }
    }
    
    if (allowedExtensions.length > 0) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (!allowedExtensions.includes(ext)) {
        return { valid: false, message: `Ekstensi file tidak didukung. Gunakan: ${allowedExtensions.join(', ')}` }
      }
    }
    
    return { valid: true }
  }
  
  function resetUpload() {
    uploading.value = false
    progress.value = 0
    error.value = null
    uploadedFile.value = null
  }
  
  function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  return {
    uploading,
    progress,
    error,
    uploadedFile,
    uploadFile,
    validateFile,
    resetUpload,
    formatSize
  }
}
