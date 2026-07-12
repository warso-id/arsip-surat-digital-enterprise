/**
 * ============================================
 * DISPOSISI.JS - Disposisi Module
 * ARSIP SURAT DIGITAL v3.2.2
 * ============================================
 */

const Disposisi = {
    data: [],
    currentPage: 1,
    totalPages: 1,
    filters: {},
    suratMasukOptions: [],
    
    // ========== RENDER ==========
    async render(params = {}) {
        this.filters = params;
        this.currentPage = parseInt(params.page) || 1;
        
        // Load surat masuk options for dropdown
        await this.loadSuratMasukOptions();
        
        return `
            <div class="disposisi-page">
                <!-- Toolbar -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
                        <div class="flex" style="gap: 8px; flex-wrap: wrap;">
                            <select id="dispStatus" class="form-control" style="width: 150px;">
                                <option value="">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="diterima">Diterima</option>
                                <option value="dibaca">Dibaca</option>
                                <option value="ditindaklanjuti">Ditindaklanjuti</option>
                                <option value="selesai">Selesai</option>
                                <option value="ditolak">Ditolak</option>
                            </select>
                            <select id="dispSuratMasuk" class="form-control" style="width: 200px;">
                                <option value="">Semua Surat Masuk</option>
                                ${this.suratMasukOptions}
                            </select>
                        </div>
                        <div class="flex" style="gap: 8px;">
                            <button class="btn btn-primary" id="dispCreateBtn">
                                <i class="fas fa-plus"></i> Disposisi
                            </button>
                            <button class="btn btn-success" id="dispRefreshBtn">
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
                                    <th>Surat Masuk</th>
                                    <th>Instruksi</th>
                                    <th>Kepada</th>
                                    <th>Batas Waktu</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="dispTableBody">
                                <tr><td colspan="6" class="text-center text-muted">Memuat data...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="dispPagination" class="flex-center" style="margin-top: 16px;"></div>
                </div>
            </div>
        `;
    },
    
    // ========== INIT ==========
    init() {
        this.loadData();
        this.setupEventListeners();
    },
    
    // ========== LOAD SURAT MASUK OPTIONS ==========
    async loadSuratMasukOptions() {
        try {
            const response = await API.get('suratMasuk.list', {
                token: App.token,
                limit: 100
            });
            
            if (response.status === 'success') {
                const items = response.data.items || [];
                this.suratMasukOptions = items.map(item => 
                    `<option value="${item.id}">${item.nomorAgenda || item.nomorSurat || '-'} - ${Utils.truncate(item.perihal, 30)}</option>`
                ).join('');
            }
        } catch (error) {
            console.error('Error loading surat masuk options:', error);
        }
    },
    
    // ========== LOAD DATA ==========
    async loadData() {
        try {
            const response = await API.get('disposisi.list', {
                token: App.token,
                page: this.currentPage,
                limit: 20,
                status: this.filters.status || '',
                suratMasukId: this.filters.suratMasukId || ''
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
            Utils.handleError(error, 'Gagal memuat data disposisi');
        }
    },
    
    // ========== RENDER TABLE ==========
    renderTable() {
        const tbody = document.getElementById('dispTableBody');
        
        if (this.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Tidak ada data</td></tr>`;
            return;
        }
        
        tbody.innerHTML = this.data.map(item => `
            <tr>
                <td>${item.suratMasukId ? Utils.truncate(item.suratMasukId, 10) : '-'}</td>
                <td>${Utils.truncate(item.instruksi, 40)}</td>
                <td>${item.kepadaUserId || '-'}</td>
                <td>${item.batasWaktu ? Utils.formatDateShort(item.batasWaktu) : '-'}</td>
                <td><span class="${Utils.getStatusBadge(item.status)}">${Utils.getStatusLabel(item.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline disp-view-btn" data-id="${item.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline disp-action-btn" data-id="${item.id}" data-status="${item.status}">
                        <i class="fas fa-check"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Attach event listeners
        tbody.querySelectorAll('.disp-view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.viewDetail(btn.dataset.id));
        });
        tbody.querySelectorAll('.disp-action-btn').forEach(btn => {
            btn.addEventListener('click', () => this.takeAction(btn.dataset.id));
        });
    },
    
    // ========== RENDER PAGINATION ==========
    renderPagination() {
        const container = document.getElementById('dispPagination');
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
        document.getElementById('dispStatus')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.currentPage = 1;
            this.loadData();
        });
        
        document.getElementById('dispSuratMasuk')?.addEventListener('change', (e) => {
            this.filters.suratMasukId = e.target.value;
            this.currentPage = 1;
            this.loadData();
        });
        
        document.getElementById('dispCreateBtn')?.addEventListener('click', () => {
            this.showCreateForm();
        });
        
        document.getElementById('dispRefreshBtn')?.addEventListener('click', () => {
            this.loadData();
        });
    },
    
    // ========== CREATE FORM ==========
    showCreateForm() {
        const formHTML = `
            <form id="dispForm">
                <div class="form-group">
                    <label>Surat Masuk <span class="required">*</span></label>
                    <select class="form-control" name="suratMasukId" required>
                        <option value="">Pilih Surat Masuk</option>
                        ${this.suratMasukOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Kepada User <span class="required">*</span></label>
                    <select class="form-control" name="kepadaUserId" id="dispKepadaUser" required>
                        <option value="">Pilih User</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Instruksi <span class="required">*</span></label>
                    <textarea class="form-control" name="instruksi" rows="3" required></textarea>
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
                        <label>Batas Waktu</label>
                        <input type="date" class="form-control" name="batasWaktu" />
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Buat Disposisi</button>
                </div>
            </form>
        `;
        
        openModal('Buat Disposisi Baru', formHTML);
        
        // Load users for dropdown
        this.loadUserOptions();
        
        document.getElementById('dispForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await API.post('disposisi.create', data, App.token);
                if (response.status === 'success') {
                    closeModal();
                    showToast('success', 'Berhasil', 'Disposisi berhasil dibuat');
                    this.loadData();
                } else {
                    showToast('error', 'Error', response.message || 'Gagal membuat disposisi');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal membuat disposisi');
            }
        });
    },
    
    // ========== LOAD USER OPTIONS ==========
    async loadUserOptions() {
        try {
            const response = await API.get('users.list', {
                token: App.token,
                limit: 100
            });
            
            if (response.status === 'success') {
                const users = response.data.items || [];
                const select = document.getElementById('dispKepadaUser');
                select.innerHTML = `
                    <option value="">Pilih User</option>
                    ${users.map(u => `
                        <option value="${u.id}">${u.namaLengkap || u.username} (${u.role})</option>
                    `).join('')}
                `;
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    },
    
    // ========== VIEW DETAIL ==========
    async viewDetail(id) {
        try {
            const response = await API.get('disposisi.list', {
                token: App.token,
                // Will get all and filter client-side
            });
            
            if (response.status === 'success') {
                const data = response.data.items?.find(item => item.id === id);
                if (!data) {
                    showToast('error', 'Error', 'Data tidak ditemukan');
                    return;
                }
                
                const detailHTML = `
                    <div class="detail-view">
                        <div class="form-group">
                            <label><strong>Surat Masuk ID</strong></label>
                            <p>${data.suratMasukId || '-'}</p>
                        </div>
                        <div class="form-group">
                            <label><strong>Instruksi</strong></label>
                            <p>${data.instruksi || '-'}</p>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label><strong>Sifat</strong></label>
                                <p>${Utils.capitalize(data.sifat || 'biasa')}</p>
                            </div>
                            <div class="form-group">
                                <label><strong>Batas Waktu</strong></label>
                                <p>${data.batasWaktu ? Utils.formatDate(data.batasWaktu) : '-'}</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label><strong>Status</strong></label>
                            <p><span class="${Utils.getStatusBadge(data.status)}">${Utils.getStatusLabel(data.status)}</span></p>
                        </div>
                        ${data.tindakLanjut ? `
                            <div class="form-group">
                                <label><strong>Tindak Lanjut</strong></label>
                                <p>${data.tindakLanjut}</p>
                            </div>
                        ` : ''}
                        ${data.fileHasilUrl ? `
                            <div class="form-group">
                                <label><strong>File Hasil</strong></label>
                                <p><a href="${data.fileHasilUrl}" target="_blank">Lihat file</a></p>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                openModal('Detail Disposisi', detailHTML);
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal memuat detail disposisi');
        }
    },
    
    // ========== TAKE ACTION ==========
    takeAction(id) {
        const formHTML = `
            <form id="dispActionForm">
                <div class="form-group">
                    <label>Status <span class="required">*</span></label>
                    <select class="form-control" name="status" required>
                        <option value="diterima">Diterima</option>
                        <option value="dibaca">Dibaca</option>
                        <option value="ditindaklanjuti">Ditindaklanjuti</option>
                        <option value="selesai">Selesai</option>
                        <option value="ditolak">Ditolak</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tindak Lanjut</label>
                    <textarea class="form-control" name="tindakLanjut" rows="3"></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan</button>
                </div>
            </form>
        `;
        
        openModal('Tindak Lanjut Disposisi', formHTML);
        
        document.getElementById('dispActionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await API.post('disposisi.tindakLanjut', {
                    id: id,
                    ...data
                }, App.token);
                
                if (response.status === 'success') {
                    closeModal();
                    showToast('success', 'Berhasil', 'Tindak lanjut berhasil dicatat');
                    this.loadData();
                } else {
                    showToast('error', 'Error', response.message || 'Gagal mencatat tindak lanjut');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal mencatat tindak lanjut');
            }
        });
    }
};
