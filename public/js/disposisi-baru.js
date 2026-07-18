// Disposisi Management JavaScript
class DisposisiManager {
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
        this.loadDisposisi();
        this.setupEventListeners();
        this.setupForm();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('searchDisposisi');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadDisposisi();
                }, 500);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('filterStatus');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.currentPage = 1;
                this.loadDisposisi();
            });
        }

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.matches('.page-link')) {
                e.preventDefault();
                const page = e.target.dataset.page;
                if (page) {
                    this.currentPage = parseInt(page);
                    this.loadDisposisi();
                }
            }
        });

        // Process disposisi
        document.addEventListener('click', async (e) => {
            if (e.target.matches('.btn-process') || e.target.closest('.btn-process')) {
                e.preventDefault();
                const btn = e.target.closest('.btn-process');
                const id = btn.dataset.id;
                const status = btn.dataset.status;
                await this.updateStatus(id, status);
            }
        });

        // Batch process
        const batchBtn = document.getElementById('btnBatchProcess');
        if (batchBtn) {
            batchBtn.addEventListener('click', () => this.batchProcess());
        }
    }

    /**
     * Setup form
     */
    setupForm() {
        const form = document.getElementById('disposisiForm');
        if (!form) return;

        // Load surat masuk for dropdown
        this.loadSuratMasukForSelect();

        // Load users for dropdown
        this.loadUsersForSelect();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveDisposisi(form);
        });

        // Reply form
        const replyForm = document.getElementById('replyForm');
        if (replyForm) {
            replyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveReply(replyForm);
            });
        }
    }

    /**
     * Load surat masuk for select
     */
    async loadSuratMasukForSelect() {
        try {
            const response = await axios.get('/surat-masuk?status=diterima&perPage=100');
            const data = response.data.data.data;
            
            const select = document.getElementById('suratMasukId');
            if (!select) return;

            select.innerHTML = '<option value="">Pilih Surat Masuk</option>' +
                data.map(surat => `
                    <option value="${surat.id}">
                        ${surat.nomor_agenda} - ${surat.perihal} (${surat.pengirim})
                    </option>
                `).join('');
        } catch (error) {
            console.error('Error loading surat masuk:', error);
        }
    }

    /**
     * Load users for select
     */
    async loadUsersForSelect() {
        try {
            const response = await axios.get('/pengguna?perPage=100');
            const data = response.data.data.data;
            
            const select = document.getElementById('kepadaUserId');
            if (!select) return;

            select.innerHTML = '<option value="">Pilih Penerima</option>' +
                data.map(user => `
                    <option value="${user.id}">
                        ${user.nama_lengkap} - ${user.jabatan || 'Tanpa Jabatan'}
                    </option>
                `).join('');
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    /**
     * Load disposisi
     */
    async loadDisposisi() {
        try {
            app.showLoading('#disposisiTable');
            
            const params = {
                page: this.currentPage,
                perPage: this.perPage,
                ...this.filters
            };

            const response = await axios.get('/disposisi/my', { params });
            const data = response.data.data;

            this.renderTable(data.data);
            this.renderPagination(data.pagination);
            
            app.hideLoading('#disposisiTable');
        } catch (error) {
            app.hideLoading('#disposisiTable');
            app.showAlert('Gagal memuat data disposisi', 'danger');
            console.error('Error loading disposisi:', error);
        }
    }

    /**
     * Render table
     */
    renderTable(data) {
        const tbody = document.querySelector('#disposisiTable tbody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5">
                        <i class="bi bi-inbox fs-1 text-muted"></i>
                        <p class="text-muted mt-2">Tidak ada disposisi</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map((disp, index) => `
            <tr>
                <td>
                    <input type="checkbox" class="form-check-input disposisi-checkbox" value="${disp.id}">
                </td>
                <td>${(this.currentPage - 1) * this.perPage + index + 1}</td>
                <td>
                    <small>
                        <strong>${disp.surat_masuk?.perihal || '-'}</strong>
                        <br>
                        ${disp.surat_masuk?.nomor_surat || '-'}
                    </small>
                </td>
                <td>${disp.dari_user?.nama_lengkap || '-'}</td>
                <td>${disp.instruksi.substring(0, 50)}...</td>
                <td>${disp.batas_waktu ? app.formatDate(disp.batas_waktu) : '-'}</td>
                <td>
                    <span class="badge bg-${this.getStatusColor(disp.status)}">
                        ${disp.status.toUpperCase()}
                    </span>
                    <span class="badge bg-${this.getSifatColor(disp.sifat)}">
                        ${disp.sifat}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <a href="/disposisi/${disp.id}" class="btn btn-info" title="Detail">
                            <i class="bi bi-eye"></i>
                        </a>
                        ${disp.status === 'dikirim' ? `
                            <button class="btn btn-success btn-process" 
                                    data-id="${disp.id}" 
                                    data-status="diproses"
                                    title="Proses">
                                <i class="bi bi-check-circle"></i>
                            </button>
                            <button class="btn btn-danger btn-process" 
                                    data-id="${disp.id}" 
                                    data-status="selesai"
                                    title="Selesai">
                                <i class="bi bi-check-all"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-reply" 
                                data-id="${disp.id}"
                                title="Balas">
                            <i class="bi bi-reply"></i>
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
        
        html += `
            <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pagination.currentPage - 1}">Previous</a>
            </li>
        `;

        for (let i = 1; i <= pagination.totalPages; i++) {
            if (i === 1 || i === pagination.totalPages || 
                (i >= pagination.currentPage - 2 && i <= pagination.currentPage + 2)) {
                html += `
                    <li class="page-item ${i === pagination.currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === pagination.currentPage - 3 || i === pagination.currentPage + 3) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        html += `
            <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${pagination.currentPage + 1}">Next</a>
            </li>
        `;

        html += '</ul></nav>';
        container.innerHTML = html;
    }

    /**
     * Save disposisi
     */
    async saveDisposisi(form) {
        try {
            app.showLoading();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            await axios.post('/disposisi', data);
            
            app.hideLoading();
            app.showAlert('Disposisi berhasil dibuat', 'success');
            
            // Reset form
            form.reset();
            this.loadDisposisi();
        } catch (error) {
            app.hideLoading();
            const message = error.response?.data?.message || 'Gagal membuat disposisi';
            app.showAlert(message, 'danger');
            console.error('Error saving disposisi:', error);
        }
    }

    /**
     * Save reply
     */
    async saveReply(form) {
        try {
            app.showLoading();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            const disposisiId = document.getElementById('disposisiId').value;
            
            await axios.post(`/disposisi/${disposisiId}/reply`, data);
            
            app.hideLoading();
            app.showAlert('Balasan disposisi berhasil dikirim', 'success');
            
            form.reset();
            this.loadDisposisi();
        } catch (error) {
            app.hideLoading();
            const message = error.response?.data?.message || 'Gagal mengirim balasan';
            app.showAlert(message, 'danger');
            console.error('Error saving reply:', error);
        }
    }

    /**
     * Update status
     */
    async updateStatus(id, status) {
        try {
            app.showLoading();
            
            await axios.put(`/disposisi/${id}/status`, {
                status: status,
                catatan: `Disposisi di${status}kan`
            });
            
            app.hideLoading();
            app.showAlert(`Disposisi berhasil di${status}`, 'success');
            
            this.loadDisposisi();
        } catch (error) {
            app.hideLoading();
            const message = error.response?.data?.message || 'Gagal mengupdate status';
            app.showAlert(message, 'danger');
            console.error('Error updating status:', error);
        }
    }

    /**
     * Batch process
     */
    async batchProcess() {
        const checkboxes = document.querySelectorAll('.disposisi-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => cb.value);

        if (ids.length === 0) {
            app.showAlert('Pilih disposisi yang akan diproses', 'warning');
            return;
        }

        const confirmed = await app.confirm(`Proses ${ids.length} disposisi sekaligus?`);
        if (!confirmed) return;

        try {
            app.showLoading();
            
            await axios.post('/disposisi/batch-update', {
                ids: ids,
                status: 'selesai'
            });
            
            app.hideLoading();
            app.showAlert(`${ids.length} disposisi berhasil diproses`, 'success');
            
            this.loadDisposisi();
        } catch (error) {
            app.hideLoading();
            const message = error.response?.data?.message || 'Gagal memproses batch';
            app.showAlert(message, 'danger');
            console.error('Error batch processing:', error);
        }
    }

    /**
     * Get status color
     */
    getStatusColor(status) {
        const colors = {
            'draft': 'secondary',
            'dikirim': 'warning',
            'dibaca': 'info',
            'diproses': 'primary',
            'selesai': 'success'
        };
        return colors[status] || 'secondary';
    }

    /**
     * Get sifat color
     */
    getSifatColor(sifat) {
        const colors = {
            'biasa': 'secondary',
            'segera': 'warning',
            'penting': 'danger',
            'rahasia': 'dark'
        };
        return colors[sifat] || 'secondary';
    }
}

// Initialize disposisi manager
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('disposisiTable') || 
        document.getElementById('disposisiForm')) {
        window.disposisiManager = new DisposisiManager();
    }
});
