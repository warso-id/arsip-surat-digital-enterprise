/**
 * ============================================
 * TEMPLATE.JS - Template Module
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: Delete and Update with proper ID handling
 * ============================================
 */

const Template = {
    data: [],
    currentPage: 1,
    totalPages: 1,
    filters: {},
    
    // ========== RENDER ==========
    async render(params = {}) {
        this.filters = params;
        this.currentPage = parseInt(params.page) || 1;
        
        return `
            <div class="template-page">
                <!-- Toolbar -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
                        <div class="flex" style="gap: 8px; flex-wrap: wrap;">
                            <input type="text" id="templateSearch" class="form-control" placeholder="Cari template..." style="width: 250px;" />
                            <select id="templateKategori" class="form-control" style="width: 150px;">
                                <option value="">Semua Kategori</option>
                                <option value="umum">Umum</option>
                                <option value="dinas">Dinas</option>
                                <option value="undangan">Undangan</option>
                                <option value="edaran">Edaran</option>
                                <option value="keputusan">Keputusan</option>
                            </select>
                        </div>
                        <div class="flex" style="gap: 8px;">
                            <button class="btn btn-primary" id="templateCreateBtn">
                                <i class="fas fa-plus"></i> Template Baru
                            </button>
                            <button class="btn btn-success" id="templateRefreshBtn">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Cards -->
                <div class="template-grid" id="templateGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                    <div class="text-center text-muted" style="grid-column: 1/-1;">Memuat data...</div>
                </div>
                <div id="templatePagination" class="flex-center" style="margin-top: 20px;"></div>
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
            const response = await API.get('template.list', {
                token: App.token,
                page: this.currentPage,
                limit: 12,
                search: this.filters.search || '',
                kategori: this.filters.kategori || ''
            });
            
            if (response.status === 'success') {
                this.data = response.data.items || [];
                this.totalPages = response.data.pagination?.totalPages || 1;
                this.renderGrid();
                this.renderPagination();
            } else {
                showToast('error', 'Error', response.message || 'Gagal memuat data');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal memuat data template');
        }
    },
    
    // ========== RENDER GRID ==========
    renderGrid() {
        const grid = document.getElementById('templateGrid');
        
        if (this.data.length === 0) {
            grid.innerHTML = `
                <div class="text-center text-muted" style="grid-column: 1/-1; padding: 40px;">
                    <i class="fas fa-file-alt" style="font-size: 48px; display: block; margin-bottom: 12px;"></i>
                    <p>Belum ada template</p>
                    <button class="btn btn-primary" id="templateCreateEmptyBtn">
                        <i class="fas fa-plus"></i> Buat Template Pertama
                    </button>
                </div>
            `;
            
            document.getElementById('templateCreateEmptyBtn')?.addEventListener('click', () => {
                this.showCreateForm();
            });
            return;
        }
        
        grid.innerHTML = this.data.map(item => `
            <div class="card template-card">
                <div class="template-header">
                    <h4>${item.nama}</h4>
                    <span class="status-badge ${item.isPublic ? 'status-badge approved' : 'status-badge'}">
                        ${item.isPublic ? 'Public' : 'Private'}
                    </span>
                </div>
                <div class="template-meta">
                    <span><i class="fas fa-tag"></i> ${item.kategori || 'Umum'}</span>
                    <span><i class="fas fa-file"></i> ${item.jenis || 'Surat'}</span>
                </div>
                <div class="template-preview">
                    <p>${Utils.truncate(item.konten, 100)}</p>
                </div>
                <div class="template-actions">
                    <button class="btn btn-sm btn-primary template-use-btn" data-id="${item.id}">
                        <i class="fas fa-pen"></i> Gunakan
                    </button>
                    <button class="btn btn-sm btn-outline template-edit-btn" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger template-delete-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Attach event listeners
        grid.querySelectorAll('.template-use-btn').forEach(btn => {
            btn.addEventListener('click', () => this.useTemplate(btn.dataset.id));
        });
        grid.querySelectorAll('.template-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editTemplate(btn.dataset.id));
        });
        grid.querySelectorAll('.template-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteTemplate(btn.dataset.id));
        });
    },
    
    // ========== RENDER PAGINATION ==========
    renderPagination() {
        const container = document.getElementById('templatePagination');
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
        const searchInput = document.getElementById('templateSearch');
        let searchTimeout;
        searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = searchInput.value;
                this.currentPage = 1;
                this.loadData();
            }, 500);
        });
        
        document.getElementById('templateKategori')?.addEventListener('change', (e) => {
            this.filters.kategori = e.target.value;
            this.currentPage = 1;
            this.loadData();
        });
        
        document.getElementById('templateCreateBtn')?.addEventListener('click', () => {
            this.showCreateForm();
        });
        
        document.getElementById('templateRefreshBtn')?.addEventListener('click', () => {
            this.loadData();
        });
    },
    
    // ========== CREATE FORM ==========
    showCreateForm() {
        const formHTML = `
            <form id="templateForm">
                <div class="form-group">
                    <label>Nama Template <span class="required">*</span></label>
                    <input type="text" class="form-control" name="nama" required />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Kategori</label>
                        <select class="form-control" name="kategori">
                            <option value="umum">Umum</option>
                            <option value="dinas">Dinas</option>
                            <option value="undangan">Undangan</option>
                            <option value="edaran">Edaran</option>
                            <option value="keputusan">Keputusan</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Jenis</label>
                        <select class="form-control" name="jenis">
                            <option value="surat">Surat</option>
                            <option value="memo">Memo</option>
                            <option value="nota">Nota</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Konten <span class="required">*</span></label>
                    <textarea class="form-control" name="konten" rows="6" required></textarea>
                    <small class="text-muted">Gunakan {{variabel}} untuk placeholder</small>
                </div>
                <div class="form-group">
                    <label>Variabel (pisahkan dengan koma)</label>
                    <input type="text" class="form-control" name="variables" placeholder="nama, tanggal, tujuan" />
                </div>
                <div class="form-group">
                    <label class="checkbox">
                        <input type="checkbox" name="isPublic" value="true" /> Public
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Simpan Template</button>
                </div>
            </form>
        `;
        
        openModal('Buat Template Baru', formHTML);
        
        document.getElementById('templateForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.isPublic = data.isPublic === 'true';
            
            try {
                const response = await API.post('template.save', data, App.token);
                if (response.status === 'success') {
                    closeModal();
                    showToast('success', 'Berhasil', 'Template berhasil disimpan');
                    this.loadData();
                } else {
                    showToast('error', 'Error', response.message || 'Gagal menyimpan template');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal menyimpan template');
            }
        });
    },
    
    // ========== USE TEMPLATE ==========
    useTemplate(id) {
        const formHTML = `
            <form id="templateUseForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Tujuan <span class="required">*</span></label>
                        <input type="text" class="form-control" name="tujuan" required />
                    </div>
                    <div class="form-group">
                        <label>Perihal <span class="required">*</span></label>
                        <input type="text" class="form-control" name="perihal" required />
                    </div>
                </div>
                <div class="form-row">
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
                    <div class="form-group">
                        <label>Sifat</label>
                        <select class="form-control" name="sifat">
                            <option value="biasa">Biasa</option>
                            <option value="penting">Penting</option>
                            <option value="sangat-penting">Sangat Penting</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Variabel Tambahan (format: key=value)</label>
                    <input type="text" class="form-control" name="vars" placeholder="nama=Andi, tanggal=15-01-2024" />
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Buat Surat</button>
                </div>
            </form>
        `;
        
        openModal('Gunakan Template', formHTML);
        
        document.getElementById('templateUseForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Parse variables
            if (data.vars) {
                const pairs = data.vars.split(',').map(v => v.trim().split('='));
                pairs.forEach(([key, value]) => {
                    if (key && value) data[key] = value;
                });
                delete data.vars;
            }
            
            try {
                const response = await API.post('template.use', {
                    id: id,
                    ...data
                }, App.token);
                
                if (response.status === 'success') {
                    closeModal();
                    showToast('success', 'Berhasil', 'Surat berhasil dibuat dari template');
                    // Navigate to surat keluar
                    App.loadPage('surat-keluar');
                } else {
                    showToast('error', 'Error', response.message || 'Gagal membuat surat dari template');
                }
            } catch (error) {
                Utils.handleError(error, 'Gagal membuat surat dari template');
            }
        });
    },
    
    // ========== EDIT TEMPLATE ==========
    async editTemplate(id) {
        try {
            const response = await API.get('template.list', {
                token: App.token
            });
            
            if (response.status === 'success') {
                const template = response.data.items?.find(t => t.id === id);
                if (!template) {
                    showToast('error', 'Error', 'Template tidak ditemukan');
                    return;
                }
                
                const formHTML = `
                    <form id="templateEditForm">
                        <div class="form-group">
                            <label>Nama Template</label>
                            <input type="text" class="form-control" name="nama" value="${template.nama}" required />
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Kategori</label>
                                <select class="form-control" name="kategori">
                                    <option value="umum" ${template.kategori === 'umum' ? 'selected' : ''}>Umum</option>
                                    <option value="dinas" ${template.kategori === 'dinas' ? 'selected' : ''}>Dinas</option>
                                    <option value="undangan" ${template.kategori === 'undangan' ? 'selected' : ''}>Undangan</option>
                                    <option value="edaran" ${template.kategori === 'edaran' ? 'selected' : ''}>Edaran</option>
                                    <option value="keputusan" ${template.kategori === 'keputusan' ? 'selected' : ''}>Keputusan</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Jenis</label>
                                <select class="form-control" name="jenis">
                                    <option value="surat" ${template.jenis === 'surat' ? 'selected' : ''}>Surat</option>
                                    <option value="memo" ${template.jenis === 'memo' ? 'selected' : ''}>Memo</option>
                                    <option value="nota" ${template.jenis === 'nota' ? 'selected' : ''}>Nota</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Konten</label>
                            <textarea class="form-control" name="konten" rows="6" required>${template.konten}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Variabel (pisahkan dengan koma)</label>
                            <input type="text" class="form-control" name="variables" value="${(template.variables || []).join(', ')}" />
                        </div>
                        <div class="form-group">
                            <label class="checkbox">
                                <input type="checkbox" name="isPublic" value="true" ${template.isPublic ? 'checked' : ''} /> Public
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                            <button type="submit" class="btn btn-primary">Update Template</button>
                        </div>
                    </form>
                `;
                
                openModal('Edit Template', formHTML);
                
                document.getElementById('templateEditForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    data.isPublic = data.isPublic === 'true';
                    
                    try {
                        // 🔥 FIX: Kirim id di data untuk API.put
                        const response = await API.put('template.update', {
                            id: id,
                            ...data
                        }, App.token);
                        
                        if (response.status === 'success') {
                            closeModal();
                            showToast('success', 'Berhasil', 'Template berhasil diupdate');
                            this.loadData();
                        } else {
                            showToast('error', 'Error', response.message || 'Gagal mengupdate template');
                        }
                    } catch (error) {
                        Utils.handleError(error, 'Gagal mengupdate template');
                    }
                });
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal memuat data template');
        }
    },
    
    // ========== DELETE TEMPLATE ==========
    async deleteTemplate(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus template ini?')) return;
        
        try {
            // 🔥 FIX: Gunakan API.delete dengan id sebagai parameter
            const response = await API.delete('template.delete', id, App.token);
            
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'Template berhasil dihapus');
                this.loadData();
            } else {
                showToast('error', 'Error', response.message || 'Gagal menghapus template');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal menghapus template');
        }
    }
};
