// Surat Management JavaScript
class SuratManager {
    constructor() {
        this.currentPage = 1;
        this.perPage = 20;
        this.filters = {};
        this.init();
    }

    /**
     * Initialize
     */
    init() {
        this.loadSurat();
        this.setupEventListeners();
        this.setupForm();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('searchSurat');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadSurat();
                }, 500);
            });
        }

        // Filter changes
        document.querySelectorAll('.filter-surat').forEach(filter => {
            filter.addEventListener('change', (e) => {
                this.filters[e.target.name] = e.target.value;
                this.currentPage = 1;
                this.loadSurat();
            });
        });

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.matches('.page-link')) {
                e.preventDefault();
                const page = e.target.dataset.page;
                if (page) {
                    this.currentPage = parseInt(page);
                    this.loadSurat();
                }
            }
        });

        // Delete button
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.btn-delete-surat') || e.target.closest('.btn-delete-surat')) {
                e.preventDefault();
                const btn = e.target.closest('.btn-delete-surat');
                const id = btn.dataset.id;
                await this.deleteSurat(id);
            }
        });

        // Export PDF
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn-export-pdf') || e.target.closest('.btn-export-pdf')) {
                e.preventDefault();
                const btn = e.target.closest('.btn-export-pdf');
                const id = btn.dataset.id;
                this.exportPDF(id);
            }
        });
    }

    /**
     * Setup form
     */
    setupForm() {
        const form = document.getElementById('suratForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveSurat(form);
        });

        // File upload preview
        const fileInput = document.getElementById('fileSurat');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const preview = document.getElementById('filePreview');
                    if (preview) {
                        preview.innerHTML = `
                            <div class="alert alert-info">
                                <i class="bi bi-file-earmark"></i>
                                ${file.name} (${this.formatFileSize(file.size)})
                            </div>
                        `;
                    }
                }
            });
        }
    }

    /**
     * Load surat
     */
    async loadSurat() {
        try {
            app.showLoading('#suratTable');
            
            const params = {
                page: this.currentPage,
                perPage: this.perPage,
                ...this.filters
            };

            const response = await axios.get('/surat-masuk', { params });
            const data = response.data.data;

            this.renderTable(data.data);
            this.renderPagination(data.pagination);
            
            app.hideLoading('#suratTable');
        } catch (error) {
            app.hideLoading('#suratTable');
            app.showAlert('Gagal memuat data surat', 'danger');
            console.error('Error loading surat:', error);
        }
    }

    /**
     * Render table
     */
    renderTable(data) {
        const tbody = document.querySelector('#suratTable tbody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5">
                        <i class="bi bi-inbox fs-1 text-muted"></i>
                        <p class="text-muted mt-2">Tidak ada data surat</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map((surat, index) => `
            <tr>
                <td>${(this.currentPage - 1) * this.perPage + index + 1}</td>
                <td>${surat.nomor_agenda || '-'}</td>
                <td>${surat.nomor_surat}</td>
                <td>${app.formatDate(surat.tanggal_surat)}</td>
                <td>${surat.pengirim}</td>
                <td>${surat.perihal}</td>
                <td>
                    <span class="badge bg-${this.getStatusColor(surat.status)}">
                        ${surat.status.toUpperCase()}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <a href="/surat-masuk/${surat.id}" class="btn btn-info" title="Detail">
                            <i class="bi bi-eye"></i>
                        </a>
                        <a href="/surat-masuk/${surat.id}/edit" class="btn btn-warning" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </a>
                        <button class="btn btn-danger btn-delete-surat" data-id="${surat.id}" title="Hapus">
                            <i class="bi bi-trash"></i>
                        </button>
                        <button class="btn btn-secondary btn-export-pdf" data-id="${surat.id}" title="Export PDF">
                            <i class="bi bi-file-pdf"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render pagination
     */
    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        if (!container) return;

        if (pagination.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<nav><ul class="pagination justify-content-center">';
        
        // Previous button
        html += `
            <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pagination.currentPage - 1}">Previous</a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= pagination.totalPages; i++) {
            if (
                i === 1 || 
                i === pagination.totalPages || 
                (i >= pagination.currentPage - 2 && i <= pagination.currentPage + 2)
            ) {
                html += `
                    <li class="page-item ${i === pagination.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === pagination.currentPage - 3 || i === pagination.currentPage + 3) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Next button
        html += `
            <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pagination.currentPage + 1}">Next</a>
            </li>
        `;

        html += '</ul></nav>';
        container.innerHTML = html;
    }

    /**
     * Save surat
     */
    async saveSurat(form) {
        try {
            app.showLoading();
            
            const formData = new FormData(form);
            const id = formData.get('id');
            
            let response;
            if (id) {
                response = await axios.put(`/surat-masuk/${id}`, Object.fromEntries(formData));
            } else {
                response = await axios.post('/surat-masuk', Object.fromEntries(formData));
            }

            app.hideLoading();
            app.showAlert('Data surat berhasil disimpan', 'success');
            
            setTimeout(() => {
                window.location.href = '/surat-masuk';
            }, 1500);
        } catch (error) {
            app.hideLoading();
            const message = error.response?.data?.message || 'Gagal menyimpan data surat';
            app.showAlert(message, 'danger');
            console.error('Error saving surat:', error);
        }
    }

    /**
     * Delete surat
     */
    async deleteSurat(id) {
        const confirmed = await app.confirm('Apakah Anda yakin ingin menghapus surat ini?');
        if (!confirmed) return;

        try {
            app.showLoading();
            await axios.delete(`/surat-masuk/${id}`);
            app.hideLoading();
            app.showAlert('Surat berhasil dihapus', 'success');
            this.loadSurat();
        } catch (error) {
            app.hideLoading();
            const message = error.response?.data?.message || 'Gagal menghapus surat';
            app.showAlert(message, 'danger');
            console.error('Error deleting surat:', error);
        }
    }

    /**
     * Export PDF
     */
    async exportPDF(id) {
        try {
            const response = await axios.get(`/surat-masuk/${id}/export-pdf`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `surat-masuk-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            app.showAlert('Gagal mengexport PDF', 'danger');
            console.error('Error exporting PDF:', error);
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

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize surat manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('suratTable')) {
        window.suratManager = new SuratManager();
    }
});
