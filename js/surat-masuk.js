/**
 * ============================================
 * SURAT-MASUK.JS - Surat Masuk Module
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: Delete and Update with proper ID handling
 * ============================================
 */

const SuratMasuk = {
    data: [],
    currentPage: 1,
    totalPages: 1,
    filters: {},
    
    // ========== RENDER ==========
    async render(params = {}) {
        this.filters = params;
        this.currentPage = parseInt(params.page) || 1;
        
        return `
            <div class="surat-masuk-page">
                <!-- Toolbar -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
                        <div class="flex" style="gap: 8px; flex-wrap: wrap;">
                            <input type="text" id="smSearch" class="form-control" placeholder="Cari surat..." style="width: 250px;" />
                            <select id="smStatus" class="form-control" style="width: 150px;">
                                <option value="">Semua Status</option>
                                <option value="diterima">Diterima</option>
                                <option value="diproses">Diproses</option>
                                <option value="didisposisikan">Didisposisikan</option>
                                <option value="selesai">Selesai</option>
                                <option value="ditolak">Ditolak</option>
                            </select>
                            <select id="smSifat" class="form-control" style="width: 150px;">
                                <option value="">Semua Sifat</option>
                                <option value="biasa">Biasa</option>
                                <option value="penting">Penting</option>
                                <option value="sangat-penting">Sangat Penting</option>
                                <option value="rahasia">Rahasia</option>
                            </select>
                        </div>
                        <div class="flex" style="gap: 8px;">
                            <button class="btn btn-primary" id="smCreateBtn">
                                <i class="fas fa-plus"></i> Surat Masuk
                            </button>
                            <button class="btn btn-success" id="smRefreshBtn">
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
                                    <th>No. Agenda</th>
                                    <th>Nomor Surat</th>
                                    <th>Tanggal</th>
                                    <th>Pengirim</th>
                                    <th>Perihal</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="smTableBody">
                                <tr><td colspan="7" class="text-center text-muted">Memuat data...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="smPagination" class="flex-center" style="margin-top: 16px;"></div>
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
            const response = await API.get('suratMasuk.list', {
                token: App.token,
                page: this.currentPage,
                limit: 20,
                search: this.filters.search || '',
                status: this.filters.status || '',
                sifat: this.filters.sifat || ''
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
            Utils.handleError(error, 'Gagal memuat data surat masuk');
        }
    },
    
    // ========== RENDER TABLE ==========
    renderTable() {
        const tbody = document.getElementById('smTableBody');
        
        if (this.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Tidak ada data</td></tr>`;
            return;
        }
        
        tbody.innerHTML = this.data.map(item => `
            <tr>
                <td>${item.nomorAgenda || '-'}</td>
                <td>${item.nomorSurat || '-'}</td>
                <td>${Utils.formatDateShort(item.tanggalSurat)}</td>
                <td>${Utils.truncate(item.pengirim, 30)}</td>
                <td>${Utils.truncate(item.perihal, 40)}</td>
                <td><span class="${Utils.getStatusBadge(item.status)}">${Utils.getStatusLabel(item.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline sm-view-btn" data-id="${item.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline sm-edit-btn" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${App.user?.role === 'admin' ? `
                        <button class="btn btn-sm btn-danger sm-delete-btn" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
        // Attach event listeners
        tbody.querySelectorAll('.sm-view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.viewDetail(btn.dataset.id));
        });
        tbody.querySelectorAll('.sm-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editData(btn.dataset.id));
        });
        tbody.querySelectorAll('.sm-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteData(btn.dataset.id));
        });
    },
    
    // ========== RENDER PAGINATION ==========
    renderPagination() {
        const container = document.getElementById('smPagination');
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
        // Search
        const searchInput = document.getElementById('smSearch');
        let searchTimeout;
        searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = searchInput.value;
                this.currentPage = 1;
                this.loadData();
            }, 500);
        });
        
        // Status filter
        document.getElementById('smStatus')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.currentPage = 1;
            this.loadData();
        });
        
        // Sifat filter
        document.getElementById('smSifat')?.addEventListener('change', (e) => {
            this.filters.sifat = e.target.value;
            this.currentPage = 1;
            this.loadData();
        });
        
        // Create button
        document.getElementById('smCreateBtn')?.addEventListener('click', () => {
            this.showCreateForm();
        });
        
        // Refresh button
        document.getElementById('smRefreshBtn')?.addEventListener('click', () => {
            this.loadData();
        });
    },
    
    // ========== CREATE FORM ==========
    showCreateForm() {
        const formHTML = `
            <form id="smForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nomor Surat</label>
                        <input type="text" class="form-control" name="nomorSurat" />
                    </div>
                    <div class="form-group">
                        <label>Tanggal Surat</label>
                        <input type="date" class="form-control" name="tanggalSurat" value="${new Date().toISOString().split('T')[0]}" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Pengirim <span class="required">*</span></label>
                        <input type="text" class="form-control" name="pengirim" required />
                    </div>
                    <div class="form-group">
                        <label>Tanggal Terima</label>
                        <input type="date" class="form-control" name="tanggalTerima" value="${new Date().toISOString().split('T')[0]}" />
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
        
        openModal('Tambah Surat Masuk', formHTML);
        
        document.getElementById('smForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await API.post('suratMasuk.create', data, App.token);
                if (response.status === 'success') {
                    closeModal();
                    showToast('success', 'Berhasil', 'Surat masuk berhasil ditambahkan');
                    this.loadData();
                } else {
                    showToast('error', 'Error', response.message || 'Gagal menambahkan surat');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal menambahkan surat masuk');
            }
        });
    },
    
    // ========== VIEW DETAIL ==========
    async viewDetail(id) {
        try {
            const response = await API.get('suratMasuk.detail', {
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
                                <label><strong>Nomor Agenda</strong></label>
                                <p>${data.nomorAgenda || '-'}</p>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label><strong>Tanggal Surat</strong></label>
                                <p>${Utils.formatDate(data.tanggalSurat)}</p>
                            </div>
                            <div class="form-group">
                                <label><strong>Tanggal Terima</strong></label>
                                <p>${Utils.formatDate(data.tanggalTerima)}</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label><strong>Pengirim</strong></label>
                            <p>${data.pengirim || '-'}</p>
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
                                <label><strong>Klasifikasi</strong></label>
                                <p>${Utils.capitalize(data.klasifikasi || 'biasa')}</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label><strong>Status</strong></label>
                            <p><span class="${Utils.getStatusBadge(data.status)}">${Utils.getStatusLabel(data.status)}</span></p>
                        </div>
                        <div class="form-group">
                            <label><strong>Catatan</strong></label>
                            <p>${data.catatan || '-'}</p>
                        </div>
                        ${data.fileUrl ? `
                            <div class="form-group">
                                <label><strong>File</strong></label>
                                <p><a href="${data.fileUrl}" target="_blank">${data.fileName || 'Lihat file'}</a></p>
                            </div>
                        ` : ''}
                        ${data.qrCode ? `
                            <div class="form-group text-center">
                                <img src="${data.qrCode}" style="max-width: 150px;" />
                                <p><small>QR Code</small></p>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                openModal('Detail Surat Masuk', detailHTML);
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
            const response = await API.get('suratMasuk.detail', {
                token: App.token,
                id: id
            });
            
            if (response.status === 'success') {
                const data = response.data;
                const formHTML = `
                    <form id="smEditForm">
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
                        <div class="form-row">
                            <div class="form-group">
                                <label>Pengirim</label>
                                <input type="text" class="form-control" name="pengirim" value="${data.pengirim || ''}" required />
                            </div>
                            <div class="form-group">
                                <label>Tanggal Terima</label>
                                <input type="date" class="form-control" name="tanggalTerima" value="${data.tanggalTerima ? new Date(data.tanggalTerima).toISOString().split('T')[0] : ''}" />
                            </div>
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
                                <label>Klasifikasi</label>
                                <select class="form-control" name="klasifikasi">
                                    <option value="biasa" ${data.klasifikasi === 'biasa' ? 'selected' : ''}>Biasa</option>
                                    <option value="terbatas" ${data.klasifikasi === 'terbatas' ? 'selected' : ''}>Terbatas</option>
                                    <option value="rahasia" ${data.klasifikasi === 'rahasia' ? 'selected' : ''}>Rahasia</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select class="form-control" name="status">
                                <option value="diterima" ${data.status === 'diterima' ? 'selected' : ''}>Diterima</option>
                                <option value="diproses" ${data.status === 'diproses' ? 'selected' : ''}>Diproses</option>
                                <option value="didisposisikan" ${data.status === 'didisposisikan' ? 'selected' : ''}>Didisposisikan</option>
                                <option value="selesai" ${data.status === 'selesai' ? 'selected' : ''}>Selesai</option>
                                <option value="ditolak" ${data.status === 'ditolak' ? 'selected' : ''}>Ditolak</option>
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
                
                openModal('Edit Surat Masuk', formHTML);
                
                document.getElementById('smEditForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const formObject = Object.fromEntries(formData.entries());
                    
                    try {
                        // 🔥 FIX: Kirim id di data untuk API.put
                        const response = await API.put('suratMasuk.update', {
                            id: id,
                            ...formObject
                        }, App.token);
                        
                        if (response.status === 'success') {
                            closeModal();
                            showToast('success', 'Berhasil', 'Surat masuk berhasil diupdate');
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
    
    // ========== DELETE DATA ==========
    async deleteData(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) return;
        
        try {
            // 🔥 FIX: Gunakan API.delete dengan id sebagai parameter
            const response = await API.delete('suratMasuk.delete', id, App.token);
            
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
