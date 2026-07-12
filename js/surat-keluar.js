/**
 * ============================================
 * SURAT-KELUAR.JS - Surat Keluar Module
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: Delete and Update with proper ID handling
 * ============================================
 */

const SuratKeluar = {
    data: [],
    currentPage: 1,
    totalPages: 1,
    filters: {},
    
    // ========== RENDER ==========
    async render(params = {}) {
        this.filters = params;
        this.currentPage = parseInt(params.page) || 1;
        
        return `
            <div class="surat-keluar-page">
                <!-- Toolbar -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
                        <div class="flex" style="gap: 8px; flex-wrap: wrap;">
                            <input type="text" id="skSearch" class="form-control" placeholder="Cari surat..." style="width: 250px;" />
                            <select id="skStatus" class="form-control" style="width: 150px;">
                                <option value="">Semua Status</option>
                                <option value="draft">Draft</option>
                                <option value="review">Review</option>
                                <option value="approved">Disetujui</option>
                                <option value="ttd">TTD</option>
                                <option value="dikirim">Dikirim</option>
                                <option value="arsip">Arsip</option>
                            </select>
                            <select id="skApproval" class="form-control" style="width: 150px;">
                                <option value="">Semua Approval</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                        </div>
                        <div class="flex" style="gap: 8px;">
                            <button class="btn btn-primary" id="skCreateBtn">
                                <i class="fas fa-plus"></i> Surat Keluar
                            </button>
                            <button class="btn btn-success" id="skRefreshBtn">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Table -->
                <div class="card">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nomor Surat</th>
                                    <th>Tanggal</th>
                                    <th>Tujuan</th>
                                    <th>Perihal</th>
                                    <th>Status</th>
                                    <th>Approval</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="skTableBody">
                                <tr><td colspan="7" class="text-center text-muted">Memuat data...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="skPagination" class="flex-center" style="margin-top: 16px;"></div>
                </div>
            </div>
        `;
    },
    
    // ========== INIT ==========
    init() {
        this.loadData();
        this.setupEventListeners();
    },
    
    // ========== LOAD DATA ==========
    async loadData() {
        try {
            const response = await API.get('suratKeluar.list', {
                token: App.token,
                page: this.currentPage,
                limit: 20,
                search: this.filters.search || '',
                status: this.filters.status || '',
                approvalStatus: this.filters.approval || ''
            });
            
            if (response.status === 'success') {
                this.data = response.data.items || [];
                this.totalPages = response.data.pagination?.totalPages || 1;
                this.renderTable();
                this.renderPagination();
            } else {
                showToast('error', 'Error', response.message || 'Gagal memuat data');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal memuat data surat keluar');
        }
    },
    
    // ========== RENDER TABLE ==========
    renderTable() {
        const tbody = document.getElementById('skTableBody');
        
        if (this.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Tidak ada data</td></tr>`;
            return;
        }
        
        tbody.innerHTML = this.data.map(item => `
            <tr>
                <td>${item.nomorSurat || '-'}</td>
                <td>${Utils.formatDateShort(item.tanggalSurat)}</td>
                <td>${Utils.truncate(item.tujuan, 30)}</td>
                <td>${Utils.truncate(item.perihal, 40)}</td>
                <td><span class="${Utils.getStatusBadge(item.status)}">${Utils.getStatusLabel(item.status)}</span></td>
                <td><span class="${Utils.getStatusBadge(item.approvalStatus)}">${Utils.getStatusLabel(item.approvalStatus)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline sk-view-btn" data-id="${item.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline sk-edit-btn" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${item.status === 'draft' ? `
                        <button class="btn btn-sm btn-success sk-submit-btn" data-id="${item.id}">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    ` : ''}
                    ${App.user?.role === 'admin' ? `
                        <button class="btn btn-sm btn-danger sk-delete-btn" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
        // Attach event listeners
        tbody.querySelectorAll('.sk-view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.viewDetail(btn.dataset.id));
        });
        tbody.querySelectorAll('.sk-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editData(btn.dataset.id));
        });
        tbody.querySelectorAll('.sk-submit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.submitApproval(btn.dataset.id));
        });
        tbody.querySelectorAll('.sk-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteData(btn.dataset.id));
        });
    },
    
    // ========== RENDER PAGINATION ==========
    renderPagination() {
        const container = document.getElementById('skPagination');
        container.innerHTML = Utils.generatePagination(
            this.currentPage,
            this.totalPages,
            (page) => {
                this.currentPage = page;
                this.loadData();
            }
        );
    },
    
    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        const searchInput = document.getElementById('skSearch');
        let searchTimeout;
        searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = searchInput.value;
                this.currentPage = 1;
                this.loadData();
            }, 500);
        });
        
        document.getElementById('skStatus')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.currentPage = 1;
            this.loadData();
        });
        
        document.getElementById('skApproval')?.addEventListener('change', (e) => {
            this.filters.approval = e.target.value;
            this.currentPage = 1;
            this.loadData();
        });
        
        document.getElementById('skCreateBtn')?.addEventListener('click', () => {
            this.showCreateForm();
        });
        
        document.getElementById('skRefreshBtn')?.addEventListener('click', () => {
            this.loadData();
        });
    },
    
    // ========== CREATE FORM ==========
    showCreateForm() {
        const formHTML = `
            <form id="skForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nomor Surat (biarkan kosong untuk otomatis)</label>
                        <input type="text" class="form-control" name="nomorSurat" placeholder="Kosongkan untuk otomatis" />
                    </div>
                    <div class="form-group">
                        <label>Tanggal Surat</label>
                        <input type="date" class="form-control" name="tanggalSurat" value="${new Date().toISOString().split('T')[0]}" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Tujuan <span class="required">*</span></label>
                        <input type="text" class="form-control" name="tujuan" required />
                    </div>
                    <div class="form-group">
                        <label>Jenis Surat</label>
                        <select class="form-control" name="jenisSurat">
                            <option value="dinas">Surat Dinas</option>
                            <option value="undangan">Undangan</option>
                            <option value="pemberitahuan">Pemberitahuan</option>
                            <option value="edaran">Edaran</option>
                            <option value="keputusan">Keputusan</option>
                            <option value="laporan">Laporan</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Perihal <span class="required">*</span></label>
                    <input type="text" class="form-control" name="perihal" required />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Sifat</label>
                        <select class="form-control" name="sifat">
                            <option value="biasa">Biasa</option>
                            <option value="penting">Penting</option>
                            <option value="sangat-penting">Sangat Penting</option>
                            <option value="rahasia">Rahasia</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Klasifikasi</label>
                        <select class="form-control" name="klasifikasi">
                            <option value="biasa">Biasa</option>
                            <option value="terbatas">Terbatas</option>
                            <option value="rahasia">Rahasia</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Catatan</label>
                    <textarea class="form-control" name="catatan" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        `;
        
        openModal('Tambah Surat Keluar', formHTML);
        
        document.getElementById('skForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await API.post('suratKeluar.createWithNumber', data, App.token);
                if (response.status === 'success') {
                    closeModal();
                    showToast('success', 'Berhasil', 'Surat keluar berhasil dibuat dengan nomor: ' + (response.data.nomorSurat || ''));
                    this.loadData();
                } else {
                    showToast('error', 'Error', response.message || 'Gagal menambahkan surat');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal menambahkan surat keluar');
            }
        });
    },
    
    // ========== VIEW DETAIL ==========
    async viewDetail(id) {
        try {
            const response = await API.get('suratKeluar.detail', {
                token: App.token,
                id: id
            });
            
            if (response.status === 'success') {
                const data = response.data;
                const detailHTML = `
                    <div class="detail-view">
                        <div class="form-row">
                            <div class="form-group">
                                <label><strong>Nomor Surat</strong></label>
                                <p>${data.nomorSurat || '-'}</p>
                            </div>
                            <div class="form-group">
                                <label><strong>Tanggal Surat</strong></label>
                                <p>${Utils.formatDate(data.tanggalSurat)}</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label><strong>Tujuan</strong></label>
                            <p>${data.tujuan || '-'}</p>
                        </div>
                        <div class="form-group">
                            <label><strong>Perihal</strong></label>
                            <p>${data.perihal || '-'}</p>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label><strong>Sifat</strong></label>
                                <p>${Utils.capitalize(data.sifat || 'biasa')}</p>
                            </div>
                            <div class="form-group">
                                <label><strong>Jenis Surat</strong></label>
                                <p>${Utils.capitalize(data.jenisSurat || 'dinas')}</p>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label><strong>Status</strong></label>
                                <p><span class="${Utils.getStatusBadge(data.status)}">${Utils.getStatusLabel(data.status)}</span></p>
                            </div>
                            <div class="form-group">
                                <label><strong>Approval</strong></label>
                                <p><span class="${Utils.getStatusBadge(data.approvalStatus)}">${Utils.getStatusLabel(data.approvalStatus)}</span></p>
                            </div>
                        </div>
                        ${data.approvedBy ? `
                            <div class="form-row">
                                <div class="form-group">
                                    <label><strong>Disetujui Oleh</strong></label>
                                    <p>${data.approvedBy || '-'}</p>
                                </div>
                                <div class="form-group">
                                    <label><strong>Disetujui Pada</strong></label>
                                    <p>${Utils.formatDate(data.approvedAt)}</p>
                                </div>
                            </div>
                        ` : ''}
                        <div class="form-group">
                            <label><strong>Catatan</strong></label>
                            <p>${data.catatan || '-'}</p>
                        </div>
                        ${data.isTtd ? `
                            <div class="alert alert-success">
                                <i class="fas fa-check-circle"></i> Surat telah ditandatangani digital
                            </div>
                        ` : ''}
                        ${data.fileUrl ? `
                            <div class="form-group">
                                <label><strong>File</strong></label>
                                <p><a href="${data.fileUrl}" target="_blank">${data.fileName || 'Lihat file'}</a></p>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                openModal('Detail Surat Keluar', detailHTML);
            } else {
                showToast('error', 'Error', response.message || 'Gagal memuat detail');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal memuat detail surat');
        }
    },
    
    // ========== EDIT DATA ==========
    async editData(id) {
        try {
            const response = await API.get('suratKeluar.detail', {
                token: App.token,
                id: id
            });
            
            if (response.status === 'success') {
                const data = response.data;
                const formHTML = `
                    <form id="skEditForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nomor Surat</label>
                                <input type="text" class="form-control" name="nomorSurat" value="${data.nomorSurat || ''}" />
                            </div>
                            <div class="form-group">
                                <label>Tanggal Surat</label>
                                <input type="date" class="form-control" name="tanggalSurat" value="${data.tanggalSurat ? new Date(data.tanggalSurat).toISOString().split('T')[0] : ''}" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Tujuan</label>
                            <input type="text" class="form-control" name="tujuan" value="${data.tujuan || ''}" required />
                        </div>
                        <div class="form-group">
                            <label>Perihal</label>
                            <input type="text" class="form-control" name="perihal" value="${data.perihal || ''}" required />
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Sifat</label>
                                <select class="form-control" name="sifat">
                                    <option value="biasa" ${data.sifat === 'biasa' ? 'selected' : ''}>Biasa</option>
                                    <option value="penting" ${data.sifat === 'penting' ? 'selected' : ''}>Penting</option>
                                    <option value="sangat-penting" ${data.sifat === 'sangat-penting' ? 'selected' : ''}>Sangat Penting</option>
                                    <option value="rahasia" ${data.sifat === 'rahasia' ? 'selected' : ''}>Rahasia</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Jenis Surat</label>
                                <select class="form-control" name="jenisSurat">
                                    <option value="dinas" ${data.jenisSurat === 'dinas' ? 'selected' : ''}>Surat Dinas</option>
                                    <option value="undangan" ${data.jenisSurat === 'undangan' ? 'selected' : ''}>Undangan</option>
                                    <option value="pemberitahuan" ${data.jenisSurat === 'pemberitahuan' ? 'selected' : ''}>Pemberitahuan</option>
                                    <option value="edaran" ${data.jenisSurat === 'edaran' ? 'selected' : ''}>Edaran</option>
                                    <option value="keputusan" ${data.jenisSurat === 'keputusan' ? 'selected' : ''}>Keputusan</option>
                                    <option value="laporan" ${data.jenisSurat === 'laporan' ? 'selected' : ''}>Laporan</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select class="form-control" name="status">
                                <option value="draft" ${data.status === 'draft' ? 'selected' : ''}>Draft</option>
                                <option value="review" ${data.status === 'review' ? 'selected' : ''}>Review</option>
                                <option value="approved" ${data.status === 'approved' ? 'selected' : ''}>Disetujui</option>
                                <option value="ttd" ${data.status === 'ttd' ? 'selected' : ''}>TTD</option>
                                <option value="dikirim" ${data.status === 'dikirim' ? 'selected' : ''}>Dikirim</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Catatan</label>
                            <textarea class="form-control" name="catatan" rows="3">${data.catatan || ''}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                            <button type="submit" class="btn btn-primary">Update</button>
                        </div>
                    </form>
                `;
                
                openModal('Edit Surat Keluar', formHTML);
                
                document.getElementById('skEditForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const formObject = Object.fromEntries(formData.entries());
                    
                    try {
                        // 🔥 FIX: Kirim id di data untuk API.put
                        const response = await API.put('suratKeluar.update', {
                            id: id,
                            ...formObject
                        }, App.token);
                        
                        if (response.status === 'success') {
                            closeModal();
                            showToast('success', 'Berhasil', 'Surat keluar berhasil diupdate');
                            this.loadData();
                        } else {
                            showToast('error', 'Error', response.message || 'Gagal mengupdate surat');
                        }
                    } catch (error) {
                        Utils.handleError(error, 'Gagal mengupdate surat');
                    }
                });
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal memuat data untuk edit');
        }
    },
    
    // ========== SUBMIT APPROVAL ==========
    async submitApproval(id) {
        try {
            const response = await API.get('suratKeluar.submitApproval', {
                token: App.token,
                id: id
            });
            
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'Surat dikirim untuk approval');
                this.loadData();
            } else {
                showToast('error', 'Error', response.message || 'Gagal submit approval');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal submit approval');
        }
    },
    
    // ========== DELETE DATA ==========
    async deleteData(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) return;
        
        try {
            // 🔥 FIX: Gunakan API.delete dengan id sebagai parameter
            const response = await API.delete('suratKeluar.delete', id, App.token);
            
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'Surat berhasil dihapus');
                this.loadData();
            } else {
                showToast('error', 'Error', response.message || 'Gagal menghapus surat');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal menghapus surat');
        }
    }
};
