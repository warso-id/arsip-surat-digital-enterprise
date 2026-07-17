// laporan.js - Enterprise Report Module
class LaporanModule {
    constructor(app) {
        this.app = app;
    }

    async generateReport(type) {
        try {
            this.app.showSpinner(true);
            
            // Get filter parameters
            const filters = this.getReportFilters();
            
            const response = await this.app.apiRequest('generateReport', {
                type: type,
                filters: filters,
                format: 'html'
            });

            if (response.success) {
                this.displayReport(response.data, type);
                this.app.showToast('Laporan berhasil digenerate', 'success');
            }
        } catch (error) {
            console.error('Report generation failed:', error);
            this.app.showToast('Gagal generate laporan', 'error');
        } finally {
            this.app.showSpinner(false);
        }
    }

    getReportFilters() {
        return {
            tanggal_dari: document.getElementById('report-dari')?.value || '',
            tanggal_sampai: document.getElementById('report-sampai')?.value || '',
            kategori_id: document.getElementById('report-kategori')?.value || '',
            status: document.getElementById('report-status')?.value || ''
        };
    }

    displayReport(data, type) {
        const container = document.getElementById('report-result');
        if (!container) return;

        let title = '';
        switch(type) {
            case 'surat-masuk':
                title = 'Laporan Surat Masuk';
                break;
            case 'surat-keluar':
                title = 'Laporan Surat Keluar';
                break;
            case 'disposisi':
                title = 'Laporan Disposisi';
                break;
        }

        const reportHtml = `
            <div class="report-container">
                <div class="report-header">
                    <h3>${title}</h3>
                    <div class="report-actions">
                        <button class="btn btn-sm btn-primary" onclick="window.laporanModule.exportPDF('${type}')">
                            📥 Export PDF
                        </button>
                        <button class="btn btn-sm btn-success" onclick="window.laporanModule.exportExcel('${type}')">
                            📊 Export Excel
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="window.print()">
                            🖨️ Print
                        </button>
                    </div>
                </div>
                <div class="report-summary">
                    <div class="summary-item">
                        <strong>Total Data:</strong> ${data.total || 0}
                    </div>
                    <div class="summary-item">
                        <strong>Periode:</strong> ${data.periode || '-'}
                    </div>
                </div>
                <div class="report-content">
                    ${data.html || this.generateReportTable(data.records, type)}
                </div>
            </div>
        `;

        container.innerHTML = reportHtml;
        container.style.display = 'block';
    }

    generateReportTable(records, type) {
        if (!records || records.length === 0) {
            return '<p class="text-center">Tidak ada data untuk ditampilkan</p>';
        }

        let tableHtml = '<table class="report-table">';
        
        // Generate headers based on type
        switch(type) {
            case 'surat-masuk':
                tableHtml += `
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>No. Agenda</th>
                            <th>Tanggal Terima</th>
                            <th>Pengirim</th>
                            <th>Perihal</th>
                            <th>Kategori</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map((r, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${r.no_agenda}</td>
                                <td>${this.formatDate(r.tanggal_terima)}</td>
                                <td>${r.pengirim}</td>
                                <td>${r.perihal}</td>
                                <td>${r.kategori_nama}</td>
                                <td>${r.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                `;
                break;
                
            case 'surat-keluar':
                tableHtml += `
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>No. Surat</th>
                            <th>Tanggal</th>
                            <th>Tujuan</th>
                            <th>Perihal</th>
                            <th>Kategori</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map((r, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${r.no_surat}</td>
                                <td>${this.formatDate(r.tanggal_surat)}</td>
                                <td>${r.tujuan}</td>
                                <td>${r.perihal}</td>
                                <td>${r.kategori_nama}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                `;
                break;
        }

        tableHtml += '</table>';
        return tableHtml;
    }

    async exportPDF(type) {
        try {
            const response = await this.app.apiRequest('exportPDF', {
                type: type,
                filters: this.getReportFilters()
            });

            if (response.success && response.data?.url) {
                const link = document.createElement('a');
                link.href = response.data.url;
                link.download = `laporan-${type}-${Date.now()}.pdf`;
                link.click();
            }
        } catch (error) {
            console.error('PDF export failed:', error);
            this.app.showToast('Gagal export PDF', 'error');
        }
    }

    async exportExcel(type) {
        try {
            const response = await this.app.apiRequest('exportExcel', {
                type: type,
                filters: this.getReportFilters()
            });

            if (response.success && response.data?.url) {
                const link = document.createElement('a');
                link.href = response.data.url;
                link.download = `laporan-${type}-${Date.now()}.xlsx`;
                link.click();
            }
        } catch (error) {
            console.error('Excel export failed:', error);
            this.app.showToast('Gagal export Excel', 'error');
        }
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID');
    }
}

// Initialize
window.laporanModule = new LaporanModule(window.enterpriseApp);
