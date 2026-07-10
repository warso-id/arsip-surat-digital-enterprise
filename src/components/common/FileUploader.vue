<template>
  <div class="file-uploader">
    <div
      class="upload-area"
      :class="{
        'upload-dragover': isDragover,
        'upload-has-file': file,
        'upload-error': error
      }"
      @dragover.prevent="isDragover = true"
      @dragleave.prevent="isDragover = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        @change="handleFileSelect"
        class="file-input-hidden"
      />
      
      <div v-if="!file" class="upload-placeholder">
        <span class="upload-icon">📁</span>
        <p class="upload-text">
          <strong>Klik untuk upload</strong> atau drag & drop file di sini
        </p>
        <p class="upload-hint" v-if="accept">
          Format: {{ accept }}
        </p>
        <p class="upload-hint" v-if="maxSize">
          Maksimal: {{ formatFileSize(maxSize) }}
        </p>
      </div>
      
      <div v-else class="upload-file-info">
        <div class="file-preview" v-if="isImage">
          <img :src="filePreview" :alt="file.name" />
        </div>
        <div class="file-preview" v-else-if="isPDF">
          <span class="file-type-icon">📄</span>
        </div>
        <div class="file-preview" v-else>
          <span class="file-type-icon">📎</span>
        </div>
        
        <div class="file-details">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-size">{{ formatFileSize(file.size) }}</div>
          
          <div v-if="uploading" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <span class="progress-text">{{ progress }}%</span>
          </div>
        </div>
        
        <button
          v-if="!uploading"
          class="file-remove"
          @click.stop="removeFile"
          title="Hapus file"
        >
          ✕
        </button>
      </div>
    </div>
    
    <div v-if="error" class="upload-error-text">{{ error }}</div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'FileUploader',
  props: {
    modelValue: { type: File, default: null },
    accept: { type: String, default: '' },
    multiple: { type: Boolean, default: false },
    maxSize: { type: Number, default: 10 * 1024 * 1024 }, // 10MB
    autoUpload: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'upload', 'error'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const file = ref(props.modelValue)
    const filePreview = ref('')
    const isDragover = ref(false)
    const uploading = ref(false)
    const progress = ref(0)
    const error = ref('')
    
    const isImage = computed(() => {
      return file.value?.type?.startsWith('image/')
    })
    
    const isPDF = computed(() => {
      return file.value?.type === 'application/pdf'
    })
    
    const triggerFileInput = () => {
      if (!uploading.value) {
        fileInput.value?.click()
      }
    }
    
    const validateFile = (fileObj) => {
      error.value = ''
      
      if (props.accept) {
        const acceptedTypes = props.accept.split(',').map(t => t.trim())
        const fileExt = '.' + fileObj.name.split('.').pop().toLowerCase()
        const isValidType = acceptedTypes.some(type => {
          return fileObj.type.match(type.replace('*', '.*')) || fileExt === type
        })
        
        if (!isValidType) {
          error.value = `Format file tidak didukung. Gunakan: ${props.accept}`
          emit('error', error.value)
          return false
        }
      }
      
      if (fileObj.size > props.maxSize) {
        error.value = `Ukuran file terlalu besar. Maksimal: ${formatFileSize(props.maxSize)}`
        emit('error', error.value)
        return false
      }
      
      return true
    }
    
    const handleFileSelect = (event) => {
      const selectedFile = event.target.files[0]
      if (selectedFile && validateFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
    
    const handleDrop = (event) => {
      isDragover.value = false
      const droppedFile = event.dataTransfer.files[0]
      if (droppedFile && validateFile(droppedFile)) {
        setFile(droppedFile)
      }
    }
    
    const setFile = (fileObj) => {
      file.value = fileObj
      emit('update:modelValue', fileObj)
      
      if (fileObj.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          filePreview.value = e.target.result
        }
        reader.readAsDataURL(fileObj)
      }
      
      if (props.autoUpload) {
        startUpload()
      }
    }
    
    const removeFile = () => {
      file.value = null
      filePreview.value = ''
      error.value = ''
      progress.value = 0
      uploading.value = false
      emit('update:modelValue', null)
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
    
    const startUpload = async () => {
      if (!file.value) return
      
      uploading.value = true
      progress.value = 0
      
      const formData = new FormData()
      formData.append('file', file.value)
      
      // Simulate upload progress
      const interval = setInterval(() => {
        if (progress.value < 90) {
          progress.value += Math.random() * 10
        }
      }, 200)
      
      emit('upload', formData, {
        onProgress: (p) => {
          progress.value = p
        },
        onSuccess: () => {
          clearInterval(interval)
          progress.value = 100
          uploading.value = false
        },
        onError: (err) => {
          clearInterval(interval)
          error.value = err
          uploading.value = false
          emit('error', err)
        }
      })
    }
    
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    watch(() => props.modelValue, (newVal) => {
      if (newVal !== file.value) {
        if (newVal) {
          setFile(newVal)
        } else {
          removeFile()
        }
      }
    })
    
    return {
      fileInput,
      file,
      filePreview,
      isDragover,
      uploading,
      progress,
      error,
      isImage,
      isPDF,
      triggerFileInput,
      handleFileSelect,
      handleDrop,
      removeFile,
      formatFileSize
    }
  }
}
</script>

<style lang="scss" scoped>
.file-uploader {
  width: 100%;
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--bg-tertiary);
  
  &:hover {
    border-color: var(--color-primary);
    background: var(--bg-hover);
  }
  
  &.upload-dragover {
    border-color: var(--color-primary);
    background: var(--bg-active);
    transform: scale(1.01);
  }
  
  &.upload-has-file {
    border-style: solid;
    border-color: var(--color-success);
    background: var(--bg-card);
    padding: 16px;
  }
  
  &.upload-error {
    border-color: var(--color-danger);
    background: #FFF5F5;
  }
}

.file-input-hidden {
  display: none;
}

.upload-placeholder {
  .upload-icon {
    font-size: 48px;
    display: block;
    margin-bottom: 16px;
  }
  
  .upload-text {
    font-size: 0.9375rem;
    color: var(--text-primary);
    margin-bottom: 8px;
    
    strong {
      color: var(--color-primary);
    }
  }
  
  .upload-hint {
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin: 4px 0;
  }
}

.upload-file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  text-align: left;
}

.file-preview {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .file-type-icon {
    font-size: 32px;
  }
}

.file-details {
  flex: 1;
  min-width: 0;
  
  .file-name {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }
  
  .file-size {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
}

.file-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  font-size: 18px;
  padding: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  
  &:hover {
    background: var(--bg-hover);
    color: var(--color-danger);
  }
}

.upload-progress {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  .progress-bar {
    flex: 1;
    height: 6px;
    background: var(--border-color);
    border-radius: var(--radius-full);
    overflow: hidden;
    
    .progress-fill {
      height: 100%;
      background: var(--color-primary);
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }
  }
  
  .progress-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-primary);
  }
}

.upload-error-text {
  margin-top: 8px;
  font-size: 0.75rem;
  color: var(--color-danger);
}
</style>
