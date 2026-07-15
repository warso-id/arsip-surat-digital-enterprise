/**
 * ============================================
 * FORMATTERS - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL DATA FORMATTING UTILITIES - SIAP PRODUKSI
 * Mendukung: Date, Number, Text, File, Status,
 * Currency, Phone, NIP, Relative Time, Slug
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

const Formatters = {
  /**
   * Format date with custom pattern
   * Tokens: DD, MM, YYYY, YY, Mmm, MMMM, HH, mm, ss, d, M
   */
  date(date, format = 'DD/MM/YYYY') {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const shortMonth = d.toLocaleDateString('id-ID', { month: 'short' });
    const longMonth = d.toLocaleDateString('id-ID', { month: 'long' });
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const weekday = d.toLocaleDateString('id-ID', { weekday: 'long' });
    const weekdayShort = d.toLocaleDateString('id-ID', { weekday: 'short' });

    return format
      .replace('DD', day)
      .replace('d', String(d.getDate()))
      .replace('MM', month)
      .replace('M', String(d.getMonth() + 1))
      .replace('YYYY', String(year))
      .replace('YY', String(year).slice(-2))
      .replace('Mmm', shortMonth)
      .replace('MMMM', longMonth)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
      .replace('EEEE', weekday)
      .replace('EEE', weekdayShort);
  },

  /**
   * Format date and time
   */
  dateTime(date, format = 'DD/MM/YYYY HH:mm') {
    return this.date(date, format);
  },

  /**
   * Format time only
   */
  time(date, format = 'HH:mm') {
    return this.date(date, format);
  },

  /**
   * Format relative time (e.g., "5 menit lalu")
   */
  relativeTime(date) {
    if (!date) return '';
    const now = Date.now();
    const d = new Date(date).getTime();
    const diff = now - d;

    if (diff < 0) return this.date(date, 'DD/MM/YYYY');

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 10) return 'Baru saja';
    if (seconds < 60) return `${seconds} detik lalu`;
    if (minutes === 1) return '1 menit lalu';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours === 1) return '1 jam lalu';
    if (hours < 24) return `${hours} jam lalu`;
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari lalu`;
    if (weeks === 1) return '1 minggu lalu';
    if (weeks < 4) return `${weeks} minggu lalu`;
    if (months === 1) return '1 bulan lalu';
    if (months < 12) return `${months} bulan lalu`;
    if (years === 1) return '1 tahun lalu';
    return `${years} tahun lalu`;
  },

  /**
   * Format relative time (short version)
   */
  relativeTimeShort(date) {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 0) return 'sekarang';
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}d`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}j`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}h`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}bl`;
    return `${Math.floor(d / 365)}th`;
  },

  /**
   * Format number with locale
   */
  number(num, decimals = 0, locale = 'id-ID') {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return Number(num).toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  /**
   * Format number with abbreviation (1K, 1M)
   */
  numberShort(num) {
    if (!num && num !== 0) return '0';
    const n = Number(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString('id-ID');
  },

  /**
   * Format currency (IDR)
   */
  currency(amount, currency = 'IDR', locale = 'id-ID') {
    if (!amount && amount !== 0) return '-';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch {
      return 'Rp ' + this.number(amount, 0);
    }
  },

  /**
   * Format compact currency
   */
  currencyShort(amount) {
    if (!amount && amount !== 0) return '-';
    const n = Number(amount);
    if (n >= 1000000000) return 'Rp ' + (n / 1000000000).toFixed(1) + ' M';
    if (n >= 1000000) return 'Rp ' + (n / 1000000).toFixed(1) + ' Jt';
    return 'Rp ' + this.number(n, 0);
  },

  /**
   * Format file size
   */
  fileSize(bytes) {
    if (bytes === 0) return '0 B';
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const k = 1024;
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
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
    let cleaned = String(phone).replace(/[\s\-\(\)\.]/g, '');
    if (cleaned.startsWith('+62') && cleaned.length >= 10) {
      return `+62 ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}-${cleaned.slice(10)}`;
    }
    if (cleaned.startsWith('62') && cleaned.length >= 10) {
      return `+62 ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.startsWith('0') && cleaned.length >= 10) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    return phone;
  },

  /**
   * Format NIP (18-digit Indonesian civil servant number)
   */
  nip(nip) {
    if (!nip) return '-';
    const cleaned = String(nip).replace(/[\s.-]/g, '');
    if (cleaned.length !== 18) return nip;
    return `${cleaned.slice(0, 8)} ${cleaned.slice(8, 14)} ${cleaned.slice(14, 15)} ${cleaned.slice(15)}`;
  },

  /**
   * Format KTP/NIK number
   */
  ktp(nik) {
    if (!nik) return '-';
    const cleaned = String(nik).replace(/[\s.-]/g, '');
    if (cleaned.length !== 16) return nik;
    return `${cleaned.slice(0, 6)} ${cleaned.slice(6, 8)}${cleaned.slice(8, 12)} ${cleaned.slice(12)}`;
  },

  /**
   * Truncate text with ellipsis
   */
  truncate(text, maxLength = 100, suffix = '...') {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  /**
   * Truncate text in the middle
   */
  truncateMiddle(text, maxLength = 40, separator = '...') {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    const half = Math.floor((maxLength - separator.length) / 2);
    return text.substring(0, half) + separator + text.substring(text.length - half);
  },

  /**
   * Capitalize first letter
   */
  capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  /**
   * Title case (every word)
   */
  titleCase(text) {
    if (!text) return '';
    return text.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase());
  },

  /**
   * Get initials from name
   */
  initials(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  },

  /**
   * Get color from string (consistent hash)
   */
  stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#1976D2', '#388E3C', '#E64A19', '#7B1FA2', '#00796B',
      '#C2185B', '#512DA8', '#F57C00', '#455A64', '#5D4037',
      '#0277BD', '#689F38', '#D32F2F', '#6A1B9A', '#00838F'
    ];
    return colors[Math.abs(hash) % colors.length];
  },

  /**
   * Format status label
   */
  statusLabel(status) {
    const labels = {
      'draft': '📝 Draft',
      'diterima': '📥 Diterima',
      'diproses': '🔄 Diproses',
      'selesai': '✅ Selesai',
      'diarsipkan': '📦 Diarsipkan',
      'ditolak': '❌ Ditolak',
      'pending': '⏳ Pending',
      'approved': '✅ Disetujui',
      'rejected': '❌ Ditolak',
      'revisi': '📝 Revisi',
      'terlambat': '⚠️ Terlambat',
      'dibatalkan': '🚫 Dibatalkan',
      'active': '🟢 Aktif',
      'inactive': '🔴 Nonaktif'
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
      'sekretaris': 'Sekretaris',
      'kepala_dinas': 'Kepala Dinas'
    };
    return labels[role] || role || '-';
  },

  /**
   * Format sifat label
   */
  sifatLabel(sifat) {
    const labels = {
      'biasa': '📋 Biasa',
      'penting': '⚠️ Penting',
      'segera': '🔴 Segera',
      'rahasia': '🔒 Rahasia',
      'sangat_rahasia': '🔐 Sangat Rahasia'
    };
    return labels[sifat] || sifat || '-';
  },

  /**
   * Format duration
   */
  duration(ms) {
    if (!ms) return '0ms';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}h ${h % 24}j`;
    if (h > 0) return `${h}j ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}d`;
    if (s > 0) return `${s}d`;
    return `${ms}ms`;
  },

  /**
   * Format duration short
   */
  durationShort(ms) {
    if (!ms) return '0ms';
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}d`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}j`;
  },

  /**
   * Pretty print JSON
   */
  json(obj, indent = 2) {
    try { return JSON.stringify(obj, null, indent); }
    catch { return String(obj); }
  },

  /**
   * Format list to string
   */
  list(items, separator = ', ', limit = 3) {
    if (!items || items.length === 0) return '-';
    if (items.length <= limit) return items.join(separator);
    const shown = items.slice(0, limit).join(separator);
    return `${shown} dan ${items.length - limit} lainnya`;
  },

  /**
   * Format boolean to text
   */
  boolean(value, trueText = 'Ya', falseText = 'Tidak') {
    return value ? trueText : falseText;
  },

  /**
   * Format empty/null value with placeholder
   */
  empty(value, placeholder = '-') {
    if (value === null || value === undefined || value === '') return placeholder;
    return value;
  },

  /**
   * Highlight search term in text
   */
  highlight(text, query) {
    if (!text || !query) return text || '';
    const escaped = String(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return String(text).replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-highlight">$1</mark>');
  },

  /**
   * Escape HTML entities
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  },

  /**
   * Escape regex special characters
   */
  escapeRegex(string) {
    return String(string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * Generate URL-friendly slug
   */
  slug(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  },

  /**
   * Strip HTML tags
   */
  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = String(html || '');
    return tmp.textContent || tmp.innerText || '';
  },

  /**
   * Format name with title
   */
  fullName(gelarDepan, nama, gelarBelakang) {
    const parts = [];
    if (gelarDepan) parts.push(gelarDepan);
    if (nama) parts.push(nama);
    if (gelarBelakang) parts.push(gelarBelakang);
    return parts.join(' ') || '-';
  },

  /**
   * Format address
   */
  address(alamat, rt, rw, desa, kecamatan, kabupaten, provinsi, kodePos) {
    const parts = [alamat];
    if (rt || rw) parts.push(`RT ${rt || '000'}/RW ${rw || '000'}`);
    if (desa) parts.push(desa);
    if (kecamatan) parts.push(kecamatan);
    if (kabupaten) parts.push(kabupaten);
    if (provinsi) parts.push(provinsi);
    if (kodePos) parts.push(kodePos);
    return parts.filter(Boolean).join(', ') || '-';
  },

  /**
   * Pad number with leading zeros
   */
  pad(num, size = 2) {
    return String(num).padStart(size, '0');
  },

  /**
   * Generate random color hex
   */
  randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  },

  /**
   * Convert newlines to <br>
   */
  nl2br(text) {
    return String(text || '').replace(/\n/g, '<br>');
  },

  /**
   * Mask sensitive data
   */
  mask(text, visibleStart = 3, visibleEnd = 2, maskChar = '*') {
    if (!text) return '';
    const str = String(text);
    if (str.length <= visibleStart + visibleEnd) return maskChar.repeat(str.length);
    return str.slice(0, visibleStart) + maskChar.repeat(str.length - visibleStart - visibleEnd) + str.slice(-visibleEnd);
  },

  /**
   * Format email (masked)
   */
  maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [name, domain] = email.split('@');
    if (name.length <= 3) return name.charAt(0) + '***@' + domain;
    return name.substring(0, 3) + '***@' + domain;
  }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Formatters };
}
