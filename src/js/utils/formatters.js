/**
 * FORMATTERS - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Data formatting utilities
 */

const Formatters = {
  /**
   * Format date
   */
  date(date, format = 'DD/MM/YYYY') {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const shortMonth = d.toLocaleDateString('id-ID', { month: 'short' });
    const longMonth = d.toLocaleDateString('id-ID', { month: 'long' });
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)
      .replace('YY', String(year).slice(-2))
      .replace('Mmm', shortMonth)
      .replace('MMMM', longMonth)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },
  
  /**
   * Format date time
   */
  dateTime(date, format = 'DD/MM/YYYY HH:mm') {
    return this.date(date, format);
  },
  
  /**
   * Format relative time
   */
  relativeTime(date) {
    if (!date) return '';
    
    const now = new Date();
    const d = new Date(date);
    const diff = now - d;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (seconds < 10) return 'Baru saja';
    if (seconds < 60) return `${seconds} detik lalu`;
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    if (weeks < 4) return `${weeks} minggu lalu`;
    if (months < 12) return `${months} bulan lalu`;
    return `${years} tahun lalu`;
  },
  
  /**
   * Format number
   */
  number(num, decimals = 0) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Number(num).toLocaleString('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },
  
  /**
   * Format currency (IDR)
   */
  currency(amount) {
    if (!amount && amount !== 0) return '-';
    return 'Rp ' + this.number(amount, 0);
  },
  
  /**
   * Format file size
   */
  fileSize(bytes) {
    if (bytes === 0) return '0 B';
    if (!bytes) return '-';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
  },
  
  /**
   * Format percentage
   */
  percentage(value, total, decimals = 1) {
    if (!total) return '0%';
    const percent = (value / total) * 100;
    return percent.toFixed(decimals) + '%';
  },
  
  /**
   * Format phone number (Indonesia)
   */
  phone(phone) {
    if (!phone) return '-';
    
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('+62')) {
      return `+62 ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}-${cleaned.slice(10)}`;
    }
    if (cleaned.startsWith('62')) {
      return `+62 ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    
    return phone;
  },
  
  /**
   * Format NIP
   */
  nip(nip) {
    if (!nip) return '-';
    const cleaned = nip.replace(/[\s.-]/g, '');
    if (cleaned.length !== 18) return nip;
    return `${cleaned.slice(0, 8)} ${cleaned.slice(8, 14)} ${cleaned.slice(14, 15)} ${cleaned.slice(15)}`;
  },
  
  /**
   * Truncate text
   */
  truncate(text, maxLength = 100, suffix = '...') {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  },
  
  /**
   * Capitalize first letter
   */
  capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },
  
  /**
   * Title case
   */
  titleCase(text) {
    if (!text) return '';
    return text.replace(/\w\S*/g, (word) => {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    });
  },
  
  /**
   * Format name initials
   */
  initials(name) {
    if (!name) return '?';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  },
  
  /**
   * Format status label
   */
  statusLabel(status) {
    const labels = {
      'draft': 'Draft',
      'diterima': 'Diterima',
      'diproses': 'Diproses',
      'selesai': 'Selesai',
      'diarsipkan': 'Diarsipkan',
      'ditolak': 'Ditolak',
      'pending': 'Pending',
      'approved': 'Disetujui',
      'rejected': 'Ditolak',
      'revisi': 'Revisi'
    };
    return labels[status] || status || '-';
  },
  
  /**
   * Format role label
   */
  roleLabel(role) {
    const labels = {
      'admin': 'Administrator',
      'kabid': 'Kepala Bidang',
      'kasubag': 'Kepala Sub Bagian',
      'staff': 'Staff',
      'sekretaris': 'Sekretaris'
    };
    return labels[role] || role || '-';
  },
  
  /**
   * Format sifat label
   */
  sifatLabel(sifat) {
    const labels = {
      'biasa': 'Biasa',
      'penting': 'Penting',
      'segera': 'Segera',
      'rahasia': 'Rahasia',
      'sangat_rahasia': 'Sangat Rahasia'
    };
    return labels[sifat] || sifat || '-';
  },
  
  /**
   * Format duration
   */
  duration(ms) {
    if (!ms) return '0ms';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}j ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}d`;
    if (seconds > 0) return `${seconds}d`;
    return `${ms}ms`;
  },
  
  /**
   * Format JSON
   */
  json(obj, indent = 2) {
    try {
      return JSON.stringify(obj, null, indent);
    } catch {
      return String(obj);
    }
  },
  
  /**
   * Format list to string
   */
  list(items, separator = ', ', limit = 3) {
    if (!items || items.length === 0) return '-';
    
    if (items.length <= limit) {
      return items.join(separator);
    }
    
    const shown = items.slice(0, limit).join(separator);
    return `${shown} dan ${items.length - limit} lainnya`;
  },
  
  /**
   * Format boolean
   */
  boolean(value) {
    return value ? 'Ya' : 'Tidak';
  },
  
  /**
   * Format empty value
   */
  empty(value, placeholder = '-') {
    return value || placeholder;
  },
  
  /**
   * Highlight search term
   */
  highlight(text, query) {
    if (!text || !query) return text || '';
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  },
  
  /**
   * Escape regex
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },
  
  /**
   * Generate slug
   */
  slug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
  
  /**
   * Strip HTML tags
   */
  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  },
  
  /**
   * Format bytes to human readable
   */
  bytes(bytes) {
    return this.fileSize(bytes);
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Formatters };
}
