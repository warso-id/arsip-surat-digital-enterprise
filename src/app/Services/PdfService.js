// PdfService.js - PDF Generation Service
class PdfService {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async generateSuratMasukPdf(suratId) {
        try {
            const payload = this.encode({
                action: 'pdf_generate_surat_masuk',
                surat_id: suratId,
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
                window.open(data.url, '_blank');
            }

            return data;

        } catch (error) {
            console.error('Generate surat masuk PDF error:', error);
            return { success: false, message: 'Gagal generate PDF' };
        }
    }

    async generateSuratKeluarPdf(suratId) {
        try {
            const payload = this.encode({
                action: 'pdf_generate_surat_keluar',
                surat_id: suratId,
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
                window.open(data.url, '_blank');
            }

            return data;

        } catch (error) {
            console.error('Generate surat keluar PDF error:', error);
            return { success: false, message: 'Gagal generate PDF' };
        }
    }

    async generateLaporanPdf(type, filters = {}) {
        try {
            const payload = this.encode({
                action: 'pdf_generate_laporan',
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
            console.error('Generate laporan PDF error:', error);
            return { success: false, message: 'Gagal generate PDF' };
        }
    }

    async generateDisposisiPdf(disposisiId) {
        try {
            const payload = this.encode({
                action: 'pdf_generate_disposisi',
                disposisi_id: disposisiId,
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
                window.open(data.url, '_blank');
            }

            return data;

        } catch (error) {
            console.error('Generate disposisi PDF error:', error);
            return { success: false, message: 'Gagal generate PDF' };
        }
    }

    async printSurat(type, id) {
        try {
            const payload = this.encode({
                action: 'print_surat',
                type: type,
                id: id,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decode(result.data);

            if (data.success && data.html) {
                const printWindow = window.open('', '_blank', 'width=800,height=600');
                printWindow.document.write(data.html);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => printWindow.print(), 500);
            }

            return data;

        } catch (error) {
            console.error('Print surat error:', error);
            return { success: false, message: 'Gagal mencetak surat' };
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
    module.exports = PdfService;
}
