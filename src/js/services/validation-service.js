/**
 * ============================================
 * VALIDATION SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL FORM & DATA VALIDATION - SIAP PRODUKSI
 * Mendukung: 30+ Rules, Custom Rules, Presets,
 * Real-time, Async, Nested, Conditional
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class ValidationService {
  constructor() {
    this.rules = {};
    this.customRules = {};
    this.errorMessages = {};
    this.locale = 'id';
    this.presets = {};
    this.validatingFields = new Set();
  }

  /**
   * Initialize validation service
   */
  init() {
    this.registerDefaultRules();
    this.registerDefaultPresets();
    this.registerErrorMessages();
    console.log('✅ Validation Service initialized');
  }

  /**
   * Register default validation rules
   */
  registerDefaultRules() {
    this.rules = {
      // === Required ===
      required: (value, params, message) => {
        if (value === undefined || value === null || value === '') return message || 'Field ini wajib diisi';
        if (typeof value === 'string' && value.trim() === '') return message || 'Field ini wajib diisi';
        if (Array.isArray(value) && value.length === 0) return message || 'Pilih minimal satu item';
        return null;
      },

      requiredIf: (value, params, message) => {
        const [targetField, targetValue] = params;
        const targetEl = document.querySelector(`[name="${targetField}"]`);
        const targetVal = targetEl?.type === 'checkbox' ? targetEl.checked : targetEl?.value;
        if (targetVal === targetValue && (!value || (typeof value === 'string' && !value.trim()))) {
          return message || 'Field ini wajib diisi';
        }
        return null;
      },

      // === Length ===
      minLength: (value, params, message) => {
        if (!value) return null;
        if (String(value).length < params[0]) return message || `Minimal ${params[0]} karakter`;
        return null;
      },
      maxLength: (value, params, message) => {
        if (!value) return null;
        if (String(value).length > params[0]) return message || `Maksimal ${params[0]} karakter`;
        return null;
      },
      lengthBetween: (value, params, message) => {
        if (!value) return null;
        const len = String(value).length;
        if (len < params[0] || len > params[1]) return message || `Harus ${params[0]}-${params[1]} karakter`;
        return null;
      },
      exactLength: (value, params, message) => {
        if (!value) return null;
        if (String(value).length !== params[0]) return message || `Harus tepat ${params[0]} karakter`;
        return null;
      },

      // === Numeric ===
      min: (value, params, message) => {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        if (isNaN(num) || num < params[0]) return message || `Minimal ${params[0]}`;
        return null;
      },
      max: (value, params, message) => {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        if (isNaN(num) || num > params[0]) return message || `Maksimal ${params[0]}`;
        return null;
      },
      between: (value, params, message) => {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        if (isNaN(num) || num < params[0] || num > params[1]) return message || `Harus ${params[0]}-${params[1]}`;
        return null;
      },
      number: (value, params, message) => {
        if (value === '' || value === null || value === undefined) return null;
        if (isNaN(Number(value))) return message || 'Harus berupa angka';
        return null;
      },
      integer: (value, params, message) => {
        if (value === '' || value === null || value === undefined) return null;
        if (!Number.isInteger(Number(value))) return message || 'Harus berupa bilangan bulat';
        return null;
      },
      positive: (value, params, message) => {
        if (value === '' || value === null || value === undefined) return null;
        if (Number(value) <= 0) return message || 'Harus bernilai positif';
        return null;
      },

      // === Format ===
      email: (value, params, message) => {
        if (!value) return null;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return message || 'Email tidak valid';
        return null;
      },
      phone: (value, params, message) => {
        if (!value) return null;
        const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
        if (!/^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(cleaned)) return message || 'Nomor telepon tidak valid';
        return null;
      },
      nip: (value, params, message) => {
        if (!value) return null;
        if (!/^\d{18}$/.test(value.replace(/[\s.-]/g, ''))) return message || 'NIP harus 18 digit';
        return null;
      },
      url: (value, params, message) => {
        if (!value) return null;
        try { new URL(value); return null; } catch { return message || 'URL tidak valid'; }
      },
      pattern: (value, params, message) => {
        if (!value) return null;
        if (!params[0].test(value)) return message || 'Format tidak valid';
        return null;
      },
      alphanumeric: (value, params, message) => {
        if (!value) return null;
        if (!/^[a-zA-Z0-9]+$/.test(value)) return message || 'Hanya huruf dan angka';
        return null;
      },
      alpha: (value, params, message) => {
        if (!value) return null;
        if (!/^[a-zA-Z]+$/.test(value)) return message || 'Hanya huruf';
        return null;
      },

      // === Date ===
      date: (value, params, message) => {
        if (!value) return null;
        if (isNaN(new Date(value).getTime())) return message || 'Tanggal tidak valid';
        return null;
      },
      dateBefore: (value, params, message) => {
        if (!value) return null;
        const date = new Date(value);
        const compareDate = params[0] ? new Date(params[0]) : new Date();
        if (date >= compareDate) return message || `Harus sebelum ${params[0] || 'hari ini'}`;
        return null;
      },
      dateAfter: (value, params, message) => {
        if (!value) return null;
        const date = new Date(value);
        const compareDate = params[0] ? new Date(params[0]) : new Date();
        compareDate.setHours(0, 0, 0, 0);
        if (date < compareDate) return message || `Harus setelah ${params[0] || 'hari ini'}`;
        return null;
      },
      dateBetween: (value, params, message) => {
        if (!value) return null;
        const date = new Date(value);
        const start = new Date(params[0]);
        const end = new Date(params[1]);
        if (date < start || date > end) return message || `Harus antara ${params[0]} dan ${params[1]}`;
        return null;
      },

      // === Comparison ===
      same: (value, params, message) => {
        if (!value && !params[0]) return null;
        if (value !== params[0]) return message || 'Nilai tidak sama';
        return null;
      },
      different: (value, params, message) => {
        if (value === params[0]) return message || 'Nilai tidak boleh sama';
        return null;
      },
      inList: (value, params, message) => {
        if (!value) return null;
        if (!params.includes(value)) return message || 'Nilai tidak valid';
        return null;
      },
      notInList: (value, params, message) => {
        if (!value) return null;
        if (params.includes(value)) return message || 'Nilai sudah ada';
        return null;
      },

      // === File ===
      fileSize: (value, params, message) => {
        if (!value) return null;
        if (value.size > params[0]) {
          return message || `Ukuran file maksimal ${this.formatSize(params[0])}`;
        }
        return null;
      },
      fileType: (value, params, message) => {
        if (!value) return null;
        const ext = '.' + value.name.split('.').pop().toLowerCase();
        const allowed = params.map(t => t.toLowerCase());
        if (!allowed.includes(value.type) && !allowed.includes(ext)) {
          return message || 'Tipe file tidak didukung';
        }
        return null;
      },
      fileCount: (value, params, message) => {
        if (!value) return null;
        const files = Array.isArray(value) ? value : [value];
        if (files.length > params[0]) return message || `Maksimal ${params[0]} file`;
        return null;
      },
      imageDimensions: (value, params, message) => {
        if (!value) return null;
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const [minW, minH, maxW, maxH] = params;
            if (img.width < minW || img.height < minH) {
              resolve(message || `Dimensi minimal ${minW}x${minH}px`);
            } else if (maxW && maxH && (img.width > maxW || img.height > maxH)) {
              resolve(message || `Dimensi maksimal ${maxW}x${maxH}px`);
            } else {
              resolve(null);
            }
          };
          img.onerror = () => resolve('Gagal membaca gambar');
          img.src = URL.createObjectURL(value);
        });
      },

      // === Password ===
      password: (value, params, message) => {
        if (!value) return null;
        const strength = this.calculatePasswordStrength(value);
        if (strength < (params[0] || 3)) {
          return message || 'Password terlalu lemah. Gunakan minimal 8 karakter dengan kombinasi huruf besar, kecil, dan angka.';
        }
        return null;
      },
      passwordMatch: (value, params, message) => {
        if (!value) return null;
        if (value !== params[0]) return message || 'Password tidak cocok';
        return null;
      },

      // === Custom ===
      unique: (value, params, message) => {
        if (!value) return null;
        const [existingValues, excludeIndex] = params;
        const exists = existingValues.some((v, i) => i !== excludeIndex && v === value);
        if (exists) return message || 'Nilai sudah digunakan';
        return null;
      },
      json: (value, params, message) => {
        if (!value) return null;
        try { JSON.parse(value); return null; } catch { return message || 'Format JSON tidak valid'; }
      },
      color: (value, params, message) => {
        if (!value) return null;
        if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)) {
          return message || 'Warna tidak valid (format hex)';
        }
        return null;
      },
    };
  }

  /**
   * Register default presets
   */
  registerDefaultPresets() {
    this.presets = {
      login: {
        username: ['required'],
        password: ['required']
      },
      register: {
        username: ['required', { rule: 'minLength', params: [3] }, { rule: 'alphanumeric' }],
        password: ['required', { rule: 'password', params: [3] }],
        email: ['required', 'email'],
        namaLengkap: ['required', { rule: 'minLength', params: [3] }]
      },
      changePassword: {
        oldPassword: ['required'],
        newPassword: ['required', { rule: 'password', params: [3] }],
        confirmPassword: ['required', { rule: 'passwordMatch', params: [] }]
      },
      suratMasuk: {
        nomorSurat: [{ rule: 'maxLength', params: [100] }],
        tanggalSurat: ['required', 'date'],
        tanggalTerima: ['date'],
        pengirim: ['required', { rule: 'maxLength', params: [200] }],
        perihal: ['required', { rule: 'minLength', params: [5] }, { rule: 'maxLength', params: [500] }]
      },
      suratKeluar: {
        tujuan: ['required', { rule: 'maxLength', params: [200] }],
        perihal: ['required', { rule: 'minLength', params: [5] }, { rule: 'maxLength', params: [500] }],
        tanggalSurat: ['required', 'date'],
        nomorSurat: [{ rule: 'maxLength', params: [100] }]
      },
      disposisi: {
        instruksi: ['required', { rule: 'minLength', params: [10] }],
        batasWaktu: ['date', 'dateAfter'],
        kepadaUserId: ['required']
      },
      userCreate: {
        username: ['required', { rule: 'minLength', params: [3] }, { rule: 'alphanumeric' }],
        password: ['required', { rule: 'password', params: [3] }],
        namaLengkap: ['required'],
        email: ['email'],
        nip: ['nip']
      },
      userProfile: {
        namaLengkap: ['required'],
        email: ['email'],
        nip: ['nip'],
        phone: ['phone']
      }
    };
  }

  /**
   * Register error messages (localized)
   */
  registerErrorMessages() {
    this.errorMessages = {
      id: {
        required: 'Field ini wajib diisi',
        email: 'Format email tidak valid',
        phone: 'Format nomor telepon tidak valid',
        nip: 'NIP harus 18 digit angka',
        minLength: 'Minimal {0} karakter',
        maxLength: 'Maksimal {0} karakter',
        password: 'Password terlalu lemah',
        date: 'Format tanggal tidak valid',
        url: 'URL tidak valid',
        number: 'Harus berupa angka',
        fileSize: 'Ukuran file maksimal {0}',
        fileType: 'Tipe file tidak didukung'
      },
      en: {
        required: 'This field is required',
        email: 'Invalid email format',
        phone: 'Invalid phone number',
        nip: 'NIP must be 18 digits',
        minLength: 'Minimum {0} characters',
        maxLength: 'Maximum {0} characters',
        password: 'Password is too weak',
        date: 'Invalid date format',
        url: 'Invalid URL',
        number: 'Must be a number',
        fileSize: 'Maximum file size is {0}',
        fileType: 'File type not supported'
      }
    };
  }

  /**
   * Register custom rule
   */
  registerRule(name, validator) {
    this.customRules[name] = validator;
  }

  /**
   * Register custom preset
   */
  registerPreset(name, rules) {
    this.presets[name] = rules;
  }

  /**
   * Validate single value against rules
   */
  async validate(value, rules, context = {}) {
    if (!rules || !Array.isArray(rules)) return null;

    for (const rule of rules) {
      let validator, params = [], message = null;

      if (typeof rule === 'string') {
        validator = this.rules[rule] || this.customRules[rule];
      } else if (typeof rule === 'function') {
        validator = rule;
      } else if (typeof rule === 'object') {
        validator = this.rules[rule.rule] || this.customRules[rule.rule];
        params = rule.params || [];
        message = rule.message || null;
      }

      if (!validator) {
        console.warn(`Validation rule not found: ${rule.rule || rule}`);
        continue;
      }

      try {
        const error = await validator(value, params, message, context);
        if (error) return error;
      } catch (e) {
        console.error(`Validation error for rule:`, rule, e);
        return 'Validation error';
      }
    }

    return null;
  }

  /**
   * Validate entire form data
   */
  async validateForm(formData, rules, options = {}) {
    const { stopOnFirst = false, context = {} } = options;
    const errors = {};
    let isValid = true;

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = formData[field];
      const error = await this.validate(value, fieldRules, { ...context, field, formData });

      if (error) {
        errors[field] = error;
        isValid = false;
        if (stopOnFirst) break;
      }
    }

    return { isValid, errors };
  }

  /**
   * Validate a DOM form element
   */
  async validateFormElement(formElement, rules, options = {}) {
    const formData = this.extractFormData(formElement);
    const result = await this.validateForm(formData, rules, options);
    
    if (!result.isValid) {
      this.showErrors(formElement, result.errors);
    } else {
      this.clearErrors(formElement);
    }

    return result;
  }

  /**
   * Validate a single field in real-time
   */
  async validateField(formElement, fieldName, rules) {
    if (this.validatingFields.has(fieldName)) return null;
    this.validatingFields.add(fieldName);

    const input = formElement.querySelector(`[name="${fieldName}"]`);
    if (!input) return null;

    let value;
    if (input.type === 'checkbox') value = input.checked;
    else if (input.type === 'file') value = input.files?.[0];
    else value = input.value;

    const error = await this.validate(value, rules);
    this.validatingFields.delete(fieldName);

    if (error) {
      this.showFieldError(input, error);
    } else {
      this.clearFieldError(input);
    }

    return error;
  }

  /**
   * Extract form data from DOM element
   */
  extractFormData(formElement) {
    const data = {};
    const elements = formElement.querySelectorAll('[name]');
    
    elements.forEach(el => {
      if (el.disabled) return;
      if (el.type === 'checkbox') data[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
      else if (el.type === 'file') data[el.name] = el.files?.[0] || (el.multiple ? Array.from(el.files) : null);
      else if (el.tagName === 'SELECT' && el.multiple) {
        data[el.name] = Array.from(el.selectedOptions).map(o => o.value);
      }
      else data[el.name] = el.value;
    });

    return data;
  }

  /**
   * Show validation errors on form
   */
  showErrors(formElement, errors) {
    this.clearErrors(formElement);

    Object.entries(errors).forEach(([field, error]) => {
      const input = formElement.querySelector(`[name="${field}"]`);
      if (input) this.showFieldError(input, error);
    });

    const firstError = formElement.querySelector('.form-input--error');
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Show error on single field
   */
  showFieldError(input, error) {
    input.classList.add('form-input--error');
    input.setAttribute('aria-invalid', 'true');

    const field = input.closest('.form-field') || input.parentElement;
    let errorEl = field.querySelector('.form-helper--error');

    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'form-helper form-helper--error';
      errorEl.style.animation = 'errorShake 0.4s ease-in-out';
      field.appendChild(errorEl);
    }

    errorEl.textContent = error;
  }

  /**
   * Clear errors on form
   */
  clearErrors(formElement) {
    formElement.querySelectorAll('.form-input--error').forEach(input => {
      input.classList.remove('form-input--error');
      input.removeAttribute('aria-invalid');
    });
    formElement.querySelectorAll('.form-helper--error').forEach(el => el.remove());
  }

  /**
   * Clear error on single field
   */
  clearFieldError(input) {
    input.classList.remove('form-input--error');
    input.removeAttribute('aria-invalid');
    
    const field = input.closest('.form-field') || input.parentElement;
    const errorEl = field.querySelector('.form-helper--error');
    if (errorEl) errorEl.remove();
  }

  /**
   * Calculate password strength (0-5)
   */
  calculatePasswordStrength(password) {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    return Math.min(score, 5);
  }

  /**
   * Get preset rules
   */
  getPreset(presetName) {
    return this.presets[presetName] || {};
  }

  /**
   * Get error message
   */
  getMessage(rule, params = []) {
    const messages = this.errorMessages[this.locale] || this.errorMessages.id;
    let msg = messages[rule] || `Validation failed: ${rule}`;
    params.forEach((p, i) => { msg = msg.replace(`{${i}}`, p); });
    return msg;
  }

  /**
   * Format file size
   */
  formatSize(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
  }

  /**
   * Set locale
   */
  setLocale(locale) {
    this.locale = locale;
  }
}

// Singleton instance
const ValidationService = new ValidationService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ValidationService };
}
