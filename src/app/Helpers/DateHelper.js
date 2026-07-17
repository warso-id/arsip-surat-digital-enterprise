// DateHelper.js - Date Formatting Helper
class DateHelper {
    constructor() {
        this.locale = 'id-ID';
        this.timezone = 'Asia/Jakarta';
    }

    formatDate(date, format = 'full') {
        if (!date) return '-';
        
        const d = new Date(date);
        
        const formats = {
            'full': { year: 'numeric', month: 'long', day: 'numeric' },
            'short': { year: 'numeric', month: '2-digit', day: '2-digit' },
            'month': { year: 'numeric', month: 'long' },
            'day': { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
        };

        return d.toLocaleDateString(this.locale, formats[format] || formats.full);
    }

    formatDateTime(date) {
        if (!date) return '-';
        
        const d = new Date(date);
        return d.toLocaleDateString(this.locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTime(date) {
        if (!date) return '-';
        
        const d = new Date(date);
        return d.toLocaleTimeString(this.locale, {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    timeAgo(date) {
        if (!date) return '-';
        
        const now = new Date();
        const d = new Date(date);
        const seconds = Math.floor((now - d) / 1000);
        
        if (seconds < 60) return 'Baru saja';
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} menit yang lalu`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} jam yang lalu`;
        
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} hari yang lalu`;
        
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} minggu yang lalu`;
        
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} bulan yang lalu`;
        
        const years = Math.floor(days / 365);
        return `${years} tahun yang lalu`;
    }

    getToday() {
        return new Date().toISOString().split('T')[0];
    }

    getNow() {
        return new Date().toISOString();
    }

    getMonthName(month) {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return months[month] || '';
    }

    getDayName(day) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[day] || '';
    }

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    subtractDays(date, days) {
        return this.addDays(date, -days);
    }

    getDaysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    isWeekend(date) {
        const d = new Date(date);
        const day = d.getDay();
        return day === 0 || day === 6;
    }

    isToday(date) {
        const today = new Date();
        const d = new Date(date);
        return d.toDateString() === today.toDateString();
    }

    formatIndonesian(date) {
        if (!date) return '-';
        
        const d = new Date(date);
        const day = this.getDayName(d.getDay());
        const month = this.getMonthName(d.getMonth());
        const year = d.getFullYear();
        const dateNum = d.getDate();
        
        return `${day}, ${dateNum} ${month} ${year}`;
    }

    getQuarter(date) {
        const d = new Date(date);
        return Math.floor(d.getMonth() / 3) + 1;
    }

    getWeekNumber(date) {
        const d = new Date(date);
        const start = new Date(d.getFullYear(), 0, 1);
        const diff = (d - start + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000) / 86400000;
        return Math.ceil((diff + start.getDay() + 1) / 7);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateHelper;
}
