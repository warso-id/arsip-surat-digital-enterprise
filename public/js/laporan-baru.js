// Laporan Management JavaScript
class LaporanManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStatistics();
        this.loadCharts();
    }

    setupEventListeners() {
        document.getElementById('btnFilter')?.addEventListener('click', () => {
            this.loadStatistics();
            this.loadCharts();
        });

        document.getElementById('btnExportPDF')?.addEventListener('click', () => {
            this.exportPDF();
        });

        document.getElementById('btnExportExcel')?.addEventListener('click', () => {
            this.exportExcel();
        });
    }

    async loadStatistics() {
        try {
            const params = this.getFilterParams();
            const response = await axios.get('/api/laporan/statistics', { params });
            const data = response.data.data;

            document.getElementById('statSuratMasuk').textContent = data.surat?.surat_masuk?.total || 0;
            document.getElementById('statSuratKeluar').textContent = data.surat?.surat_keluar?.total || 0;
            document.getElementById('statDisposisi').textContent = data.disposisi?.total || 0;
            document.getElementById('statPending').textContent = data.disposisi?.belum_dibaca || 0;
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    async loadCharts() {
        await this.loadSuratChart();
        await this.loadStatusChart();
    }

    async loadSuratChart() {
        try {
            const response = await axios.get('/dashboard/chart');
            const data = response.data.data;

            const ctx = document.getElementById('suratChart');
            if (!ctx) return;

            if (this.charts.surat) {
                this.charts.surat.destroy();
            }

            this.charts.surat = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Statistik Surat per Bulan' }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading surat chart:', error);
        }
    }

    async loadStatusChart() {
        try {
            const response = await axios.get('/api/laporan/statistics');
            const data = response.data.data;

            const ctx = document.getElementById('statusChart');
            if (!ctx) return;

            if (this.charts.status) {
                this.charts.status.destroy();
            }

            const statusData = data.surat?.surat_masuk?.per_status || {};
            
            this.charts.status = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(statusData),
                    datasets: [{
                        data: Object.values(statusData),
                        backgroundColor: [
                            '#007bff', '#28a745', '#ffc107', '#dc3545', '#6c757d'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' },
                        title: { display: true, text: 'Status Surat' }
                    }
                }
            });
        } catch (error) {
            console.error('Error loading status chart:', error);
        }
    }

    getFilterParams() {
        return {
            tipe: document.getElementById('filterTipe')?.value || '',
            tanggal_mulai: document.getElementById('filterTanggalMulai')?.value || '',
            tanggal_selesai: document.getElementById('filterTanggalSelesai')?.value || '',
            kategori_id: document.getElementById('filterKategori')?.value || '',
            status: document.getElementById('filterStatus')?.value || ''
        };
    }

    async exportPDF() {
        try {
            const params = this.getFilterParams();
            const response = await axios.get('/api/laporan/export-pdf', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `laporan-${Date.now()}.pdf`;
            link.click();
        } catch (error) {
            alert('Gagal export PDF');
        }
    }

    async exportExcel() {
        try {
            const params = this.getFilterParams();
            const response = await axios.get('/api/laporan/export-excel', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `laporan-${Date.now()}.xlsx`;
            link.click();
        } catch (error) {
            alert('Gagal export Excel');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('suratChart')) {
        window.laporanManager = new LaporanManager();
    }
});
