/* ============================================
   ENTERPRISE SURAT MODULE
   ============================================ */
(function() {
    'use strict';

    class SuratModule {
        constructor() {
            this.currentType = 'masuk'; // 'masuk' or 'keluar'
            this.currentPage = 1;
            this.pageSize = 20;
            this.filters = {};
            this.sortField = 'tanggal_surat';
            this.sortOrder = 'desc';
        }

        async showList(type) {
            this.currentType = type;
            const container = document.getElementById('surat-list-content');
            if (!container) return;

            const title = type === 'masuk' ? 'Surat Masuk' : 'Surat Keluar';
            document.getElementById('page-title').textContent = `Daftar ${title}`;

            container.innerHTML = this.getListTemplate();
            await this.loadData();
            this.setupListEvents();
        }

        getListTemplate() {
            return `
                <div class="toolbar">
                    <div class="search-box">
                        <input type="text" class="search-input" placeholder="Cari surat..." id="search-surat">
                        <button class="btn-icon" id="btn-search">
                            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
                        </button>
                    </div>
                    <div class="filter-group">
                        <select id="filter-status" class="form-control">
                            <option value="">Semua Status</option>
                            <option value="baru">Baru</option>
                            <option value="diproses">Diproses</option>
                            <option value="selesai">Selesai</option>
                            <option value="ditolak">Ditolak</option>
                        </select>
                        <input type="date" id="filter-date-from" class="form-control" placeholder="Dari">
                        <input type="date" id="filter-date-to" class="form-control" placeholder="Sampai">
                        <button class="btn btn-secondary" id="btn-reset-filter">Reset</button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table" id="surat-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th class="sortable" data-sort="nomor_surat">Nomor Surat</th>
                                <th class="sortable" data-sort="tanggal_surat">Tanggal</th>
                                <th>Perihal</th>
                                <th>${this.currentType === 'masuk' ? 'Pengirim' : 'Penerima'}</th>
                                <th class="sortable" data-sort="status">Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="surat-table-body">
                            <tr><td colspan="7" class="text-center">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="pagination" id="surat-pagination"></div>
                <div class="bulk-actions" id="bulk-actions" style="display:none">
                    <span id="selected-count">0 terpilih</span>
                    <button class="btn btn-danger btn-sm" id="btn-delete-bulk">Hapus Terpilih</button>
                </div>
            `;
        }

        async loadData() {
            const tbody = document.getElementById('surat-table-body');
            if (!tbody) return;

            try {
                const store = this.currentType === 'masuk' ? 'surat_masuk' : 'surat_keluar';
                let data = await DB.getAll(store);

                // Apply filters
                if (this.filters.status) {
                    data = data.filter(item => item.status === this.filters.status);
                }
                if (this.filters.dateFrom) {
                    data = data.filter(item => item.tanggal_surat >= this.filters.dateFrom);
                }
                if (this.filters.dateTo) {
                    data = data.filter(item => item.tanggal_surat <= this.filters.dateTo);
                }
                if (this.filters.search) {
                    const searchTerm = this.filters.search.toLowerCase();
                    data = data.filter(item =>
                        item.nomor_surat?.toLowerCase().includes(searchTerm) ||
                        item.perihal?.toLowerCase().includes(searchTerm) ||
                        item.pengirim?.toLowerCase().includes(searchTerm) ||
                        item.penerima?.toLowerCase().includes(searchTerm)
                    );
                }

                // Apply sorting
                data.sort((a, b) => {
                    let valA = a[this.sortField] || '';
                    let valB = b[this.sortField] || '';
                    
                    if (this.sortField === 'tanggal_surat') {
                        valA = new Date(valA);
                        valB = new Date(valB);
                    }
                    
                    if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
                    if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
                    return 0;
                });

                // Pagination
                const totalItems = data.length;
                const totalPages = Math.ceil(totalItems / this.pageSize);
                const start = (this.currentPage - 1) * this.pageSize;
                const paginatedData = data.slice(start, start + this.pageSize);

                // Render table
                if (paginatedData.length === 0) {
                    tbody.innerHTML = `
                        <tr><td colspan="7" class="text-center">
                            <div class="empty-state">
                                <p>Tidak ada data surat</p>
                            </div>
                        </td></tr>`;
                } else {
                    tbody.innerHTML = paginatedData.map((item, index) => `
                        <tr data-id="${item.id}">
                            <td>${start + index + 1}</td>
                            <td>${item.nomor_surat || '-'}</td>
                            <td>${this.formatDate(item.tanggal_surat)}</td>
                            <td>${item.perihal || '-'}</td>
                            <td>${this.currentType === 'masuk' ? (item.pengirim || '-') : (item.penerima || '-')}</td>
                            <td><span class="badge badge-${item.status || 'baru'}">${this.formatStatus(item.status)}</span></td>
                            <td class="action-buttons">
                                <button class="btn-icon btn-view" data-id="${item.id}" title="Lihat">
                                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/></svg>
                                </button>
                                <button class="btn-icon btn-edit" data-id="${item.id}" title="Edit">
                                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
                                </button>
                                <button class="btn-icon btn-delete" data-id="${item.id}" title="Hapus">
                                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                                </button>
                            </td>
                        </tr>
                    `).join('');
                }

                // Render pagination
                this.renderPagination(totalPages, totalItems);

            } catch (error) {
                Logger.error('Failed to load surat data:', error);
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Gagal memuat data</td></tr>`;
            }
        }

        renderPagination(totalPages, totalItems) {
            const pagination = document.getElementById('surat-pagination');
            if (!pagination || totalPages <= 1) {
                if (pagination) pagination.innerHTML = '';
                return;
            }

            let html = `
                <div class="pagination-info">
                    Total: ${totalItems} data
                </div>
                <div class="pagination-buttons">
                    <button class="btn-page" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                        Sebelumnya
                    </button>
            `;

            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                if (
                    i === 1 || 
                    i === totalPages || 
                    (i >= this.currentPage - 2 && i <= this.currentPage + 2)
                ) {
                    html += `
                        <button class="btn-page ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                            ${i}
                        </button>
                    `;
                } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                    html += '<span class="page-dots">...</span>';
                }
            }

            html += `
                    <button class="btn-page" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                        Selanjutnya
                    </button>
                </div>
            `;

            pagination.innerHTML = html;

            // Add click handlers
            pagination.querySelectorAll('.btn-page').forEach(btn => {
                btn.addEventListener('click', () => {
                    const page = parseInt(btn.dataset.page);
                    if (page && page !== this.currentPage) {
                        this.currentPage = page;
                        this.loadData();
                    }
                });
            });
        }

        setupListEvents() {
            // Search
            const searchInput = document.getElementById('search-surat');
            if (searchInput) {
                let searchTimeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        this.filters.search = e.target.value;
                        this.currentPage = 1;
                        this.loadData();
                    }, 300);
                });
            }

            // Filter status
            const filterStatus = document.getElementById('filter-status');
            if (filterStatus) {
                filterStatus.addEventListener('change', (e) => {
                    this.filters.status = e.target.value;
                    this.currentPage = 1;
                    this.loadData();
                });
            }

            // Filter date
            document.getElementById('filter-date-from')?.addEventListener('change', (e) => {
                this.filters.dateFrom = e.target.value;
                this.currentPage = 1;
                this.loadData();
            });

            document.getElementById('filter-date-to')?.addEventListener('change', (e) => {
                this.filters.dateTo = e.target.value;
                this.currentPage = 1;
                this.loadData();
            });

            // Reset filter
            document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
                this.filters = {};
                this.currentPage = 1;
                document.getElementById('search-surat').value = '';
                document.getElementById('filter-status').value = '';
                document.getElementById('filter-date-from').value = '';
                document.getElementById('filter-date-to').value = '';
                this.loadData();
            });

            // Sort
            document.querySelectorAll('.sortable').forEach(th => {
                th.addEventListener('click', () => {
                    const field = th.dataset.sort;
                    if (this.sortField === field) {
                        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                    } else {
                        this.sortField = field;
                        this.sortOrder = 'asc';
                    }
                    this.loadData();
                });
            });

            // View/Edit/Delete buttons (using event delegation)
            document.getElementById('surat-table-body')?.addEventListener('click', async (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const id = parseInt(btn.dataset.id);
                
                if (btn.classList.contains('btn-view')) {
                    Router.navigate(`/${this.currentType === 'masuk' ? 'surat-masuk' : 'surat-keluar'}?id=${id}`);
                } else if (btn.classList.contains('btn-edit')) {
                    Router.navigate(`/${this.currentType === 'masuk' ? 'surat-masuk' : 'surat-keluar'}?action=edit&id=${id}`);
                } else if (btn.classList.contains('btn-delete')) {
                    await this.deleteSurat(id);
                }
            });
        }

        async showForm(type) {
            this.currentType = type;
            const container = document.getElementById('surat-form-content');
            if (!container) return;

            const isEdit = Router.getCurrentParams().action === 'edit';
            const id = parseInt(Router.getCurrentParams().id);
            
            container.innerHTML = this.getFormTemplate(isEdit);
            
            if (isEdit && id) {
                await this.loadFormData(id);
            }

            this.setupFormEvents(isEdit, id);
        }

        getFormTemplate(isEdit) {
            const title = this.currentType === 'masuk' ? 'Surat Masuk' : 'Surat Keluar';
            
            return `
                <form id="surat-form" class="enterprise-form">
                    <div class="form-card">
                        <h3>${isEdit ? 'Edit' : 'Tambah'} ${title}</h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nomor Surat *</label>
                                <input type="text" id="nomor_surat" class="form-control" required 
                                       placeholder="Masukkan nomor surat">
                            </div>
                            <div class="form-group">
                                <label>Tanggal Surat *</label>
                                <input type="date" id="tanggal_surat" class="form-control" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Perihal *</label>
                            <input type="text" id="perihal" class="form-control" required 
                                   placeholder="Masukkan perihal surat">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>${this.currentType === 'masuk' ? 'Pengirim *' : 'Penerima *'}</label>
                                <input type="text" id="pihak" class="form-control" required 
                                       placeholder="${this.currentType === 'masuk' ? 'Nama pengirim' : 'Nama penerima'}">
                            </div>
                            <div class="form-group">
                                <label>${this.currentType === 'masuk' ? 'Asal Surat' : 'Tujuan Surat'}</label>
                                <input type="text" id="instansi" class="form-control" 
                                       placeholder="Instansi terkait">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Status</label>
                            <select id="status" class="form-control">
                                <option value="baru">Baru</option>
                                <option value="diproses">Diproses</option>
                                <option value="selesai">Selesai</option>
                                <option value="ditolak">Ditolak</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Keterangan</label>
                            <textarea id="keterangan" class="form-control" rows="3" 
                                      placeholder="Keterangan tambahan"></textarea>
                        </div>

                        <div class="form-group">
                            <label>Upload File</label>
                            <div class="file-upload">
                                <input type="file" id="file-surat" class="form-control-file" 
                                       accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
                                <small>Format: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</small>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="history.back()">
                                Batal
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${isEdit ? 'Update' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </form>
            `;
        }

        async loadFormData(id) {
            try {
                const store = this.currentType === 'masuk' ? 'surat_masuk' : 'surat_keluar';
                const data = await DB.getById(store, id);
                
                if (data) {
                    document.getElementById('nomor_surat').value = data.nomor_surat || '';
                    document.getElementById('tanggal_surat').value = data.tanggal_surat || '';
                    document.getElementById('perihal').value = data.perihal || '';
                    document.getElementById('pihak').value = this.currentType === 'masuk' ? 
                        (data.pengirim || '') : (data.penerima || '');
                    document.getElementById('instansi').value = this.currentType === 'masuk' ? 
                        (data.asal_surat || '') : (data.tujuan_surat || '');
                    document.getElementById('status').value = data.status || 'baru';
                    document.getElementById('keterangan').value = data.keterangan || '';
                }
            } catch (error) {
                Logger.error('Failed to load form data:', error);
                showToast('Gagal memuat data surat', 'error');
            }
        }

        setupFormEvents(isEdit, id) {
            const form = document.getElementById('surat-form');
            if (!form) return;

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveSurat(isEdit, id);
            });
        }

        async saveSurat(isEdit, id) {
            try {
                Spinner.show('Menyimpan surat...');

                const formData = {
                    nomor_surat: document.getElementById('nomor_surat').value,
                    tanggal_surat: document.getElementById('tanggal_surat').value,
                    perihal: document.getElementById('perihal').value,
                    status: document.getElementById('status').value,
                    keterangan: document.getElementById('keterangan').value
                };

                if (this.currentType === 'masuk') {
                    formData.pengirim = document.getElementById('pihak').value;
                    formData.asal_surat = document.getElementById('instansi').value;
                } else {
                    formData.penerima = document.getElementById('pihak').value;
                    formData.tujuan_surat = document.getElementById('instansi').value;
                }

                // Handle file upload
                const fileInput = document.getElementById('file-surat');
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const uploadResult = await API.uploadFile(file, {
                        type: 'surat',
                        category: this.currentType
                    });
                    formData.file_url = uploadResult.url;
                }

                const store = this.currentType === 'masuk' ? 'surat_masuk' : 'surat_keluar';
                
                if (isEdit && id) {
                    await DB.update(store, id, formData);
                    showToast('Surat berhasil diperbarui', 'success');
                } else {
                    await DB.add(store, formData);
                    showToast('Surat berhasil disimpan', 'success');
                }

                // Redirect to list
                Router.navigate(`/${this.currentType === 'masuk' ? 'surat-masuk' : 'surat-keluar'}`);

            } catch (error) {
                Logger.error('Failed to save surat:', error);
                showToast('Gagal menyimpan surat: ' + error.message, 'error');
            } finally {
                Spinner.hide();
            }
        }

        async showDetail(type, id) {
            this.currentType = type;
            const container = document.getElementById('surat-detail-content');
            if (!container) return;

            try {
                const store = type === 'masuk' ? 'surat_masuk' : 'surat_keluar';
                const data = await DB.getById(store, id);

                if (!data) {
                    container.innerHTML = '<div class="error-state">Data tidak ditemukan</div>';
                    return;
                }

                container.innerHTML = `
                    <div class="detail-card">
                        <div class="detail-header">
                            <h3>Detail ${type === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}</h3>
                            <div class="detail-actions">
                                <button class="btn btn-secondary" onclick="Router.navigate('/${type === 'masuk' ? 'surat-masuk' : 'surat-keluar'}?action=edit&id=${id}')">
                                    Edit
                                </button>
                                <button class="btn btn-primary" onclick="window.print()">
                                    Cetak
                                </button>
                            </div>
                        </div>
                        <div class="detail-body">
                            <table class="detail-table">
                                <tr><td class="label">Nomor Surat</td><td>: ${data.nomor_surat || '-'}</td></tr>
                                <tr><td class="label">Tanggal Surat</td><td>: ${this.formatDate(data.tanggal_surat)}</td></tr>
                                <tr><td class="label">Perihal</td><td>: ${data.perihal || '-'}</td></tr>
                                <tr><td class="label">${type === 'masuk' ? 'Pengirim' : 'Penerima'}</td><td>: ${type === 'masuk' ? (data.pengirim || '-') : (data.penerima || '-')}</td></tr>
                                <tr><td class="label">${type === 'masuk' ? 'Asal Surat' : 'Tujuan Surat'}</td><td>: ${type === 'masuk' ? (data.asal_surat || '-') : (data.tujuan_surat || '-')}</td></tr>
                                <tr><td class="label">Status</td><td>: <span class="badge badge-${data.status}">${this.formatStatus(data.status)}</span></td></tr>
                                <tr><td class="label">Keterangan</td><td>: ${data.keterangan || '-'}</td></tr>
                                <tr><td class="label">Tanggal Dibuat</td><td>: ${this.formatDateTime(data.created_at)}</td></tr>
                                <tr><td class="label">Terakhir Diupdate</td><td>: ${this.formatDateTime(data.updated_at)}</td></tr>
                            </table>
                            
                            ${data.file_url ? `
                                <div class="file-preview">
                                    <h4>File Surat</h4>
                                    <a href="${data.file_url}" target="_blank" class="btn btn-secondary">
                                        Download File
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;

            } catch (error) {
                Logger.error('Failed to load surat detail:', error);
                container.innerHTML = '<div class="error-state">Gagal memuat detail surat</div>';
            }
        }

        async deleteSurat(id) {
            const confirmed = await App.showConfirm(
                'Apakah Anda yakin ingin menghapus surat ini?',
                'Konfirmasi Hapus'
            );

            if (confirmed) {
                try {
                    const store = this.currentType === 'masuk' ? 'surat_masuk' : 'surat_keluar';
                    await DB.delete(store, id);
                    showToast('Surat berhasil dihapus', 'success');
                    await this.loadData();
                } catch (error) {
                    Logger.error('Failed to delete surat:', error);
                    showToast('Gagal menghapus surat', 'error');
                }
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

        formatDateTime(dateString) {
            if (!dateString) return '-';
            return new Date(dateString).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        formatStatus(status) {
            const statusMap = {
                'baru': 'Baru',
                'diproses': 'Diproses',
                'selesai': 'Selesai',
                'ditolak': 'Ditolak'
            };
            return statusMap[status] || status;
        }
    }

    // Initialize Global Surat Module
    window.Surat = new SuratModule();
    Logger.info('Surat module loaded');
})();
