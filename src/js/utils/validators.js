/**
 * ============================================
 * VALIDATORS - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL FORM VALIDATION UTILITIES - SIAP PRODUKSI
 * Mendukung: 30+ Validators, DOM Integration,
 * Presets, Custom Rules, Cross-field Validation
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

const Validators = {
  // ============================================
  // REQUIRED & PRESENCE
  // ============================================
  required(value, message = 'Field ini wajib diisi') {
    if (value === undefined || value === null || value === '') return message;
    if (typeof value === 'string' && value.trim() === '') return message;
    if (Array.isArray(value) && value.length === 0) return message;
    return null;
  },

  requiredIf(value, targetValue, targetField, message) {
    const targetEl = document.querySelector(`[name="${targetField}"]`);
    const target = targetEl?.type === 'checkbox' ? targetEl.checked : targetEl?.value;
    if (target === targetValue && (!value || (typeof value === 'string' && !value.trim()))) {
      return message || 'Field ini wajib diisi';
    }
    return null;
  },

  // ============================================
  // LENGTH VALIDATION
  // ============================================
  minLength(value, min, message) {
    if (!value) return null;
    if (String(value).length < min) return message || `Minimal ${min} karakter`;
    return null;
  },

  maxLength(value, max, message) {
    if (!value) return null;
    if (String(value).length > max) return message || `Maksimal ${max} karakter`;
    return null;
  },

  lengthBetween(value, min, max, message) {
    if (!value) return null;
    const len = String(value).length;
    if (len < min || len > max) return message || `Harus ${min}-${max} karakter`;
    return null;
  },

  exactLength(value, length, message) {
    if (!value) return null;
    if (String(value).length !== length) return message || `Harus tepat ${length} karakter`;
    return null;
  },

  // ============================================
  // NUMERIC VALIDATION
  // ============================================
  number(value, message = 'Harus berupa angka') {
    if (value === '' || value === null || value === undefined) return null;
    if (isNaN(Number(value))) return message;
    return null;
  },

  integer(value, message = 'Harus bilangan bulat') {
    if (value === '' || value === null || value === undefined) return null;
    if (!Number.isInteger(Number(value))) return message;
    return null;
  },

  min(value, min, message) {
    if (value === '' || value === null || value === undefined) return null;
    if (Number(value) < min) return message || `Minimal ${min}`;
    return null;
  },

  max(value, max, message) {
    if (value === '' || value === null || value === undefined) return null;
    if (Number(value) > max) return message || `Maksimal ${max}`;
    return null;
  },

  numberBetween(value, min, max, message) {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) return message || `Harus ${min}-${max}`;
    return null;
  },

  positive(value, message = 'Harus bernilai positif') {
    if (value === '' || value === null || value === undefined) return null;
    if (Number(value) <= 0) return message;
    return null;
  },

  // ============================================
  // FORMAT VALIDATION
  // ============================================
  email(value, message = 'Email tidak valid') {
    if (!value) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return message;
    return null;
  },

  phone(value, message = 'Nomor telepon tidak valid') {
    if (!value) return null;
    const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
    if (!/^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(cleaned)) return message;
    return null;
  },

  nip(value, message = 'NIP tidak valid (18 digit)') {
    if (!value) return null;
    if (!/^\d{18}$/.test(value.replace(/[\s.-]/g, ''))) return message;
    return null;
  },

  url(value, message = 'URL tidak valid') {
    if (!value) return null;
    try { new URL(value); return null; }
    catch { return message; }
  },

  pattern(value, pattern, message = 'Format tidak valid') {
    if (!value) return null;
    if (!pattern.test(value)) return message;
    return null;
  },

  alphanumeric(value, message = 'Hanya huruf dan angka') {
    if (!value) return null;
    if (!/^[a-zA-Z0-9]+$/.test(value)) return message;
    return null;
  },

  alpha(value, message = 'Hanya huruf') {
    if (!value) return null;
    if (!/^[a-zA-Z]+$/.test(value)) return message;
    return null;
  },

  color(value, message = 'Format warna tidak valid') {
    if (!value) return null;
    if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)) return message;
    return null;
  },

  // ============================================
  // DATE VALIDATION
  // ============================================
  date(value, message = 'Tanggal tidak valid') {
    if (!value) return null;
    if (isNaN(new Date(value).getTime())) return message;
    return null;
  },

  notFuture(value, message = 'Tanggal tidak boleh di masa depan') {
    if (!value) return null;
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    if (date > new Date()) return message;
    return null;
  },

  notPast(value, message = 'Tanggal tidak boleh di masa lalu') {
    if (!value) return null;
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return message;
    return null;
  },

  dateBefore(value, compareDate, message) {
    if (!value) return null;
    if (new Date(value) >= new Date(compareDate)) return message || `Harus sebelum ${compareDate}`;
    return null;
  },

  dateAfter(value, compareDate, message) {
    if (!value) return null;
    if (new Date(value) < new Date(compareDate)) return message || `Harus setelah ${compareDate}`;
    return null;
  },

  dateRange(startDate, endDate, message = 'Tanggal akhir harus setelah tanggal mulai') {
    if (!startDate || !endDate) return null;
    if (new Date(endDate) < new Date(startDate)) return message;
    return null;
  },

  // ============================================
  // FILE VALIDATION
  // ============================================
  fileSize(file, maxSize, message) {
    if (!file) return null;
    if (file.size > maxSize) {
      const units = ['B', 'KB', 'MB', 'GB'];
      const k = 1024;
      const i = Math.floor(Math.log(maxSize) / Math.log(k));
      const sizeStr = (maxSize / Math.pow(k, i)).toFixed(1) + ' ' + units[i];
      return message || `Ukuran file maksimal ${sizeStr}`;
    }
    return null;
  },

  fileType(file, allowedTypes, message) {
    if (!file) return null;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const allowed = allowedTypes.map(t => t.toLowerCase());
    if (!allowed.includes(file.type.toLowerCase()) && !allowed.includes(ext)) {
      return message || `Tipe file tidak didukung. Format: ${allowedTypes.join(', ')}`;
    }
    return null;
  },

  fileCount(files, maxCount, message) {
    if (!files) return null;
    const count = Array.isArray(files) ? files.length : (files instanceof FileList ? files.length : 1);
    if (count > maxCount) return message || `Maksimal ${maxCount} file`;
    return null;
  },

  // ============================================
  // PASSWORD VALIDATION
  // ============================================
  passwordStrength(value, minStrength = 3, message) {
    if (!value) return null;
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) score++;
    if (score < minStrength) {
      return message || 'Password terlalu lemah. Minimal 8 karakter dengan huruf besar, kecil, dan angka.';
    }
    return null;
  },

  confirmPassword(value, confirmValue, message = 'Password tidak cocok') {
    if (!value || !confirmValue) return null;
    if (value !== confirmValue) return message;
    return null;
  },

  // ============================================
  // COMPARISON VALIDATION
  // ============================================
  inList(value, list, message = 'Nilai tidak valid') {
    if (!value) return null;
    if (!list.includes(value)) return message;
    return null;
  },

  notInList(value, list, message = 'Nilai sudah ada') {
    if (!value) return null;
    if (list.includes(value)) return message;
    return null;
  },

  same(value, compareValue, message = 'Nilai tidak sama') {
    if (!value && !compareValue) return null;
    if (value !== compareValue) return message;
    return null;
  },

  different(value, compareValue, message = 'Nilai tidak boleh sama') {
    if (value === compareValue) return message;
    return null;
  },

  // ============================================
  // OTHER VALIDATORS
  // ============================================
  json(value, message = 'Format JSON tidak valid') {
    if (!value) return null;
    try { JSON.parse(value); return null; }
    catch { return message; }
  },

  base64(value, message = 'Format Base64 tidak valid') {
    if (!value) return null;
    try { atob(value); return null; }
    catch { return message; }
  },

  /**
   * Validate entire form data object against rules
   * @returns {{ valid: boolean, errors: object }}
   */
  validateForm(formData, rules) {
    const errors = {};
    for (const [field, fieldRules] of Object.entries(rules)) {
      for (const rule of fieldRules) {
        const error = typeof rule === 'function'
          ? rule(formData[field], formData)
          : this[rule.validator](
              formData[field],
              ...(rule.params || []),
              rule.message
            );
        if (error) { errors[field] = error; break; }
      }
    }
    return { valid: Object.keys(errors).length === 0, errors };
  },

  /**
   * Validate a single value against rules
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

  // ============================================
  // DOM HELPERS
  // ============================================
  showFieldError(fieldName, error) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;
    field.classList.add('form-input--error');
    field.setAttribute('aria-invalid', 'true');
    let errorEl = field.closest('.form-field')?.querySelector('.form-helper--error');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'form-helper form-helper--error';
      (field.closest('.form-field') || field.parentElement).appendChild(errorEl);
    }
    errorEl.textContent = error;
  },

  clearFieldError(fieldName) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;
    field.classList.remove('form-input--error');
    field.removeAttribute('aria-invalid');
    const errorEl = field.closest('.form-field')?.querySelector('.form-helper--error');
    if (errorEl) errorEl.remove();
  },

  showFormErrors(errors) {
    Object.entries(errors).forEach(([field, error]) => this.showFieldError(field, error));
    const first = document.querySelector(`[name="${Object.keys(errors)[0]}"]`);
    if (first) { first.focus(); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  },

  clearFormErrors(formElement) {
    formElement.querySelectorAll('.form-input--error').forEach(f => {
      f.classList.remove('form-input--error');
      f.removeAttribute('aria-invalid');
    });
    formElement.querySelectorAll('.form-helper--error').forEach(e => e.remove());
  },

  // ============================================
  // PRESETS
  // ============================================
  presets: {
    username: [
      { validator: 'required', message: 'Username wajib diisi' },
      { validator: 'minLength', params: [3], message: 'Minimal 3 karakter' },
      { validator: 'maxLength', params: [50], message: 'Maksimal 50 karakter' },
      { validator: 'alphanumeric', message: 'Hanya huruf dan angka' }
    ],
    password: [
      { validator: 'required', message: 'Password wajib diisi' },
      { validator: 'minLength', params: [8], message: 'Minimal 8 karakter' },
      { validator: 'passwordStrength', params: [3] }
    ],
    email: [
      { validator: 'required', message: 'Email wajib diisi' },
      { validator: 'email' }
    ],
    namaLengkap: [
      { validator: 'required', message: 'Nama lengkap wajib diisi' },
      { validator: 'minLength', params: [3], message: 'Minimal 3 karakter' },
      { validator: 'maxLength', params: [100], message: 'Maksimal 100 karakter' }
    ],
    nip: [{ validator: 'nip' }],
    nomorSurat: [
      { validator: 'required', message: 'Nomor surat wajib diisi' },
      { validator: 'maxLength', params: [100] }
    ],
    perihal: [
      { validator: 'required', message: 'Perihal wajib diisi' },
      { validator: 'minLength', params: [5], message: 'Minimal 5 karakter' },
      { validator: 'maxLength', params: [500], message: 'Maksimal 500 karakter' }
    ],
    instruksi: [
      { validator: 'required', message: 'Instruksi wajib diisi' },
      { validator: 'minLength', params: [10], message: 'Minimal 10 karakter' }
    ],
    pengirim: [
      { validator: 'required', message: 'Pengirim wajib diisi' },
      { validator: 'maxLength', params: [200] }
    ],
    tujuan: [
      { validator: 'required', message: 'Tujuan wajib diisi' },
      { validator: 'maxLength', params: [200] }
    ],
    tanggal: [
      { validator: 'required', message: 'Tanggal wajib diisi' },
      { validator: 'date' }
    ],
    phone: [
      { validator: 'phone' }
    ],
    url: [
      { validator: 'url' }
    ]
  }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Validators };
}
