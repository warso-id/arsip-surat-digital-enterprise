// app.js - Main Application (FULL CRUD PWA)
class App {
    constructor() {
        this.version = CONFIG.APP_VERSION;
        this.currentRoute = null;
        this.isOnline = navigator.onLine;
        this.isLoading = false;
    }

    async init() {
        try {
            console.log('Initializing App v' + this.version);
            
            this.setupEventListeners();
            this.checkOnlineStatus();
            this.hideSpinner();
            
            // Check hash route
            const hash = window.location.hash.replace('#', '');
            
            if (auth.isAuthenticated) {
                if (hash && Object.values(CONFIG.ROUTES).includes(hash)) {
                    await this.navigateTo(hash, false);
                } else {
                    await this.navigateTo('dashboard', false);
                }
            } else {
                this.showLandingPage();
            }
            
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.hideSpinner();
            this.showLandingPage();
        }
    }

    setupEventListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        window.addEventListener('hashchange', () => {
            const route = window.location.hash.replace('#', '');
            if (route && auth.isAuthenticated) {
                this.navigateTo(route, false);
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.id === 'crud-modal') {
                this.closeModal();
            }
        });
    }

    checkOnlineStatus() {
        this.isOnline = navigator.onLine;
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            if (this.isOnline) {
                indicator.classList.remove('show');
                setTimeout(() => { indicator.style.display = 'none'; }, 300);
            } else {
                indicator.style.display = 'block';
                setTimeout(() => indicator.classList.add('show'), 10);
            }
        }
        return this.isOnline;
    }

    handleOnline() {
        this.isOnline = true;
        this.checkOnlineStatus();
        this.showToast('Koneksi internet tersedia', 'success');
        if (this.currentRoute) {
            this.navigateTo(this.currentRoute, false);
        }
    }

    handleOffline() {
        this.isOnline = false;
        this.checkOnlineStatus();
        this.showToast('Anda sedang offline', 'warning');
    }

    async navigateTo(route, addToHistory = true) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentRoute = route;
        
        if (addToHistory) {
            window.location.hash = route;
        }
        
        if (!auth.isAuthenticated && route !== 'login') {
            this.showLandingPage();
            this.isLoading = false;
            return;
        }
        
        try {
            switch(route) {
                case 'dashboard':
                    await this.showDashboard();
                    break;
                case 'surat-masuk':
                    await this.showSuratMasuk();
                    break;
                case 'surat-keluar':
                    await this.showSuratKeluar();
                    break;
                case 'disposisi':
                    await this.showDisposisi();
                    break;
                case 'kategori':
                    await this.showKategori();
                    break;
                case 'instansi':
                    await this.showInstansi();
                    break;
                case 'laporan':
                    await this.showLaporan();
                    break;
                case 'pengguna':
                    await this.showPengguna();
                    break;
                case 'pengaturan':
                    await this.showPengaturan();
                    break;
                case 'profile':
                    await this.showProfile();
                    break;
                default:
                    this.show404();
            }
        } catch (error) {
            console.error('Navigation error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    // Landing Page
    showLandingPage() {
        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = `
            <div class="landing-page">
                <div class="landing-container">
                    <div class="landing-header">
                        <div class="logo-placeholder">AS</div>
                        <h1>Arsip Surat Digital</h1>
                        <p class="subtitle">Sistem Manajemen Arsip Surat Enterprise 2026</p>
                        <span class="version">🚀 Version ${this.version}</span>
                        <br><br>
                        <button class="btn-landing btn-login" onclick="window.app.showLoginForm()">
                            <i class="fas fa-sign-in-alt"></i> Masuk
                        </button>
                        <button class="btn-landing btn-register" onclick="window.app.showRegisterForm()">
                            <i class="fas fa-user-plus"></i> Daftar
                        </button>
                    </div>
                    
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">📥</div>
                            <h3>Manajemen Surat Masuk</h3>
                            <p>Kelola surat masuk dengan mudah, lengkap dengan tracking status dan disposisi otomatis.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📤</div>
                            <h3>Manajemen Surat Keluar</h3>
                            <p>Buat dan kelola surat keluar dengan template dinamis dan export ke berbagai format.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📋</div>
                            <h3>Sistem Disposisi</h3>
                            <p>Disposisi multi-level dengan notifikasi real-time dan tracking status lengkap.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📊</div>
                            <h3>Dashboard & Laporan</h3>
                            <p>Dashboard interaktif dengan grafik dan laporan yang dapat diexport ke Excel/PDF.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📱</div>
                            <h3>PWA Support</h3>
                            <p>Aplikasi dapat diinstall di mobile dan digunakan secara offline.</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔒</div>
                            <h3>Keamanan Enterprise</h3>
                            <p>Enkripsi Base64, JWT authentication, role-based access control.</p>
                        </div>
                    </div>
                    
                    <div class="footer-landing">
                        <p>&copy; 2026 Arsip Surat Digital Enterprise v${this.version}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Dashboard
    async showDashboard() {
        const container = document.getElementById('app-container');
        if (!container) return;

        container.innerHTML = this.getAppLayout('dashboard', 'Dashboard', 'fa-chart-pie');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-chart-pie"></i> Dashboard</h2>
                <div class="header-actions">
                    <span id="current-date">${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <button onclick="window.app.refreshDashboard()" class="btn btn-primary btn-sm">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            <div class="stats-grid" id="dashboard-stats">
                <div class="text-center" style="padding: 50px;">
                    <div class="spinner-enterprise"></div>
                    <p class="spinner-text">Memuat statistik...</p>
                </div>
            </div>
        `;
        
        await this.loadDashboardStats();
        this.updateSidebarActive('dashboard');
    }

    async loadDashboardStats() {
        try {
            const result = await api.getDashboardStats();
            const stats = result.success ? result.data : this.getDefaultStats();
            this.renderDashboardStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
            this.renderDashboardStats(this.getDefaultStats());
        }
    }

    getDefaultStats() {
        return {
            totalSuratMasuk: 0,
            totalSuratKeluar: 0,
            totalDisposisi: 0,
            pendingDisposisi: 0,
            totalPengguna: 0,
            recentActivities: []
        };
    }

    renderDashboardStats(stats) {
        const container = document.getElementById('dashboard-stats');
        if (!container) return;

        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-inbox"></i></div>
                <div class="stat-info">
                    <h3>${stats.totalSuratMasuk || 0}</h3>
                    <p>Surat Masuk</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-paper-plane"></i></div>
                <div class="stat-info">
                    <h3>${stats.totalSuratKeluar || 0}</h3>
                    <p>Surat Keluar</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-clipboard-list"></i></div>
                <div class="stat-info">
                    <h3>${stats.totalDisposisi || 0}</h3>
                    <p>Disposisi</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-clock"></i></div>
                <div class="stat-info">
                    <h3>${stats.pendingDisposisi || 0}</h3>
                    <p>Pending</p>
                </div>
            </div>
        `;
    }

    async refreshDashboard() {
        await this.loadDashboardStats();
        this.showToast('Dashboard diperbarui', 'success');
    }

    // Surat Masuk
    async showSuratMasuk() {
        const container = document.getElementById('app-container');
        if (!container) return;
        
        container.innerHTML = this.getAppLayout('surat-masuk', 'Surat Masuk', 'fa-inbox');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-inbox"></i> Surat Masuk</h2>
                <div class="header-actions">
                    <button onclick="window.app.showSuratMasukForm()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Tambah Surat
                    </button>
                </div>
            </div>
            <div class="filter-bar">
                <div class="filter-row">
                    <div class="search-box">
                        <i class="fas fa-search search-icon-input"></i>
                        <input type="text" id="search-surat-masuk" placeholder="Cari surat masuk..." 
                               class="form-control" onkeyup="window.app.searchSuratMasuk()">
                    </div>
                    <select id="filter-status-masuk" class="form-control" onchange="window.app.filterSuratMasuk()">
                        <option value="">Semua Status</option>
                        <option value="baru">Baru</option>
                        <option value="diproses">Diproses</option>
                        <option value="selesai">Selesai</option>
                    </select>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>No. Agenda</th>
                            <th>No. Surat</th>
                            <th>Tanggal</th>
                            <th>Pengirim</th>
                            <th>Perihal</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="table-surat-masuk">
                        <tr><td colspan="8" class="text-center">Memuat data...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="pagination-surat-masuk"></div>
        `;
        
        await this.loadSuratMasukData();
        this.updateSidebarActive('surat-masuk');
    }

    async loadSuratMasukData(page = 1) {
        try {
            const search = document.getElementById('search-surat-masuk')?.value || '';
            const status = document.getElementById('filter-status-masuk')?.value || '';
            
            const result = await api.getSuratMasuk({ page, perPage: 10, search, status });
            
            if (result.success) {
                this.renderSuratMasukTable(result.data);
                this.renderPagination('pagination-surat-masuk', result.pagination, 'surat-masuk');
            } else {
                document.getElementById('table-surat-masuk').innerHTML = 
                    '<tr><td colspan="8" class="text-center">Gagal memuat data</td></tr>';
            }
        } catch (error) {
            console.error('Error loading surat masuk:', error);
            document.getElementById('table-surat-masuk').innerHTML = 
                '<tr><td colspan="8" class="text-center">Error: ' + error.message + '</td></tr>';
        }
    }

    renderSuratMasukTable(data) {
        const tbody = document.getElementById('table-surat-masuk');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.nomor_agenda || '-'}</td>
                <td>${item.nomor_surat || '-'}</td>
                <td>${this.formatDate(item.tanggal_surat)}</td>
                <td>${item.pengirim || '-'}</td>
                <td>${item.perihal || '-'}</td>
                <td><span class="badge badge-${this.getStatusClass(item.status)}">${item.status || 'baru'}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="window.app.viewSuratMasuk('${item.id}')" title="Lihat">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="window.app.editSuratMasuk('${item.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteSuratMasuk('${item.id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    searchSuratMasuk() {
        this.loadSuratMasukData();
    }

    filterSuratMasuk() {
        this.loadSuratMasukData();
    }

    showSuratMasukForm() {
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        if (!modalBody) return;
        
        modalTitle.textContent = 'Tambah Surat Masuk';
        modalBody.innerHTML = `
            <form onsubmit="return false;">
                <div class="form-group">
                    <label>Nomor Surat</label>
                    <input type="text" id="sm-nomor" class="form-control" placeholder="Masukkan nomor surat">
                </div>
                <div class="form-group">
                    <label>Tanggal Surat</label>
                    <input type="date" id="sm-tanggal" class="form-control">
                </div>
                <div class="form-group">
                    <label>Pengirim</label>
                    <input type="text" id="sm-pengirim" class="form-control" placeholder="Nama pengirim">
                </div>
                <div class="form-group">
                    <label>Perihal</label>
                    <input type="text" id="sm-perihal" class="form-control" placeholder="Perihal surat">
                </div>
                <div class="form-group">
                    <label>Sifat</label>
                    <select id="sm-sifat" class="form-control">
                        <option value="biasa">Biasa</option>
                        <option value="penting">Penting</option>
                        <option value="rahasia">Rahasia</option>
                        <option value="segera">Segera</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Catatan</label>
                    <textarea id="sm-catatan" class="form-control" rows="3" placeholder="Catatan tambahan"></textarea>
                </div>
                <div id="form-error" class="alert alert-error" style="display:none;"></div>
            </form>
        `;
        
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
        saveBtn.onclick = async () => {
            const data = {
                nomor_surat: document.getElementById('sm-nomor').value,
                tanggal_surat: document.getElementById('sm-tanggal').value,
                pengirim: document.getElementById('sm-pengirim').value,
                perihal: document.getElementById('sm-perihal').value,
                sifat: document.getElementById('sm-sifat').value,
                catatan: document.getElementById('sm-catatan').value
            };
            
            if (!data.pengirim || !data.perihal) {
                document.getElementById('form-error').textContent = 'Pengirim dan perihal wajib diisi';
                document.getElementById('form-error').style.display = 'block';
                return;
            }
            
            const result = await api.createSuratMasuk(data);
            
            if (result.success) {
                this.closeModal();
                this.showToast('Surat masuk berhasil ditambahkan', 'success');
                await this.loadSuratMasukData();
            } else {
                document.getElementById('form-error').textContent = result.message || 'Gagal menyimpan';
                document.getElementById('form-error').style.display = 'block';
            }
        };
        
        this.showModal();
    }

    async viewSuratMasuk(id) {
        const result = await api.makeRequest('getSuratMasukDetail', { id });
        if (result.success) {
            const item = result.data;
            alert(`Detail Surat Masuk:\n\nNomor Agenda: ${item.nomor_agenda}\nNomor Surat: ${item.nomor_surat}\nTanggal: ${this.formatDate(item.tanggal_surat)}\nPengirim: ${item.pengirim}\nPerihal: ${item.perihal}\nStatus: ${item.status}`);
        } else {
            this.showToast('Gagal memuat detail', 'error');
        }
    }

    async editSuratMasuk(id) {
        this.showToast('Fitur edit akan segera hadir', 'info');
    }

    async deleteSuratMasuk(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) return;
        
        const result = await api.deleteSuratMasuk(id);
        if (result.success) {
            this.showToast('Surat berhasil dihapus', 'success');
            await this.loadSuratMasukData();
        } else {
            this.showToast(result.message || 'Gagal menghapus', 'error');
        }
    }

    // Surat Keluar
    async showSuratKeluar() {
        const container = document.getElementById('app-container');
        if (!container) return;
        
        container.innerHTML = this.getAppLayout('surat-keluar', 'Surat Keluar', 'fa-paper-plane');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-paper-plane"></i> Surat Keluar</h2>
                <div class="header-actions">
                    <button onclick="window.app.showSuratKeluarForm()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Tambah Surat
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>No. Surat</th>
                            <th>Tanggal</th>
                            <th>Tujuan</th>
                            <th>Perihal</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="table-surat-keluar">
                        <tr><td colspan="7" class="text-center">Memuat data...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="pagination-surat-keluar"></div>
        `;
        
        await this.loadSuratKeluarData();
        this.updateSidebarActive('surat-keluar');
    }

    async loadSuratKeluarData(page = 1) {
        try {
            const result = await api.getSuratKeluar({ page, perPage: 10 });
            
            if (result.success) {
                this.renderSuratKeluarTable(result.data);
                this.renderPagination('pagination-surat-keluar', result.pagination, 'surat-keluar');
            } else {
                document.getElementById('table-surat-keluar').innerHTML = 
                    '<tr><td colspan="7" class="text-center">Gagal memuat data</td></tr>';
            }
        } catch (error) {
            console.error('Error loading surat keluar:', error);
        }
    }

    renderSuratKeluarTable(data) {
        const tbody = document.getElementById('table-surat-keluar');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.nomor_surat || '-'}</td>
                <td>${this.formatDate(item.tanggal_surat)}</td>
                <td>${item.tujuan || '-'}</td>
                <td>${item.perihal || '-'}</td>
                <td><span class="badge badge-info">${item.status || 'draft'}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="window.app.viewSuratKeluar('${item.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteSuratKeluar('${item.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    showSuratKeluarForm() {
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        if (!modalBody) return;
        
        modalTitle.textContent = 'Tambah Surat Keluar';
        modalBody.innerHTML = `
            <form onsubmit="return false;">
                <div class="form-group">
                    <label>Nomor Surat</label>
                    <input type="text" id="sk-nomor" class="form-control" placeholder="Masukkan nomor surat">
                </div>
                <div class="form-group">
                    <label>Tanggal Surat</label>
                    <input type="date" id="sk-tanggal" class="form-control">
                </div>
                <div class="form-group">
                    <label>Tujuan</label>
                    <input type="text" id="sk-tujuan" class="form-control" placeholder="Tujuan surat">
                </div>
                <div class="form-group">
                    <label>Perihal</label>
                    <input type="text" id="sk-perihal" class="form-control" placeholder="Perihal surat">
                </div>
                <div id="form-error" class="alert alert-error" style="display:none;"></div>
            </form>
        `;
        
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
        saveBtn.onclick = async () => {
            const data = {
                nomor_surat: document.getElementById('sk-nomor').value,
                tanggal_surat: document.getElementById('sk-tanggal').value,
                tujuan: document.getElementById('sk-tujuan').value,
                perihal: document.getElementById('sk-perihal').value
            };
            
            if (!data.tujuan || !data.perihal) {
                document.getElementById('form-error').textContent = 'Tujuan dan perihal wajib diisi';
                document.getElementById('form-error').style.display = 'block';
                return;
            }
            
            const result = await api.createSuratKeluar(data);
            
            if (result.success) {
                this.closeModal();
                this.showToast('Surat keluar berhasil ditambahkan', 'success');
                await this.loadSuratKeluarData();
            } else {
                document.getElementById('form-error').textContent = result.message || 'Gagal menyimpan';
                document.getElementById('form-error').style.display = 'block';
            }
        };
        
        this.showModal();
    }

    async viewSuratKeluar(id) {
        const result = await api.makeRequest('getSuratKeluarDetail', { id });
        if (result.success) {
            const item = result.data;
            alert(`Detail Surat Keluar:\n\nNomor: ${item.nomor_surat}\nTanggal: ${this.formatDate(item.tanggal_surat)}\nTujuan: ${item.tujuan}\nPerihal: ${item.perihal}\nStatus: ${item.status}`);
        }
    }

    async deleteSuratKeluar(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) return;
        
        const result = await api.deleteSuratKeluar(id);
        if (result.success) {
            this.showToast('Surat berhasil dihapus', 'success');
            await this.loadSuratKeluarData();
        } else {
            this.showToast(result.message || 'Gagal menghapus', 'error');
        }
    }

    // Disposisi
    async showDisposisi() {
        const container = document.getElementById('app-container');
        if (!container) return;
        
        container.innerHTML = this.getAppLayout('disposisi', 'Disposisi', 'fa-clipboard-list');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-clipboard-list"></i> Disposisi</h2>
                <button onclick="window.app.showDisposisiForm()" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Buat Disposisi
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Surat Masuk ID</th>
                            <th>Instruksi</th>
                            <th>Status</th>
                            <th>Tanggal</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="table-disposisi">
                        <tr><td colspan="6" class="text-center">Memuat data...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="pagination-disposisi"></div>
        `;
        
        await this.loadDisposisiData();
        this.updateSidebarActive('disposisi');
    }

    async loadDisposisiData(page = 1) {
        try {
            const result = await api.getDisposisi({ page, perPage: 10 });
            
            if (result.success) {
                this.renderDisposisiTable(result.data);
                this.renderPagination('pagination-disposisi', result.pagination, 'disposisi');
            }
        } catch (error) {
            console.error('Error loading disposisi:', error);
        }
    }

    renderDisposisiTable(data) {
        const tbody = document.getElementById('table-disposisi');
        if (!tbody) return;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.surat_masuk_id || '-'}</td>
                <td>${item.instruksi || '-'}</td>
                <td><span class="badge badge-${item.status === 'pending' ? 'warning' : 'success'}">${item.status || 'pending'}</span></td>
                <td>${this.formatDate(item.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="window.app.approveDisposisi('${item.id}')">
                        <i class="fas fa-check"></i> Setujui
                    </button>
                </td>
            </tr>
        `).join('');
    }

    showDisposisiForm() {
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        if (!modalBody) return;
        
        modalTitle.textContent = 'Buat Disposisi';
        modalBody.innerHTML = `
            <form onsubmit="return false;">
                <div class="form-group">
                    <label>ID Surat Masuk</label>
                    <input type="text" id="disp-surat-id" class="form-control" placeholder="Masukkan ID surat masuk">
                </div>
                <div class="form-group">
                    <label>Instruksi</label>
                    <textarea id="disp-instruksi" class="form-control" rows="3" placeholder="Instruksi disposisi"></textarea>
                </div>
                <div class="form-group">
                    <label>Sifat</label>
                    <select id="disp-sifat" class="form-control">
                        <option value="biasa">Biasa</option>
                        <option value="segera">Segera</option>
                        <option value="sangat-segera">Sangat Segera</option>
                    </select>
                </div>
                <div id="form-error" class="alert alert-error" style="display:none;"></div>
            </form>
        `;
        
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
        saveBtn.onclick = async () => {
            const data = {
                surat_masuk_id: document.getElementById('disp-surat-id').value,
                instruksi: document.getElementById('disp-instruksi').value,
                sifat: document.getElementById('disp-sifat').value
            };
            
            const result = await api.createDisposisi(data);
            
            if (result.success) {
                this.closeModal();
                this.showToast('Disposisi berhasil dibuat', 'success');
                await this.loadDisposisiData();
            } else {
                document.getElementById('form-error').textContent = result.message;
                document.getElementById('form-error').style.display = 'block';
            }
        };
        
        this.showModal();
    }

    async approveDisposisi(id) {
        const result = await api.updateDisposisi(id, { status: 'selesai' });
        if (result.success) {
            this.showToast('Disposisi disetujui', 'success');
            await this.loadDisposisiData();
        } else {
            this.showToast('Gagal menyetujui', 'error');
        }
    }

    // Kategori
    async showKategori() {
        const container = document.getElementById('app-container');
        if (!container) return;
        
        container.innerHTML = this.getAppLayout('kategori', 'Kategori', 'fa-tags');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-tags"></i> Kategori</h2>
                <button onclick="window.app.showKategoriForm()" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Tambah Kategori
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr><th>No</th><th>Nama</th><th>Deskripsi</th><th>Aksi</th></tr>
                    </thead>
                    <tbody id="table-kategori"><tr><td colspan="4" class="text-center">Memuat...</td></tr></tbody>
                </table>
            </div>
        `;
        
        await this.loadKategoriData();
        this.updateSidebarActive('kategori');
    }

    async loadKategoriData() {
        const result = await api.getKategori();
        const tbody = document.getElementById('table-kategori');
        if (!tbody) return;
        
        if (result.success && result.data.length > 0) {
            tbody.innerHTML = result.data.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.nama}</td>
                    <td>${item.deskripsi || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="window.app.deleteKategori('${item.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada data</td></tr>';
        }
    }

    showKategoriForm() {
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        if (!modalBody) return;
        
        modalTitle.textContent = 'Tambah Kategori';
        modalBody.innerHTML = `
            <form onsubmit="return false;">
                <div class="form-group">
                    <label>Nama Kategori</label>
                    <input type="text" id="kat-nama" class="form-control">
                </div>
                <div class="form-group">
                    <label>Deskripsi</label>
                    <input type="text" id="kat-deskripsi" class="form-control">
                </div>
            </form>
        `;
        
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
        saveBtn.onclick = async () => {
            const data = {
                nama: document.getElementById('kat-nama').value,
                deskripsi: document.getElementById('kat-deskripsi').value
            };
            
            const result = await api.createKategori(data);
            if (result.success) {
                this.closeModal();
                this.showToast('Kategori ditambahkan', 'success');
                await this.loadKategoriData();
            }
        };
        
        this.showModal();
    }

    async deleteKategori(id) {
        if (!confirm('Hapus kategori?')) return;
        const result = await api.deleteKategori(id);
        if (result.success) {
            this.showToast('Kategori dihapus', 'success');
            await this.loadKategoriData();
        }
    }

    // Instansi
    async showInstansi() {
        const container = document.getElementById('app-container');
        if (!container) return;
        
        container.innerHTML = this.getAppLayout('instansi', 'Instansi', 'fa-building');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-building"></i> Instansi</h2>
                <button onclick="window.app.showInstansiForm()" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Tambah Instansi
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr><th>No</th><th>Nama</th><th>Alamat</th><th>Telepon</th><th>Email</th><th>Aksi</th></tr>
                    </thead>
                    <tbody id="table-instansi"><tr><td colspan="6" class="text-center">Memuat...</td></tr></tbody>
                </table>
            </div>
        `;
        
        await this.loadInstansiData();
        this.updateSidebarActive('instansi');
    }

    async loadInstansiData() {
        const result = await api.getInstansi();
        const tbody = document.getElementById('table-instansi');
        if (!tbody) return;
        
        if (result.success && result.data.length > 0) {
            tbody.innerHTML = result.data.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.nama}</td>
                    <td>${item.alamat || '-'}</td>
                    <td>${item.telepon || '-'}</td>
                    <td>${item.email || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="window.app.deleteInstansi('${item.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>';
        }
    }

    showInstansiForm() {
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        if (!modalBody) return;
        
        modalTitle.textContent = 'Tambah Instansi';
        modalBody.innerHTML = `
            <form onsubmit="return false;">
                <div class="form-group"><label>Nama Instansi</label><input type="text" id="ins-nama" class="form-control"></div>
                <div class="form-group"><label>Alamat</label><input type="text" id="ins-alamat" class="form-control"></div>
                <div class="form-group"><label>Telepon</label><input type="text" id="ins-telepon" class="form-control"></div>
                <div class="form-group"><label>Email</label><input type="email" id="ins-email" class="form-control"></div>
            </form>
        `;
        
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
        saveBtn.onclick = async () => {
            const data = {
                nama: document.getElementById('ins-nama').value,
                alamat: document.getElementById('ins-alamat').value,
                telepon: document.getElementById('ins-telepon').value,
                email: document.getElementById('ins-email').value
            };
            
            const result = await api.createInstansi(data);
            if (result.success) {
                this.closeModal();
                this.showToast('Instansi ditambahkan', 'success');
                await this.loadInstansiData();
            }
        };
        
        this.showModal();
    }

    async deleteInstansi(id) {
        if (!confirm('Hapus instansi?')) return;
        const result = await api.deleteInstansi(id);
        if (result.success) {
            this.showToast('Instansi dihapus', 'success');
            await this.loadInstansiData();
        }
    }

    // Laporan
    async showLaporan() {
        const container = document.getElementById('app-container');
        if (!container) return;
        
        container.innerHTML = this.getAppLayout('laporan', 'Laporan', 'fa-chart-bar');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-chart-bar"></i> Laporan</h2>
            </div>
            <div class="report-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div class="stat-card" style="cursor:pointer;" onclick="window.app.generateReport('surat-masuk')">
                    <div class="stat-icon"><i class="fas fa-file-pdf"></i></div>
                    <div class="stat-info">
                        <h3>Laporan Surat Masuk</h3>
                        <p>Generate laporan surat masuk</p>
                    </div>
                </div>
                <div class="stat-card" style="cursor:pointer;" onclick="window.app.generateReport('surat-keluar')">
                    <div class="stat-icon"><i class="fas fa-file-pdf"></i></div>
                    <div class="stat-info">
                        <h3>Laporan Surat Keluar</h3>
                        <p>Generate laporan surat keluar</p>
                    </div>
                </div>
                <div class="stat-card" style="cursor:pointer;" onclick="window.app.generateReport('disposisi')">
                    <div class="stat-icon"><i class="fas fa-file-pdf"></i></div>
                    <div class="stat-info">
                        <h3>Laporan Disposisi</h3>
                        <p>Generate laporan disposisi</p>
                    </div>
                </div>
            </div>
        `;
        
        this.updateSidebarActive('laporan');
    }

    async generateReport(type) {
        this.showToast(`Mengenerate laporan ${type}...`, 'info');
        const result = await api.generateReport(type);
        if (result.success) {
            this.showToast('Laporan berhasil digenerate', 'success');
        } else {
            this.showToast('Gagal mengenerate laporan', 'error');
        }
    }

    // Pengguna
    async showPengguna() {
        const container = document.getElementById('app-container');
        if (!container) return;
        
        container.innerHTML = this.getAppLayout('pengguna', 'Pengguna', 'fa-users');
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mainContent.innerHTML = `
            <div class="page-header">
                <h2><i class="fas fa-users"></i> Manajemen Pengguna</h2>
                <button onclick="window.app.showPenggunaForm()" class="btn btn-primary">
                    <i class="fas fa-user-plus"></i> Tambah Pengguna
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr><th>No</th><th>Username</th><th>Email</th><th>Nama</th><th>Role</th><th>Status</th><th>Aksi</th></tr>
                    </thead>
                    <tbody id="table-pengguna"><tr><td colspan="7" class="text-center">Memuat...</td></tr></tbody>
                </table>
            </div>
        `;
        
        await this.loadPenggunaData();
        this.updateSidebarActive('pengguna');
    }

    async loadPenggunaData() {
        const result = await api.getPengguna();
        const tbody = document.getElementById('table-pengguna');
        if (!tbody) return;
        
        if (result.success && result.data.length > 0) {
            tbody.innerHTML = result.data.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.username}</td>
                    <td>${item.email || '-'}</td>
                    <td>${item.fullName || '-'}</td>
                    <td><span class="badge badge-info">${item.role}</span></td>
                    <td><span class="badge ${item.isActive ? 'badge-success' : 'badge-danger'}">${item.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="window.app.deletePengguna('${item.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>';
        }
    }

    showPenggunaForm() {
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        if (!modalBody) return;
        
        modalTitle.textContent = 'Tambah Pengguna';
        modalBody.innerHTML = `
            <form onsubmit="return false;">
                <div class="form-group"><label>Username</label><input type="text" id="user-username" class="form-control"></div>
                <div class="form-group"><label>Email</label><input type="email" id="user-email" class="form-control"></div>
                <div class="form-group"><label>Nama Lengkap</label><input type="text" id="user-fullname" class="form-control"></div>
                <div class="form-group"><label>Password</label><input type="password" id="user-password" class="form-control"></div>
                <div class="form-group"><label>Role</label><select id="user-role" class="form-control"><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
            </form>
        `;
        
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan';
        saveBtn.onclick = async () => {
            const data = {
                username: document.getElementById('user-username').value,
                email: document.getElementById('user-email').value,
                fullName: document.getElementById('user-fullname').value,
                password: document.getElementById('user-password').value,
                role: document.getElementById('user-role').value
            };
            
            const result = await api.createPengguna(data);
            if (result.success) {
                this.closeModal();
                this.showToast('Pengguna ditambahkan', 'success');
                await this.loadPenggunaData();
            }
        };
        
        this.showModal();
    }

    async deletePengguna(id) {
        if (!confirm('Hapus pengguna?')) return;
        const result = await api.deletePengguna(id);
        if (result.success) {
            this.showToast('Pengguna dihapus', 'success');
            await this.loadPenggunaData();
        }
    }

    // Pengaturan & Profile
    async showPengaturan() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '<h2>Pengaturan</h2><p>Halaman pengaturan</p>';
        }
        this.updateSidebarActive('pengaturan');
    }

    async showProfile() {
        const mainContent = document.getElementById('main-content');
        const user = auth.getUser();
        if (mainContent && user) {
            mainContent.innerHTML = `
                <h2>Profil</h2>
                <p>Username: ${user.username}</p>
                <p>Email: ${user.email}</p>
                <p>Role: ${user.role}</p>
            `;
        }
    }

    // Auth Forms
    showLoginForm() {
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        if (!modalBody) return;
        
        modalTitle.textContent = 'Masuk ke Sistem';
        modalBody.innerHTML = `
            <form onsubmit="return false;">
                <div class="form-group">
                    <label><i class="fas fa-user"></i> Username</label>
                    <input type="text" id="login-username" class="form-control" placeholder="Masukkan username" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-lock"></i> Password</label>
                    <input type="password" id="login-password" class="form-control" placeholder="Masukkan password" required>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="login-remember"> Ingat Saya</label>
                </div>
                <div id="login-error" class="alert alert-error" style="display:none;"></div>
            </form>
        `;
        
        saveBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
        saveBtn.onclick = async () => {
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const remember = document.getElementById('login-remember').checked;
            const errorDiv = document.getElementById('login-error');
            
            if (!username || !password) {
                errorDiv.textContent = 'Username dan password wajib diisi';
                errorDiv.style.display = 'block';
                return;
            }
            
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            saveBtn.disabled = true;
            
            const result = await auth.login(username, password, remember);
            
            if (result.success) {
                this.closeModal();
                this.showToast('Login berhasil! Selamat datang.', 'success');
                await this.navigateTo('dashboard');
            } else {
                errorDiv.textContent = result.message;
                errorDiv.style.display = 'block';
                saveBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
                saveBtn.disabled = false;
            }
        };
        
        this.showModal();
    }

    showRegisterForm() {
        const modalBody = document.getElementById('modal-body');
        const modalTitle = document.getElementById('modal-title');
        const saveBtn = document.getElementById('modal-save-btn');
        
        if (!modalBody) return;
        
        modalTitle.textContent = 'Registrasi Pengguna Baru';
        modalBody.innerHTML = `
            <form onsubmit="return false;">
                <div class="form-group"><label>Nama Lengkap</label><input type="text" id="reg-fullname" class="form-control" required></div>
                <div class="form-group"><label>Username</label><input type="text" id="reg-username" class="form-control" required></div>
                <div class="form-group"><label>Email</label><input type="email" id="reg-email" class="form-control" required></div>
                <div class="form-group"><label>Password</label><input type="password" id="reg-password" class="form-control" required minlength="6"></div>
                <div class="form-group"><label>Konfirmasi Password</label><input type="password" id="reg-confirm" class="form-control" required></div>
                <div id="register-error" class="alert alert-error" style="display:none;"></div>
            </form>
        `;
        
        saveBtn.innerHTML = '<i class="fas fa-user-plus"></i> Daftar';
        saveBtn.onclick = async () => {
            const password = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;
            const errorDiv = document.getElementById('register-error');
            
            if (password !== confirm) {
                errorDiv.textContent = 'Password tidak cocok';
                errorDiv.style.display = 'block';
                return;
            }
            
            const data = {
                fullName: document.getElementById('reg-fullname').value,
                username: document.getElementById('reg-username').value,
                email: document.getElementById('reg-email').value,
                password: password
            };
            
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            saveBtn.disabled = true;
            
            const result = await auth.register(data);
            
            if (result.success) {
                this.closeModal();
                this.showToast('Registrasi berhasil! Silakan login.', 'success');
                this.showLoginForm();
            } else {
                errorDiv.textContent = result.message;
                errorDiv.style.display = 'block';
                saveBtn.innerHTML = '<i class="fas fa-user-plus"></i> Daftar';
                saveBtn.disabled = false;
            }
        };
        
        this.showModal();
    }

    async logout() {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            await auth.logout();
            this.showLandingPage();
            this.showToast('Anda telah logout', 'info');
        }
    }

    // Helper Methods
    getAppLayout(route, title, icon) {
        const user = auth.getUser();
        return `
            <div class="dashboard-page">
                <header class="app-header">
                    <div class="header-container">
                        <div class="header-left">
                            <button class="menu-toggle" onclick="document.querySelector('.sidebar').classList.toggle('active')">
                                <i class="fas fa-bars"></i>
                            </button>
                            <div class="logo-section">
                                <div class="logo-placeholder-small">AS</div>
                                <div>
                                    <h1>Arsip Surat Digital</h1>
                                    <span class="version-badge">Enterprise ${this.version}</span>
                                </div>
                            </div>
                        </div>
                        <div class="header-right">
                            <div class="user-info">
                                <span>${user ? (user.fullName || user.username) : 'User'}</span>
                                <button onclick="window.app.logout()" class="btn btn-secondary btn-sm">
                                    <i class="fas fa-sign-out-alt"></i> Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                
                <div class="main-layout">
                    <aside class="sidebar">
                        <nav>
                            <a href="#dashboard" onclick="window.app.navigateTo('dashboard')" class="nav-link" data-section="dashboard">
                                <i class="fas fa-chart-pie"></i> Dashboard
                            </a>
                            <a href="#surat-masuk" onclick="window.app.navigateTo('surat-masuk')" class="nav-link" data-section="surat-masuk">
                                <i class="fas fa-inbox"></i> Surat Masuk
                            </a>
                            <a href="#surat-keluar" onclick="window.app.navigateTo('surat-keluar')" class="nav-link" data-section="surat-keluar">
                                <i class="fas fa-paper-plane"></i> Surat Keluar
                            </a>
                            <a href="#disposisi" onclick="window.app.navigateTo('disposisi')" class="nav-link" data-section="disposisi">
                                <i class="fas fa-clipboard-list"></i> Disposisi
                            </a>
                            <a href="#kategori" onclick="window.app.navigateTo('kategori')" class="nav-link" data-section="kategori">
                                <i class="fas fa-tags"></i> Kategori
                            </a>
                            <a href="#instansi" onclick="window.app.navigateTo('instansi')" class="nav-link" data-section="instansi">
                                <i class="fas fa-building"></i> Instansi
                            </a>
                            <a href="#laporan" onclick="window.app.navigateTo('laporan')" class="nav-link" data-section="laporan">
                                <i class="fas fa-chart-bar"></i> Laporan
                            </a>
                            ${user && user.role === 'admin' ? `
                            <a href="#pengguna" onclick="window.app.navigateTo('pengguna')" class="nav-link" data-section="pengguna">
                                <i class="fas fa-users"></i> Pengguna
                            </a>` : ''}
                        </nav>
                    </aside>
                    
                    <main class="main-content" id="main-content"></main>
                </div>
            </div>
        `;
    }

    updateSidebarActive(route) {
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-section="${route}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    renderPagination(containerId, pagination, type) {
        const container = document.getElementById(containerId);
        if (!container || !pagination || pagination.totalPages <= 1) return;
        
        let html = '';
        for (let i = 1; i <= pagination.totalPages; i++) {
            html += `<button class="${i === pagination.page ? 'active' : ''}" 
                onclick="window.app.load${type === 'surat-masuk' ? 'SuratMasuk' : type === 'surat-keluar' ? 'SuratKeluar' : 'Disposisi'}Data(${i})">${i}</button>`;
        }
        container.innerHTML = html;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    getStatusClass(status) {
        const classes = { 'baru': 'info', 'diproses': 'warning', 'selesai': 'success', 'diterima': 'info' };
        return classes[status] || 'secondary';
    }

    showModal() {
        const modal = document.getElementById('crud-modal');
        if (modal) { modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    }

    closeModal() {
        const modal = document.getElementById('crud-modal');
        if (modal) { modal.style.display = 'none'; document.body.style.overflow = ''; }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 5000);
    }

    hideSpinner() {
        const spinner = document.getElementById('app-spinner');
        if (spinner) { spinner.classList.add('hidden'); setTimeout(() => { spinner.style.display = 'none'; }, 300); }
    }

    show404() {
        const container = document.getElementById('app-container');
        if (container) {
            container.innerHTML = `<div style="text-align:center;padding:100px;"><h1>404</h1><h3>Halaman Tidak Ditemukan</h3><button class="btn btn-primary" onclick="window.app.navigateTo('dashboard')">Kembali ke Dashboard</button></div>`;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating app instance...');
    window.app = new App();
    window.app.init();
});

function closeModal() { if (window.app) window.app.closeModal(); }
function refreshDashboard() { if (window.app) window.app.refreshDashboard(); }

console.log('App script loaded - Full CRUD PWA Ready');
