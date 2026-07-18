// Dashboard JavaScript
class Dashboard {
    constructor() {
        this.charts = {};
        this.init();
    }

    /**
     * Initialize dashboard
     */
    async init() {
        await this.loadStatistics();
        await this.loadRecentActivities();
        await this.loadChart();
        this.setupEventListeners();
    }

    /**
     * Load statistics
     */
    async loadStatistics() {
        try {
            const response = await axios.get('/dashboard');
            const data = response.data.data;

            // Update statistics cards
            this.updateStatCard('totalSuratMasuk', data.statistics.surat_masuk.total);
            this.updateStatCard('totalSuratKeluar', data.statistics.surat_keluar.total);
            this.updateStatCard('totalDisposisi', data.statistics.disposisi.total);
            this.updateStatCard('pendingDisposisi', data.pending_disposisi?.length || 0);

            // Update recent activities
            this.renderRecentSuratMasuk(data.recent_activities.surat_masuk);
            this.renderRecentSuratKeluar(data.recent_activities.surat_keluar);
            this.renderPendingDisposisi(data.pending_disposisi);
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    /**
     * Load chart data
     */
    async loadChart() {
        try {
            const response = await axios.get('/dashboard/chart');
            const data = response.data.data;

            this.renderChart(data);
        } catch (error) {
            console.error('Error loading chart:', error);
        }
    }

    /**
     * Load recent activities
     */
    async loadRecentActivities() {
        // Already loaded in loadStatistics
    }

    /**
     * Update stat card
     */
    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            // Animate number
            this.animateNumber(element, 0, value, 1000);
        }
    }

    /**
     * Animate number
     */
    animateNumber(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const animate = () => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                element.textContent = app.formatNumber(end);
                return;
            }
            element.textContent = app.formatNumber(Math.floor(current));
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    /**
     * Render chart
     */
    renderChart(data) {
        const ctx = document.getElementById('suratChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.surat) {
            this.charts.surat.destroy();
        }

        this.charts.surat = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Statistik Surat per Bulan'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    /**
     * Render recent surat masuk
     */
    renderRecentSuratMasuk(data) {
        const container = document.getElementById('recentSuratMasuk');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-3">Tidak ada surat masuk terbaru</p>';
            return;
        }

        container.innerHTML = data.map(surat => `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${surat.perihal}</h6>
                    <small class="text-muted">${app.timeAgo(surat.created_at)}</small>
                </div>
                <p class="mb-1">
                    <small>
                        <strong>${surat.pengirim}</strong> | 
                        ${surat.nomor_surat}
                    </small>
                </p>
                <span class="badge bg-${this.getStatusColor(surat.status)}">${surat.status}</span>
            </div>
        `).join('');
    }

    /**
     * Render recent surat keluar
     */
    renderRecentSuratKeluar(data) {
        const container = document.getElementById('recentSuratKeluar');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-3">Tidak ada surat keluar terbaru</p>';
            return;
        }

        container.innerHTML = data.map(surat => `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${surat.perihal}</h6>
                    <small class="text-muted">${app.timeAgo(surat.created_at)}</small>
                </div>
                <p class="mb-1">
                    <small>
                        <strong>${surat.tujuan}</strong> | 
                        ${surat.nomor_surat}
                    </small>
                </p>
                <span class="badge bg-${this.getStatusColor(surat.status)}">${surat.status}</span>
            </div>
        `).join('');
    }

    /**
     * Render pending disposisi
     */
    renderPendingDisposisi(data) {
        const container = document.getElementById('pendingDisposisi');
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-3">Tidak ada disposisi pending</p>';
            return;
        }

        container.innerHTML = data.map(disp => `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${disp.surat_masuk?.perihal || 'Tidak ada perihal'}</h6>
                    <small class="text-danger">
                        ${disp.batas_waktu ? `Deadline: ${app.formatDate(disp.batas_waktu)}` : ''}
                    </small>
                </div>
                <p class="mb-1">
                    <small>Dari: ${disp.dari_user?.nama_lengkap || '-'}</small>
                </p>
                <p class="mb-1 text-muted">${disp.instruksi.substring(0, 100)}...</p>
                <a href="/disposisi/${disp.id}" class="btn btn-sm btn-primary">Proses</a>
            </div>
        `).join('');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.init());
        }

        // Year filter
        const yearFilter = document.getElementById('yearFilter');
        if (yearFilter) {
            yearFilter.addEventListener('change', async (e) => {
                const year = e.target.value;
                try {
                    const response = await axios.get(`/dashboard/chart?tahun=${year}`);
                    this.renderChart(response.data.data);
                } catch (error) {
                    console.error('Error updating chart:', error);
                }
            });
        }
    }

    /**
     * Get status color
     */
    getStatusColor(status) {
        const colors = {
            'draft': 'secondary',
            'diterima': 'info',
            'didisposisikan': 'warning',
            'selesai': 'success',
            'arsip': 'dark',
            'dikirim': 'primary'
        };
        return colors[status] || 'secondary';
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('suratChart')) {
        window.dashboard = new Dashboard();
    }
});
