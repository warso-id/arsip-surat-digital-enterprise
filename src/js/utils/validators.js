/**
 * VALIDATORS - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Form validation utilities
 */

const Validators = {
  /**
   * Required field
   */
  required(value, message = 'Field ini wajib diisi') {
    if (value === undefined || value === null || value === '') {
      return message;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return message;
    }
    return null;
  },
  
  /**
   * Minimum length
   */
  minLength(value, min, message) {
    if (!value) return null;
    if (value.length < min) {
      return message || `Minimal ${min} karakter`;
    }
    return null;
  },
  
  /**
   * Maximum length
   */
  maxLength(value, max, message) {
    if (!value) return null;
    if (value.length > max) {
      return message || `Maksimal ${max} karakter`;
    }
    return null;
  },
  
  /**
   * Length range
   */
  lengthBetween(value, min, max, message) {
    if (!value) return null;
    if (value.length < min || value.length > max) {
      return message || `Harus antara ${min}-${max} karakter`;
    }
    return null;
  },
  
  /**
   * Valid email
   */
  email(value, message = 'Email tidak valid') {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return message;
    }
    return null;
  },
  
  /**
   * Valid phone number (Indonesia)
   */
  phone(value, message = 'Nomor telepon tidak valid') {
    if (!value) return null;
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
    if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
      return message;
    }
    return null;
  },
  
  /**
   * Valid NIP (18 digits)
   */
  nip(value, message = 'NIP tidak valid (18 digit)') {
    if (!value) return null;
    const nipRegex = /^\d{18}$/;
    if (!nipRegex.test(value.replace(/[\s.-]/g, ''))) {
      return message;
    }
    return null;
  },
  
  /**
   * Valid date
   */
  date(value, message = 'Tanggal tidak valid') {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return message;
    }
    return null;
  },
  
  /**
   * Date is not in the future
   */
  notFuture(value, message = 'Tanggal tidak boleh di masa depan') {
    if (!value) return null;
    const date = new Date(value);
    if (date > new Date()) {
      return message;
    }
    return null;
  },
  
  /**
   * Date is not in the past
   */
  notPast(value, message = 'Tanggal tidak boleh di masa lalu') {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return message;
    }
    return null;
  },
  
  /**
   * Date range valid
   */
  dateRange(startDate, endDate, message = 'Tanggal akhir harus setelah tanggal mulai') {
    if (!startDate || !endDate) return null;
    if (new Date(endDate) < new Date(startDate)) {
      return message;
    }
    return null;
  },
  
  /**
   * Valid number
   */
  number(value, message = 'Harus berupa angka') {
    if (!value) return null;
    if (isNaN(Number(value))) {
      return message;
    }
    return null;
  },
  
  /**
   * Number range
   */
  numberBetween(value, min, max, message) {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      return message || `Harus antara ${min}-${max}`;
    }
    return null;
  },
  
  /**
   * Valid URL
   */
  url(value, message = 'URL tidak valid') {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return message;
    }
  },
  
  /**
   * Valid file size
   */
  fileSize(file, maxSize, message) {
    if (!file) return null;
    if (file.size > maxSize) {
      return message || `Ukuran file maksimal ${FileService.formatSize(maxSize)}`;
    }
    return null;
  },
  
  /**
   * Valid file type
   */
  fileType(file, allowedTypes, message) {
    if (!file) return null;
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(file.type) && !allowedTypes.includes(extension)) {
      return message || `Tipe file tidak didukung. Format: ${allowedTypes.join(', ')}`;
    }
    return null;
  },
  
  /**
   * Password strength
   */
  passwordStrength(value, message) {
    if (!value) return null;
    
    const checks = {
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
    };
    
    const strength = Object.values(checks).filter(Boolean).length;
    
    if (strength < 3) {
      return message || 'Password terlalu lemah. Gunakan minimal 8 karakter dengan kombinasi huruf besar, kecil, dan angka.';
    }
    
    return null;
  },
  
  /**
   * Confirm password
   */
  confirmPassword(value, confirmValue, message = 'Password tidak cocok') {
    if (!value || !confirmValue) return null;
    if (value !== confirmValue) {
      return message;
    }
    return null;
  },
  
  /**
   * Valid JSON
   */
  json(value, message = 'Format JSON tidak valid') {
    if (!value) return null;
    try {
      JSON.parse(value);
      return null;
    } catch {
      return message;
    }
  },
  
  /**
   * Regex match
   */
  pattern(value, pattern, message = 'Format tidak valid') {
    if (!value) return null;
    if (!pattern.test(value)) {
      return message;
    }
    return null;
  },
  
  /**
   * Value in list
   */
  inList(value, list, message = 'Nilai tidak valid') {
    if (!value) return null;
    if (!list.includes(value)) {
      return message;
    }
    return null;
  },
  
  /**
   * Validate form
   */
  validateForm(formData, rules) {
    const errors = {};
    
    Object.entries(rules).forEach(([field, fieldRules]) => {
      const value = formData[field];
      
      for (const rule of fieldRules) {
        const error = typeof rule === 'function' 
          ? rule(value)
          : this[rule.validator](value, ...(rule.params || []), rule.message);
        
        if (error) {
          errors[field] = error;
          break;
        }
      }
    });
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  },
  
  /**
   * Validate single field
   */
  validateField(value, rules) {
    for (const rule of rules) {
      const error = typeof rule === 'function'
        ? rule(value)
        : this[rule.validator](value, ...(rule.params || []), rule.message);
      
      if (error) return error;
    }
    
    return null;
  },
  
  /**
   * Show field error
   */
  showFieldError(fieldName, error) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;
    
    field.classList.add('form-input--error');
    
    // Add or update error message
    let errorEl = field.parentElement.querySelector('.form-helper--error');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'form-helper form-helper--error';
      field.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = error;
  },
  
  /**
   * Clear field error
   */
  clearFieldError(fieldName) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;
    
    field.classList.remove('form-input--error');
    
    const errorEl = field.parentElement.querySelector('.form-helper--error');
    if (errorEl) errorEl.remove();
  },
  
  /**
   * Show form errors
   */
  showFormErrors(errors) {
    Object.entries(errors).forEach(([field, error]) => {
      this.showFieldError(field, error);
    });
    
    // Focus first error field
    const firstErrorField = document.querySelector(`[name="${Object.keys(errors)[0]}"]`);
    if (firstErrorField) firstErrorField.focus();
  },
  
  /**
   * Clear all form errors
   */
  clearFormErrors(form) {
    const fields = form.querySelectorAll('.form-input--error');
    fields.forEach(field => {
      field.classList.remove('form-input--error');
      const errorEl = field.parentElement.querySelector('.form-helper--error');
      if (errorEl) errorEl.remove();
    });
  },
  
  /**
   * Common validation presets
   */
  presets: {
    username: [
      { validator: 'required', message: 'Username wajib diisi' },
      { validator: 'minLength', params: [3], message: 'Username minimal 3 karakter' },
      { validator: 'maxLength', params: [50], message: 'Username maksimal 50 karakter' },
      { validator: 'pattern', params: [/^[a-zA-Z0-9_]+$/], message: 'Username hanya boleh huruf, angka, dan underscore' }
    ],
    
    password: [
      { validator: 'required', message: 'Password wajib diisi' },
      { validator: 'minLength', params: [8], message: 'Password minimal 8 karakter' },
      { validator: 'passwordStrength' }
    ],
    
    email: [
      { validator: 'required', message: 'Email wajib diisi' },
      { validator: 'email' }
    ],
    
    namaLengkap: [
      { validator: 'required', message: 'Nama lengkap wajib diisi' },
      { validator: 'minLength', params: [3], message: 'Nama minimal 3 karakter' }
    ],
    
    nip: [
      { validator: 'nip' }
    ],
    
    nomorSurat: [
      { validator: 'required', message: 'Nomor surat wajib diisi' }
    ],
    
    perihal: [
      { validator: 'required', message: 'Perihal wajib diisi' },
      { validator: 'minLength', params: [5], message: 'Perihal minimal 5 karakter' }
    ],
    
    instruksi: [
      { validator: 'required', message: 'Instruksi wajib diisi' },
      { validator: 'minLength', params: [10], message: 'Instruksi minimal 10 karakter' }
    ]
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Validators };
}
