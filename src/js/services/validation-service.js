/**
 * VALIDATION SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Centralized form and data validation
 */

class ValidationService {
  constructor() {
    this.rules = {};
    this.customRules = {};
    this.errorMessages = {};
  }
  
  /**
   * Initialize validation service
   */
  init() {
    this.registerDefaultRules();
    console.log('✅ Validation Service initialized');
  }
  
  /**
   * Register default validation rules
   */
  registerDefaultRules() {
    this.rules = {
      required: (value, params, message) => {
        if (value === undefined || value === null || value === '') {
          return message || 'Field ini wajib diisi';
        }
        if (typeof value === 'string' && value.trim() === '') {
          return message || 'Field ini wajib diisi';
        }
        return null;
      },
      
      minLength: (value, params, message) => {
        if (!value) return null;
        if (value.length < params[0]) {
          return message || `Minimal ${params[0]} karakter`;
        }
        return null;
      },
      
      maxLength: (value, params, message) => {
        if (!value) return null;
        if (value.length > params[0]) {
          return message || `Maksimal ${params[0]} karakter`;
        }
        return null;
      },
      
      email: (value, params, message) => {
        if (!value) return null;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(value)) {
          return message || 'Email tidak valid';
        }
        return null;
      },
      
      phone: (value, params, message) => {
        if (!value) return null;
        const cleaned = value.replace(/[\s\-\(\)]/g, '');
        const regex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
        if (!regex.test(cleaned)) {
          return message || 'Nomor telepon tidak valid';
        }
        return null;
      },
      
      nip: (value, params, message) => {
        if (!value) return null;
        const cleaned = value.replace(/[\s.-]/g, '');
        if (!/^\d{18}$/.test(cleaned)) {
          return message || 'NIP harus 18 digit angka';
        }
        return null;
      },
      
      min: (value, params, message) => {
        if (!value) return null;
        const num = Number(value);
        if (isNaN(num) || num < params[0]) {
          return message || `Minimal ${params[0]}`;
        }
        return null;
      },
      
      max: (value, params, message) => {
        if (!value) return null;
        const num = Number(value);
        if (isNaN(num) || num > params[0]) {
          return message || `Maksimal ${params[0]}`;
        }
        return null;
      },
      
      between: (value, params, message) => {
        if (!value) return null;
        const num = Number(value);
        if (isNaN(num) || num < params[0] || num > params[1]) {
          return message || `Harus antara ${params[0]} dan ${params[1]}`;
        }
        return null;
      },
      
      pattern: (value, params, message) => {
        if (!value) return null;
        if (!params[0].test(value)) {
          return message || 'Format tidak valid';
        }
        return null;
      },
      
      inList: (value, params, message) => {
        if (!value) return null;
        if (!params.includes(value)) {
          return message || 'Nilai tidak valid';
        }
        return null;
      },
      
      url: (value, params, message) => {
        if (!value) return null;
        try {
          new URL(value);
          return null;
        } catch {
          return message || 'URL tidak valid';
        }
      },
      
      date: (value, params, message) => {
        if (!value) return null;
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return message || 'Tanggal tidak valid';
        }
        return null;
      },
      
      dateBefore: (value, params, message) => {
        if (!value) return null;
        const date = new Date(value);
        const compareDate = params[0] ? new Date(params[0]) : new Date();
        if (date >= compareDate) {
          return message || 'Tanggal harus sebelum ' + (params[0] || 'hari ini');
        }
        return null;
      },
      
      dateAfter: (value, params, message) => {
        if (!value) return null;
        const date = new Date(value);
        const compareDate = params[0] ? new Date(params[0]) : new Date();
        if (date <= compareDate) {
          return message || 'Tanggal harus setelah ' + (params[0] || 'hari ini');
        }
        return null;
      },
      
      fileSize: (value, params, message) => {
        if (!value) return null;
        const maxSize = params[0];
        if (value.size > maxSize) {
          return message || `Ukuran file maksimal ${FileService.formatSize(maxSize)}`;
        }
        return null;
      },
      
      fileType: (value, params, message) => {
        if (!value) return null;
        const allowedTypes = params;
        const ext = '.' + value.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(value.type) && !allowedTypes.includes(ext)) {
          return message || `Tipe file tidak didukung`;
        }
        return null;
      },
      
      password: (value, params, message) => {
        if (!value) return null;
        const checks = {
          length: value.length >= 8,
          uppercase: /[A-Z]/.test(value),
          lowercase: /[a-z]/.test(value),
          number: /[0-9]/.test(value)
        };
        const strength = Object.values(checks).filter(Boolean).length;
        if (strength < 3) {
          return message || 'Password harus minimal 8 karakter dengan huruf besar, kecil, dan angka';
        }
        return null;
      },
      
      confirm: (value, params, message) => {
        if (!value) return null;
        const confirmValue = params[0];
        if (value !== confirmValue) {
          return message || 'Konfirmasi tidak cocok';
        }
        return null;
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
   * Validate single value
   */
  validate(value, rules) {
    for (const rule of rules) {
      let validator, params, message;
      
      if (typeof rule === 'string') {
        validator = this.rules[rule] || this.customRules[rule];
        params = [];
        message = null;
      } else if (typeof rule === 'object') {
        validator = this.rules[rule.rule] || this.customRules[rule.rule];
        params = rule.params || [];
        message = rule.message;
      } else if (typeof rule === 'function') {
        validator = rule;
        params = [];
        message = null;
      }
      
      if (!validator) {
        console.warn(`Validation rule not found: ${rule.rule || rule}`);
        continue;
      }
      
      const error = validator(value, params, message);
      if (error) return error;
    }
    
    return null;
  }
  
  /**
   * Validate form data
   */
  validateForm(formData, rules) {
    const errors = {};
    let isValid = true;
    
    Object.entries(rules).forEach(([field, fieldRules]) => {
      const value = formData[field];
      const error = this.validate(value, fieldRules);
      
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });
    
    return { isValid, errors };
  }
  
  /**
   * Validate form element
   */
  validateFormElement(formElement, rules) {
    const formData = {};
    const elements = formElement.querySelectorAll('[name]');
    
    elements.forEach(el => {
      if (el.type === 'checkbox') {
        formData[el.name] = el.checked;
      } else if (el.type === 'file') {
        formData[el.name] = el.files[0];
      } else {
        formData[el.name] = el.value;
      }
    });
    
    return this.validateForm(formData, rules);
  }
  
  /**
   * Show validation errors on form
   */
  showErrors(formElement, errors) {
    // Clear previous errors
    this.clearErrors(formElement);
    
    Object.entries(errors).forEach(([field, error]) => {
      const input = formElement.querySelector(`[name="${field}"]`);
      if (!input) return;
      
      input.classList.add('form-input--error');
      
      const errorEl = document.createElement('span');
      errorEl.className = 'form-helper form-helper--error';
      errorEl.textContent = error;
      
      const parent = input.closest('.form-field') || input.parentElement;
      parent.appendChild(errorEl);
    });
    
    // Focus first error field
    const firstError = formElement.querySelector('.form-input--error');
    if (firstError) firstError.focus();
  }
  
  /**
   * Clear validation errors
   */
  clearErrors(formElement) {
    const errorInputs = formElement.querySelectorAll('.form-input--error');
    errorInputs.forEach(input => input.classList.remove('form-input--error'));
    
    const errorMessages = formElement.querySelectorAll('.form-helper--error');
    errorMessages.forEach(el => el.remove());
  }
  
  /**
   * Get preset rules for common forms
   */
  getPreset(presetName) {
    const presets = {
      login: {
        username: ['required'],
        password: ['required']
      },
      
      register: {
        username: [
          'required',
          { rule: 'minLength', params: [3], message: 'Username minimal 3 karakter' },
          { rule: 'pattern', params: [/^[a-zA-Z0-9_]+$/], message: 'Username hanya boleh huruf, angka, dan underscore' }
        ],
        password: ['required', 'password'],
        email: ['required', 'email'],
        namaLengkap: ['required', { rule: 'minLength', params: [3] }]
      },
      
      changePassword: {
        oldPassword: ['required'],
        newPassword: ['required', 'password'],
        confirmPassword: ['required', { rule: 'confirm', params: ['${newPassword}'] }]
      },
      
      suratMasuk: {
        nomorSurat: ['required'],
        tanggalSurat: ['required', 'date'],
        pengirim: ['required'],
        perihal: ['required', { rule: 'minLength', params: [5] }]
      },
      
      suratKeluar: {
        tujuan: ['required'],
        perihal: ['required', { rule: 'minLength', params: [5] }]
      },
      
      disposisi: {
        instruksi: ['required', { rule: 'minLength', params: [10] }],
        batasWaktu: ['date', 'dateAfter']
      },
      
      userCreate: {
        username: [
          'required',
          { rule: 'minLength', params: [3] },
          { rule: 'pattern', params: [/^[a-zA-Z0-9_]+$/] }
        ],
        password: ['required', 'password'],
        namaLengkap: ['required'],
        email: ['email']
      }
    };
    
    return presets[presetName] || {};
  }
}

// Singleton instance
const ValidationService = new ValidationService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ValidationService };
}
