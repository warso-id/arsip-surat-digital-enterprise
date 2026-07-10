/**
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0
 * Form Validators
 */

/**
 * Required field validator
 */
export function required(value, message = 'Field ini wajib diisi') {
  if (value === undefined || value === null || value === '') {
    return message
  }
  if (Array.isArray(value) && value.length === 0) {
    return message
  }
  return true
}

/**
 * Email validator
 */
export function email(value, message = 'Format email tidak valid') {
  if (!value) return true // Allow empty, use required for mandatory
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(value) ? true : message
}

/**
 * Min length validator
 */
export function minLength(min) {
  return (value, message) => {
    if (!value) return true
    message = message || `Minimal ${min} karakter`
    return value.length >= min ? true : message
  }
}

/**
 * Max length validator
 */
export function maxLength(max) {
  return (value, message) => {
    if (!value) return true
    message = message || `Maksimal ${max} karakter`
    return value.length <= max ? true : message
  }
}

/**
 * Min value validator
 */
export function minValue(min) {
  return (value, message) => {
    if (value === undefined || value === null || value === '') return true
    message = message || `Nilai minimal ${min}`
    return Number(value) >= min ? true : message
  }
}

/**
 * Max value validator
 */
export function maxValue(max) {
  return (value, message) => {
    if (value === undefined || value === null || value === '') return true
    message = message || `Nilai maksimal ${max}`
    return Number(value) <= max ? true : message
  }
}

/**
 * Pattern validator
 */
export function pattern(regex, message = 'Format tidak valid') {
  return (value) => {
    if (!value) return true
    return regex.test(value) ? true : message
  }
}

/**
 * Phone number validator (Indonesian)
 */
export function phone(value, message = 'Nomor telepon tidak valid') {
  if (!value) return true
  const regex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/
  return regex.test(value.replace(/[\s-]/g, '')) ? true : message
}

/**
 * NIP validator
 */
export function nip(value, message = 'NIP tidak valid') {
  if (!value) return true
  const regex = /^\d{18}$/
  return regex.test(value.replace(/\s/g, '')) ? true : message
}

/**
 * URL validator
 */
export function url(value, message = 'URL tidak valid') {
  if (!value) return true
  try {
    new URL(value)
    return true
  } catch {
    return message
  }
}

/**
 * File size validator
 */
export function maxFileSize(maxBytes) {
  return (file, message) => {
    if (!file) return true
    message = message || `Ukuran file maksimal ${(maxBytes / 1024 / 1024).toFixed(1)} MB`
    return file.size <= maxBytes ? true : message
  }
}

/**
 * File type validator
 */
export function allowedFileTypes(types, message) {
  return (file) => {
    if (!file) return true
    const ext = file.name.split('.').pop().toLowerCase()
    message = message || `Tipe file harus: ${types.join(', ')}`
    return types.includes(ext) ? true : message
  }
}

/**
 * Password strength validator
 */
export function passwordStrength(value, message) {
  if (!value) return true
  message = message || 'Password minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka'
  
  const hasUpperCase = /[A-Z]/.test(value)
  const hasLowerCase = /[a-z]/.test(value)
  const hasNumber = /[0-9]/.test(value)
  const hasMinLength = value.length >= 8
  
  return (hasUpperCase && hasLowerCase && hasNumber && hasMinLength) ? true : message
}

/**
 * Confirm password validator
 */
export function confirmPassword(passwordField) {
  return (value, message) => {
    if (!value) return true
    message = message || 'Password tidak cocok'
    return value === passwordField ? true : message
  }
}

/**
 * Validate form object
 */
export function validateForm(form, rules) {
  const errors = {}
  let isValid = true
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = form[field]
    
    for (const rule of fieldRules) {
      const result = rule(value)
      if (result !== true) {
        errors[field] = result
        isValid = false
        break
      }
    }
  }
  
  return { isValid, errors }
}

/**
 * Create validation rules
 */
export const rules = {
  required: (msg) => (v) => required(v, msg),
  email: (msg) => (v) => email(v, msg),
  minLength: (min, msg) => (v) => minLength(min)(v, msg),
  maxLength: (max, msg) => (v) => maxLength(max)(v, msg),
  phone: (msg) => (v) => phone(v, msg),
  nip: (msg) => (v) => nip(v, msg),
  password: (msg) => (v) => passwordStrength(v, msg),
  confirmPassword: (field, msg) => (v) => confirmPassword(field)(v, msg),
  maxFileSize: (max, msg) => (v) => maxFileSize(max)(v, msg),
  allowedFileTypes: (types, msg) => (v) => allowedFileTypes(types, msg)(v)
}
