// LaporanService.js - Report Generation Service
class LaporanService {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async generateReport(type, period = {}, filters = {}) {
        try {
            const payload = this.encode({
                action: 'laporan_generate',
                type: type,
                period: period,
                filters: filters,
                token: this.token,
                timestamp: Date.now()
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Generate report error:', error);
            return { success: false, message: 'Gagal generate laporan' };
        }
    }

    async getMonthlyReport(year, month) {
        try {
            const payload = this.encode({
                action: 'laporan_monthly',
                year: year,
                month: month,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Monthly report error:', error);
            return { success: false, data: {} };
        }
    }

    async getYearlyReport(year) {
        try {
            const payload = this.encode({
                action: 'laporan_yearly',
                year: year,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Yearly report error:', error);
            return { success: false, data: {} };
        }
    }

    async getReportSummary() {
        try {
            const payload = this.encode({
                action: 'laporan_summary',
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Report summary error:', error);
            return { success: false, data: {} };
        }
    }

    async exportToExcel(type, filters = {}) {
        try {
            const payload = this.encode({
                action: 'laporan_export_excel',
                type: type,
                filters: filters,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            if (data.success && data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.download = `laporan-${type}-${Date.now()}.xlsx`;
                link.click();
            }

            return data;

        } catch (error) {
            console.error('Export Excel error:', error);
            return { success: false, message: 'Gagal export Excel' };
        }
    }

    async exportToPDF(type, filters = {}) {
        try {
            const payload = this.encode({
                action: 'laporan_export_pdf',
                type: type,
                filters: filters,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            if (data.success && data.url) {
                const link = document.createElement('a');
                link.href = data.url;
                link.download = `laporan-${type}-${Date.now()}.pdf`;
                link.click();
            }

            return data;

        } catch (error) {
            console.error('Export PDF error:', error);
            return { success: false, message: 'Gagal export PDF' };
        }
    }

    async scheduleReport(type, schedule, emailTo) {
        try {
            const payload = this.encode({
                action: 'laporan_schedule',
                type: type,
                schedule: schedule,
                email_to: emailTo,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Schedule report error:', error);
            return { success: false, message: 'Gagal menjadwalkan laporan' };
        }
    }

    encode(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decode(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return {};
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaporanService;
}
