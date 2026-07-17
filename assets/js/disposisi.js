// Disposisi Manager
class DisposisiManager {
    async render() {
        const data = await this.getDisposisiData();
        this.renderDisposisiTable(data);
    }

    async getDisposisiData() {
        try {
            const result = await apiService.getDisposisi();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching disposisi:', error);
            return [];
        }
    }

    renderDisposisiTable(data) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="disposisi-container">
                <div class="page-header">
                    <h2><i class="fas fa-exchange-alt"></i> Manajemen Disposisi</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="showAddDisposisiForm()">
                            <i class="fas fa-plus"></i> Buat Disposisi
                        </button>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nomor Surat</th>
                                <th>Dari</th>
                                <th>Kepada</th>
                                <th>Instruksi</th>
                                <th>Status</th>
                                <th>Tanggal</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data && data.length > 0 ? 
                                data.map((item, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${item.nomor_surat}</td>
                                        <td>${item.dari}</td>
                                        <td>${item.kepada}</td>
                                        <td>${item.instruksi}</td>
                                        <td><span class="badge badge-${this.getStatusClass(item.status)}">
                                            ${item.status}
                                        </span></td>
                                        <td>${this.formatDate(item.tanggal)}</td>
                                        <td>
                                            <button class="btn btn-sm btn-info" 
                                                    onclick="viewDisposisi('${item.id}')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-success" 
                                                    onclick="approveDisposisi('${item.id}')">
                                                <i class="fas fa-check"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('') :
                                '<tr><td colspan="8" class="text-center">Tidak ada data disposisi</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    getStatusClass(status) {
        const classes = {
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'danger',
            'completed': 'info'
        };
        return classes[status] || 'secondary';
    }
}

// Global instance
const disposisiRenderer = new DisposisiManager();

// Global functions
function showAddDisposisiForm() {
    app.showNotification('Form disposisi akan ditampilkan', 'info');
}

function viewDisposisi(id) {
    app.showNotification(`Melihat detail disposisi ID: ${id}`, 'info');
}

function approveDisposisi(id) {
    if (confirm('Setujui disposisi ini?')) {
        apiService.updateDisposisi(id, { status: 'approved' }).then(result => {
            if (result.success) {
                app.showNotification('Disposisi disetujui', 'success');
                disposisiRenderer.render();
            } else {
                app.showNotification('Gagal menyetujui disposisi', 'error');
            }
        });
    }
}
