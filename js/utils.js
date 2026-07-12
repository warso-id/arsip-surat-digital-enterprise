/**
 * ============================================
 * UTILS.JS - Utility Functions
 * ARSIP SURAT DIGITAL v3.2.2
 * ============================================
 */

const Utils = {
    // ========== DATE UTILITIES ==========
    formatDate(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatDateShort(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    },
    
    formatDateLong(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    timeAgo(date) {
        if (!date) return '-';
        const now = new Date();
        const past = new Date(date);
        const diff = Math.floor((now - past) / 1000);
        
        const intervals = [
            { label: 'tahun', seconds: 31536000 },
            { label: 'bulan', seconds: 2592000 },
            { label: 'minggu', seconds: 604800 },
            { label: 'hari', seconds: 86400 },
            { label: 'jam', seconds: 3600 },
            { label: 'menit', seconds: 60 },
            { label: 'detik', seconds: 1 }
        ];
        
        for (const interval of intervals) {
            const count = Math.floor(diff / interval.seconds);
            if (count > 0) {
                return `${count} ${interval.label} yang lalu`;
            }
        }
        return 'baru saja';
    },
    
    // ========== STRING UTILITIES ==========
    truncate(str, maxLength = 50) {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '...';
    },
    
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    slugify(str) {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    },
    
    // ========== NUMBER UTILITIES ==========
    formatNumber(num) {
        if (num === undefined || num === null) return '0';
        return num.toLocaleString('id-ID');
    },
    
    formatCurrency(num) {
        if (num === undefined || num === null) return 'Rp 0';
        return 'Rp ' + num.toLocaleString('id-ID');
    },
    
    // ========== FILE UTILITIES ==========
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    getFileIcon(mimeType) {
        const icons = {
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel',
            'ppt': 'fa-file-powerpoint',
            'pptx': 'fa-file-powerpoint',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'svg': 'fa-file-image',
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive',
            'txt': 'fa-file-alt',
            'json': 'fa-file-code',
            'xml': 'fa-file-code',
            'html': 'fa-file-code',
            'css': 'fa-file-code',
            'js': 'fa-file-code',
            'mp4': 'fa-file-video',
            'mp3': 'fa-file-audio',
            'wav': 'fa-file-audio'
        };
        return icons[mimeType] || 'fa-file';
    },
    
    // ========== STATUS UTILITIES ==========
    getStatusBadge(status) {
        const map = {
            'diterima': 'status-badge diterima',
            'diproses': 'status-badge diproses',
            'didisposisikan': 'status-badge didisposisikan',
            'selesai': 'status-badge selesai',
            'ditolak': 'status-badge ditolak',
            'draft': 'status-badge draft',
            'review': 'status-badge review',
            'approved': 'status-badge approved',
            'ttd': 'status-badge ttd',
            'dikirim': 'status-badge dikirim',
            'arsip': 'status-badge arsip',
            'pending': 'status-badge pending'
        };
        return map[status] || 'status-badge';
    },
    
    getStatusLabel(status) {
        const map = {
            'diterima': 'Diterima',
            'diproses': 'Diproses',
            'didisposisikan': 'Didisposisikan',
            'selesai': 'Selesai',
            'ditolak': 'Ditolak',
            'draft': 'Draft',
            'review': 'Review',
            'approved': 'Disetujui',
            'ttd': 'TTD',
            'dikirim': 'Dikirim',
            'arsip': 'Arsip',
            'pending': 'Pending'
        };
        return map[status] || status;
    },
    
    // ========== COLOR UTILITIES ==========
    getRandomColor() {
        const colors = ['#1976D2', '#4CAF50', '#FF9800', '#F44336', '#7B1FA2', '#009688', '#2196F3', '#9E9E9E'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // ========== FORM UTILITIES ==========
    generateOptions(data, valueKey, labelKey, selected = null) {
        return data.map(item => `
            <option value="${item[valueKey]}" ${item[valueKey] === selected ? 'selected' : ''}>
                ${item[labelKey]}
            </option>
        `).join('');
    },
    
    // ========== VALIDATION ==========
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    validatePhone(phone) {
        return /^[0-9+\-\s()]{8,15}$/.test(phone);
    },
    
    validateNIP(nip) {
        return /^[0-9]{18}$/.test(nip);
    },
    
    // ========== ERROR HANDLING ==========
    handleError(error, fallbackMessage = 'Terjadi kesalahan') {
        console.error('Error:', error);
        const message = error.message || error || fallbackMessage;
        showToast('error', 'Error', message);
        return message;
    },
    
    // ========== PAGINATION ==========
    generatePagination(currentPage, totalPages, callback) {
        if (totalPages <= 1) return '';
        
        let html = '<div class="pagination">';
        
        if (currentPage > 1) {
            html += `<button class="page-btn" data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;
        }
        
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);
        
        if (start > 1) {
            html += `<button class="page-btn" data-page="1">1</button>`;
            if (start > 2) html += '<span class="page-dots">...</span>';
        }
        
        for (let i = start; i <= end; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        if (end < totalPages) {
            if (end < totalPages - 1) html += '<span class="page-dots">...</span>';
            html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        if (currentPage < totalPages) {
            html += `<button class="page-btn" data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;
        }
        
        html += '</div>';
        
        // Attach event listeners
        setTimeout(() => {
            document.querySelectorAll('.page-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const page = parseInt(btn.dataset.page);
                    if (page && callback) callback(page);
                });
            });
        }, 0);
        
        return html;
    }
};

// ========== EXPOSE TO GLOBAL ==========
window.Utils = Utils;
