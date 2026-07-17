// Surat Management Class
class SuratManager {
    constructor() {
        this.currentPage = 1;
        this.perPage = APP_CONFIG.pagination.perPage;
        this.filters = {};
    }

    async renderSuratMasuk() {
        const data = await this.getSuratMasukData();
        this.renderSuratMasukTable(data);
    }

    async renderSuratKeluar() {
        const data = await this.getSuratKeluarData();
        this.renderSuratKeluarTable(data);
    }

    async getSuratMasukData() {
        try {
            const params = {
                page: this.currentPage,
                perPage: this.perPage,
                ...this.filters
            };
            const result = await apiService.getSuratMasuk(params);
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching surat masuk:', error);
            return [];
        }
    }

    async getSuratKeluarData() {
        try {
            const params = {
                page: this.currentPage,
                perPage: this.perPage,
                ...this.filters
            };
            const result = await apiService.getSuratKeluar(params);
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching surat keluar:', error);
            return [];
        }
    }

    renderSuratMasukTable(data) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="surat-container">
                <div class="page-header">
                    <h2><i class="fas fa-envelope"></i> Surat Masuk</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="showAddSuratMasukForm()">
                            <i class="fas fa-plus"></i> Tambah Surat Masuk
                        </button>
                        <button class="btn btn-success" onclick="exportData('surat-masuk')">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>

                <div class="search-filter">
                    <div class="search-box">
                        <input type="text" id="searchSuratMasuk" 
                               placeholder="Cari surat masuk..." 
                               onkeyup="handleSearchSuratMasuk(event)">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="filter-group">
                        <select id="filterStatus" onchange="filterSuratMasuk()">
                            <option value="">Semua Status</option>
                            <option value="baru">Baru</option>
                            <option value="proses">Proses</option>
                            <option value="selesai">Selesai</option>
                        </select>
                        <input type="date" id="filterDate" onchange="filterSuratMasuk()">
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nomor Surat</th>
                                <th>Tanggal</th>
                                <th>Pengirim</th>
                                <th>Perihal</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data && data.length > 0 ? 
                                data.map((item, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${item.nomor_surat}</td>
                                        <td>${this.formatDate(item.tanggal_surat)}</td>
                                        <td>${item.pengirim}</td>
                                        <td>${item.perihal}</td>
                                        <td><span class="badge badge-${this.getStatusClass(item.status)}">
                                            ${item.status}
                                        </span></td>
                                        <td>
                                            <button class="btn btn-sm btn-info" 
                                                    onclick="viewSuratMasuk('${item.id}')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-warning" 
                                                    onclick="editSuratMasuk('${item.id}')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" 
                                                    onclick="deleteSuratMasuk('${item.id}')">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('') :
                                '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="suratMasukPagination">
                    <!-- Pagination will be rendered here -->
                </div>
            </div>
        `;

        this.renderPagination('suratMasukPagination', data.total || 0);
    }

    renderSuratKeluarTable(data) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="surat-container">
                <div class="page-header">
                    <h2><i class="fas fa-paper-plane"></i> Surat Keluar</h2>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="showAddSuratKeluarForm()">
                            <i class="fas fa-plus"></i> Tambah Surat Keluar
                        </button>
                        <button class="btn btn-success" onclick="exportData('surat-keluar')">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>

                <div class="search-filter">
                    <div class="search-box">
                        <input type="text" id="searchSuratKeluar" 
                               placeholder="Cari surat keluar..." 
                               onkeyup="handleSearchSuratKeluar(event)">
                        <i class="fas fa-search"></i>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nomor Surat</th>
                                <th>Tanggal</th>
                                <th>Tujuan</th>
                                <th>Perihal</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data && data.length > 0 ? 
                                data.map((item, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${item.nomor_surat}</td>
                                        <td>${this.formatDate(item.tanggal_surat)}</td>
                                        <td>${item.tujuan}</td>
                                        <td>${item.perihal}</td>
                                        <td>
                                            <button class="btn btn-sm btn-info" 
                                                    onclick="viewSuratKeluar('${item.id}')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-warning" 
                                                    onclick="editSuratKeluar('${item.id}')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" 
                                                    onclick="deleteSuratKeluar('${item.id}')">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('') :
                                '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>'
                            }
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="suratKeluarPagination">
                    <!-- Pagination will be rendered here -->
                </div>
            </div>
        `;

        this.renderPagination('suratKeluarPagination', data.total || 0);
    }

    showAddSuratMasukForm() {
        // Implementation for add form
        app.showNotification('Form tambah surat masuk akan ditampilkan', 'info');
    }

    showAddSuratKeluarForm() {
        // Implementation for add form
        app.showNotification('Form tambah surat keluar akan ditampilkan', 'info');
    }

    renderPagination(containerId, total) {
        const totalPages = Math.ceil(total / this.perPage);
        if (totalPages <= 1) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '<ul class="pagination-list">';
        
        // Previous button
        html += `
            <li class="${this.currentPage === 1 ? 'disabled' : ''}">
                <a href="#" onclick="changePage(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="${i === this.currentPage ? 'active' : ''}">
                    <a href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        }

        // Next button
        html += `
            <li class="${this.currentPage === totalPages ? 'disabled' : ''}">
                <a href="#" onclick="changePage(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        html += '</ul>';
        container.innerHTML = html;
    }

    changePage(page) {
        this.currentPage = page;
        if (app.currentPage === 'surat-masuk') {
            this.renderSuratMasuk();
        } else {
            this.renderSuratKeluar();
        }
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
            'baru': 'info',
            'proses': 'warning',
            'selesai': 'success'
        };
        return classes[status] || 'secondary';
    }
}

// Global instance
const suratRenderer = new SuratManager();

// Global functions
function showAddSuratMasukForm() {
    suratRenderer.showAddSuratMasukForm();
}

function showAddSuratKeluarForm() {
    suratRenderer.showAddSuratKeluarForm();
}

function handleSearchSuratMasuk(event) {
    if (event.key === 'Enter') {
        suratRenderer.filters.search = event.target.value;
        suratRenderer.renderSuratMasuk();
    }
}

function handleSearchSuratKeluar(event) {
    if (event.key === 'Enter') {
        suratRenderer.filters.search = event.target.value;
        suratRenderer.renderSuratKeluar();
    }
}

function filterSuratMasuk() {
    const status = document.getElementById('filterStatus').value;
    const date = document.getElementById('filterDate').value;
    
    suratRenderer.filters.status = status;
    suratRenderer.filters.date = date;
    suratRenderer.renderSuratMasuk();
}

function viewSuratMasuk(id) {
    app.showNotification(`Melihat detail surat masuk ID: ${id}`, 'info');
}

function editSuratMasuk(id) {
    app.showNotification(`Edit surat masuk ID: ${id}`, 'info');
}

function deleteSuratMasuk(id) {
    if (confirm('Apakah Anda yakin ingin menghapus surat ini?')) {
        apiService.deleteSuratMasuk(id).then(result => {
            if (result.success) {
                app.showNotification('Surat berhasil dihapus', 'success');
                suratRenderer.renderSuratMasuk();
            } else {
                app.showNotification('Gagal menghapus surat', 'error');
            }
        });
    }
}

function viewSuratKeluar(id) {
    app.showNotification(`Melihat detail surat keluar ID: ${id}`, 'info');
}

function editSuratKeluar(id) {
    app.showNotification(`Edit surat keluar ID: ${id}`, 'info');
}

function deleteSuratKeluar(id) {
    if (confirm('Apakah Anda yakin ingin menghapus surat ini?')) {
        apiService.deleteSuratKeluar(id).then(result => {
            if (result.success) {
                app.showNotification('Surat berhasil dihapus', 'success');
                suratRenderer.renderSuratKeluar();
            } else {
                app.showNotification('Gagal menghapus surat', 'error');
            }
        });
    }
}

function exportData(type) {
    app.showNotification(`Mengexport data ${type}...`, 'info');
}

function changePage(page) {
    suratRenderer.changePage(page);
}
