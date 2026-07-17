// LaporanController.js - Generate Laporan Controller
class LaporanController {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async generateReport(type, filters = {}) {
        try {
            const payload = this.encodeData({
                action: 'laporan_generate',
                type: type,
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
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Generate report error:', error);
            return { success: false, message: 'Gagal generate laporan' };
        }
    }

    async exportPDF(type, filters = {}) {
        try {
            const payload = this.encodeData({
                action: 'laporan_export_pdf',
                type: type,
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
            const data = this.decodeData(result.data);

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

    async exportExcel(type, filters = {}) {
        try {
            const payload = this.encodeData({
                action: 'laporan_export_excel',
                type: type,
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
            const data = this.decodeData(result.data);

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

    async getReportSummary() {
        try {
            const payload = this.encodeData({
                action: 'laporan_summary',
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Report summary error:', error);
            return { success: false, data: {} };
        }
    }

    async getMonthlyReport(year, month) {
        try {
            const payload = this.encodeData({
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
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Monthly report error:', error);
            return { success: false, data: {} };
        }
    }

    async getYearlyReport(year) {
        try {
            const payload = this.encodeData({
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
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Yearly report error:', error);
            return { success: false, data: {} };
        }
    }

    encodeData(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decodeData(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return {};
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaporanController;
}
