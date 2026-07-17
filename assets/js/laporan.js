// Laporan Manager
class LaporanManager {
    async render() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="laporan-container">
                <div class="page-header">
                    <h2><i class="fas fa-chart-bar"></i> Laporan</h2>
                </div>

                <div class="report-cards">
                    <div class="report-card">
                        <div class="card-icon">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <div class="card-content">
                            <h3>Laporan Surat Masuk</h3>
                            <p>Generate laporan surat masuk per periode</p>
                            <button class="btn btn-primary" onclick="generateLaporan('surat-masuk')">
                                <i class="fas fa-download"></i> Generate
                            </button>
                        </div>
                    </div>

                    <div class="report-card">
                        <div class="card-icon">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <div class="card-content">
                            <h3>Laporan Surat Keluar</h3>
                            <p>Generate laporan surat keluar per periode</p>
                            <button class="btn btn-primary" onclick="generateLaporan('surat-keluar')">
                                <i class="fas fa-download"></i> Generate
                            </button>
                        </div>
                    </div>

                    <div class="report-card">
                        <div class="card-icon">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <div class="card-content">
                            <h3>Laporan Disposisi</h3>
                            <p>Generate laporan disposisi per periode</p>
                            <button class="btn btn-primary" onclick="generateLaporan('disposisi')">
                                <i class="fas fa-download"></i> Generate
                            </button>
                        </div>
                    </div>

                    <div class="report-card">
                        <div class="card-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="card-content">
                            <h3>Statistik</h3>
                            <p>Lihat statistik dan grafik surat menyurat</p>
                            <button class="btn btn-primary" onclick="showStatistics()">
                                <i class="fas fa-chart-bar"></i> Lihat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Global instance
const laporanRenderer = new LaporanManager();

// Global functions
async function generateLaporan(type) {
    app.showNotification(`Mengenerate laporan ${type}...`, 'info');
    
    try {
        const result = await apiService.generateReport(type);
        if (result.success) {
            app.showNotification('Laporan berhasil digenerate', 'success');
            // Handle download
        } else {
            app.showNotification('Gagal mengenerate laporan', 'error');
        }
    } catch (error) {
        app.showNotification('Terjadi kesalahan', 'error');
    }
}

function showStatistics() {
    app.showNotification('Menampilkan statistik...', 'info');
}
