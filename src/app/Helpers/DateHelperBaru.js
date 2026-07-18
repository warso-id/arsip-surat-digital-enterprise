class DateHelper {
    /**
     * Format tanggal ke format Indonesia
     */
    static formatTanggalIndonesia(date) {
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        
        const d = new Date(date);
        const day = d.getDate();
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        
        return `${day} ${month} ${year}`;
    }

    /**
     * Format tanggal ke format ISO (YYYY-MM-DD)
     */
    static formatISO(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    /**
     * Format datetime ke format Indonesia
     */
    static formatDateTimeIndonesia(date) {
        const d = new Date(date);
        const dateStr = this.formatTanggalIndonesia(d);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        
        return `${dateStr} ${hours}:${minutes}:${seconds} WIB`;
    }

    /**
     * Menghitung selisih hari
     */
    static diffInDays(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Menghitung selisih jam
     */
    static diffInHours(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60));
    }

    /**
     * Menambah hari
     */
    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * Mengurangi hari
     */
    static subtractDays(date, days) {
        return this.addDays(date, -days);
    }

    /**
     * Mendapatkan awal bulan
     */
    static startOfMonth(date) {
        const d = new Date(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Mendapatkan akhir bulan
     */
    static endOfMonth(date) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + 1);
        d.setDate(0);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    /**
     * Mendapatkan awal tahun
     */
    static startOfYear(date) {
        const d = new Date(date);
        d.setMonth(0, 1);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Mendapatkan akhir tahun
     */
    static endOfYear(date) {
        const d = new Date(date);
        d.setMonth(11, 31);
        d.setHours(23, 59, 59, 999);
        return d;
    }

    /**
     * Cek apakah tanggal valid
     */
    static isValidDate(date) {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    }

    /**
     * Mendapatkan umur dari tanggal lahir
     */
    static getAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Mendapatkan nama hari dalam bahasa Indonesia
     */
    static getDayName(date) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const d = new Date(date);
        return days[d.getDay()];
    }

    /**
     * Mendapatkan waktu relatif (contoh: "2 jam yang lalu")
     */
    static getRelativeTime(date) {
        const now = new Date();
        const d = new Date(date);
        const diffSeconds = Math.floor((now - d) / 1000);
        
        if (diffSeconds < 60) {
            return 'Baru saja';
        }
        
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) {
            return `${diffMinutes} menit yang lalu`;
        }
        
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) {
            return `${diffHours} jam yang lalu`;
        }
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) {
            return `${diffDays} hari yang lalu`;
        }
        
        const diffWeeks = Math.floor(diffDays / 7);
        if (diffWeeks < 4) {
            return `${diffWeeks} minggu yang lalu`;
        }
        
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) {
            return `${diffMonths} bulan yang lalu`;
        }
        
        const diffYears = Math.floor(diffDays / 365);
        return `${diffYears} tahun yang lalu`;
    }
}

module.exports = DateHelper;
