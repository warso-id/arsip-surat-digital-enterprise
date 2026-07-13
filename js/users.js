/**
 * ============================================
 * USERS.JS - Users Module
 * ARSIP SURAT DIGITAL v3.2.2
 * FIXED: Delete, Update, Create with proper API handling
 * Sync dengan backend code.gs
 * ============================================
 */

const Users = {
    data: [],
    currentPage: 1,
    totalPages: 1,
    filters: {},
    isLoading: false,
    
    // ========== RENDER ==========
    async render(params = {}) {
        this.filters = params;
        this.currentPage = parseInt(params.page) || 1;
        
        // Check if admin
        if (App.user?.role !== 'admin') {
            return `
                <div class="card">
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-lock" style="font-size: 48px; color: #F44336; display: block; margin-bottom: 16px;"></i>
                        <h3>Akses Ditolak</h3>
                        <p class="text-danger">Anda tidak memiliki akses ke halaman ini.</p>
                        <button class="btn btn-primary mt-2" onclick="App.loadPage('dashboard')">
                            <i class="fas fa-arrow-left"></i> Kembali ke Dashboard
                        </button>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="users-page">
                <!-- Toolbar -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
                        <div class="flex" style="gap: 8px; flex-wrap: wrap;">
                            <div style="position: relative;">
                                <input type="text" id="usersSearch" class="form-control" placeholder="Cari user..." style="width: 250px; padding-left: 32px;" />
                                <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-light);"></i>
                            </div>
                            <select id="usersRole" class="form-control" style="width: 150px;">
                                <option value="">Semua Role</option>
                                <option value="admin">Admin</option>
                                <option value="kabid">Kabid</option>
                                <option value="staff">Staff</option>
                            </select>
                            <select id="usersStatus" class="form-control" style="width: 150px;">
                                <option value="">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </select>
                        </div>
                        <div class="flex" style="gap: 8px;">
                            <button class="btn btn-primary" id="usersCreateBtn">
                                <i class="fas fa-user-plus"></i> User Baru
                            </button>
                            <button class="btn btn-success" id="usersRefreshBtn">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Summary -->
                <div class="stats-grid" style="margin-bottom: 20px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
                    <div class="stat-card" style="padding: 12px 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="stat-label">Total User</span>
                            <span class="stat-number" id="usersTotalCount" style="font-size: 20px;">0</span>
                        </div>
                    </div>
                    <div class="stat-card" style="padding: 12px 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="stat-label">Aktif</span>
                            <span class="stat-number" id="usersActiveCount" style="font-size: 20px; color: #4CAF50;">0</span>
                        </div>
                    </div>
                    <div class="stat-card" style="padding: 12px 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="stat-label">Nonaktif</span>
                            <span class="stat-number" id="usersInactiveCount" style="font-size: 20px; color: #F44336;">0</span>
                        </div>
                    </div>
                    <div class="stat-card" style="padding: 12px 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="stat-label">Admin</span>
                            <span class="stat-number" id="usersAdminCount" style="font-size: 20px; color: #7B1FA2;">0</span>
                        </div>
                    </div>
                </div>
                
                <!-- Table -->
                <div class="card">
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th style="min-width: 120px;">Username</th>
                                    <th style="min-width: 150px;">Nama Lengkap</th>
                                    <th style="min-width: 180px;">Email</th>
                                    <th style="min-width: 120px;">Jabatan</th>
                                    <th style="min-width: 80px;">Role</th>
                                    <th style="min-width: 80px;">Status</th>
                                    <th style="min-width: 160px;">Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                                <tr><td colspan="7" class="text-center text-muted">Memuat data...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="usersPagination" class="flex-center" style="margin-top: 16px; gap: 8px; flex-wrap: wrap;"></div>
                </div>
            </div>
        `;
    },
    
    // ========== INIT ==========
    init() {
        console.log('👥 Users module initializing...');
        this.loadData();
        this.setupEventListeners();
    },
    
    // ========== LOAD DATA ==========
    async loadData() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('👥 Loading users data...');
            const response = await API.get('users.list', {
                token: App.token,
                page: this.currentPage,
                limit: 20,
                search: this.filters.search || '',
                role: this.filters.role || '',
                isActive: this.filters.status === 'active' ? 'true' : this.filters.status === 'inactive' ? 'false' : undefined
            });
            
            if (response.status === 'success') {
                this.data = response.data.items || [];
                this.totalPages = response.data.pagination?.totalPages || 1;
                this.renderTable();
                this.renderPagination();
                this.renderStats();
            } else {
                showToast('error', 'Error', response.message || 'Gagal memuat data');
                document.getElementById('usersTableBody').innerHTML = `
                    <tr><td colspan="7" class="text-center text-danger">${response.message || 'Gagal memuat data'}</td></tr>
                `;
            }
        } catch (error) {
            console.error('❌ Error loading users:', error);
            showToast('error', 'Error', 'Gagal memuat data users: ' + error.message);
            document.getElementById('usersTableBody').innerHTML = `
                <tr><td colspan="7" class="text-center text-danger">Gagal memuat data: ${error.message}</td></tr>
            `;
        } finally {
            this.isLoading = false;
        }
    },
    
    // ========== RENDER STATS ==========
    renderStats() {
        const total = this.data.length;
        const active = this.data.filter(u => u.isActive).length;
        const inactive = total - active;
        const admin = this.data.filter(u => u.role === 'admin').length;
        
        document.getElementById('usersTotalCount').textContent = total;
        document.getElementById('usersActiveCount').textContent = active;
        document.getElementById('usersInactiveCount').textContent = inactive;
        document.getElementById('usersAdminCount').textContent = admin;
    },
    
    // ========== RENDER TABLE ==========
    renderTable() {
        const tbody = document.getElementById('usersTableBody');
        
        if (!tbody) return;
        
        if (this.data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted" style="padding: 40px;">
                        <i class="fas fa-users" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
                        <p>Tidak ada user</p>
                        <button class="btn btn-sm btn-primary mt-2" id="usersCreateEmptyBtn">
                            <i class="fas fa-user-plus"></i> Buat User Pertama
                        </button>
                    </td>
                </tr>
            `;
            document.getElementById('usersCreateEmptyBtn')?.addEventListener('click', () => {
                this.showCreateForm();
            });
            return;
        }
        
        tbody.innerHTML = this.data.map(item => `
            <tr>
                <td><strong>${Utils.truncate(item.username, 15)}</strong></td>
                <td>${Utils.truncate(item.namaLengkap || '-', 20)}</td>
                <td>${Utils.truncate(item.email || '-', 25)}</td>
                <td>${Utils.truncate(item.jabatan || '-', 15)}</td>
                <td>
                    <span class="status-badge" style="
                        background: ${item.role === 'admin' ? '#F3E5F5' : item.role === 'kabid' ? '#E3F2FD' : '#ECEFF1'};
                        color: ${item.role === 'admin' ? '#7B1FA2' : item.role === 'kabid' ? '#1976D2' : '#78909C'};
                    ">
                        ${Utils.capitalize(item.role || 'staff')}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${item.isActive ? 'status-badge approved' : 'status-badge rejected'}">
                        ${item.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        <button class="btn btn-sm btn-outline users-edit-btn" data-id="${item.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm ${item.isActive ? 'btn-warning' : 'btn-success'} users-toggle-btn" 
                                data-id="${item.id}" data-active="${item.isActive}" 
                                title="${item.isActive ? 'Nonaktifkan' : 'Aktifkan'}">
                            <i class="fas ${item.isActive ? 'fa-ban' : 'fa-check'}"></i>
                        </button>
                        ${item.id !== App.user?.id ? `
                            <button class="btn btn-sm btn-danger users-delete-btn" data-id="${item.id}" title="Hapus">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-outline" disabled title="Tidak bisa menghapus sendiri">
                                <i class="fas fa-user-shield"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Attach event listeners
        tbody.querySelectorAll('.users-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (id) this.editUser(id);
            });
        });
        tbody.querySelectorAll('.users-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const active = btn.dataset.active === 'true';
                if (id) this.toggleUser(id, active);
            });
        });
        tbody.querySelectorAll('.users-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (id) this.deleteUser(id);
            });
        });
    },
    
    // ========== RENDER PAGINATION ==========
    renderPagination() {
        const container = document.getElementById('usersPagination');
        if (!container) return;
        
        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let html = '<div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">';
        
        // Prev button
        if (this.currentPage > 1) {
            html += `<button class="btn btn-sm btn-outline page-btn" data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }
        
        // Page numbers
        const start = Math.max(1, this.currentPage - 2);
        const end = Math.min(this.totalPages, this.currentPage + 2);
        
        if (start > 1) {
            html += `<button class="btn btn-sm btn-outline page-btn" data-page="1">1</button>`;
            if (start > 2) html += '<span style="padding: 0 4px; color: var(--text-light);">...</span>';
        }
        
        for (let i = start; i <= end; i++) {
            html += `<button class="btn btn-sm ${i === this.currentPage ? 'btn-primary' : 'btn-outline'} page-btn" 
                            data-page="${i}">${i}</button>`;
        }
        
        if (end < this.totalPages) {
            if (end < this.totalPages - 1) html += '<span style="padding: 0 4px; color: var(--text-light);">...</span>';
            html += `<button class="btn btn-sm btn-outline page-btn" data-page="${this.totalPages}">${this.totalPages}</button>`;
        }
        
        // Next button
        if (this.currentPage < this.totalPages) {
            html += `<button class="btn btn-sm btn-outline page-btn" data-page="${this.currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        // Info
        html += `<span style="margin-left: 12px; font-size: 13px; color: var(--text-light);">
            Halaman ${this.currentPage} dari ${this.totalPages}
        </span>`;
        
        html += '</div>';
        container.innerHTML = html;
        
        // Attach click events
        container.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadData();
                }
            });
        });
    },
    
    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('usersSearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = searchInput.value.trim();
                    this.currentPage = 1;
                    this.loadData();
                }, 500);
            });
        }
        
        // Role filter
        const roleSelect = document.getElementById('usersRole');
        if (roleSelect) {
            roleSelect.addEventListener('change', () => {
                this.filters.role = roleSelect.value;
                this.currentPage = 1;
                this.loadData();
            });
        }
        
        // Status filter
        const statusSelect = document.getElementById('usersStatus');
        if (statusSelect) {
            statusSelect.addEventListener('change', () => {
                this.filters.status = statusSelect.value;
                this.currentPage = 1;
                this.loadData();
            });
        }
        
        // Create button
        const createBtn = document.getElementById('usersCreateBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateForm();
            });
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('usersRefreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadData();
            });
        }
    },
    
    // ========== CREATE FORM ==========
    showCreateForm() {
        const formHTML = `
            <form id="usersForm" style="max-width: 100%;">
                <div class="form-row">
                    <div class="form-group">
                        <label>Username <span class="required">*</span></label>
                        <input type="text" class="form-control" name="username" required 
                               placeholder="Masukkan username" autocomplete="username" />
                    </div>
                    <div class="form-group">
                        <label>Email <span class="required">*</span></label>
                        <input type="email" class="form-control" name="email" required 
                               placeholder="email@domain.com" autocomplete="email" />
                    </div>
                </div>
                <div class="form-group">
                    <label>Nama Lengkap <span class="required">*</span></label>
                    <input type="text" class="form-control" name="namaLengkap" required 
                           placeholder="Nama lengkap" />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Password <span class="required">*</span></label>
                        <input type="password" class="form-control" name="password" required minlength="8" 
                               placeholder="Minimal 8 karakter" autocomplete="new-password" />
                    </div>
                    <div class="form-group">
                        <label>Role <span class="required">*</span></label>
                        <select class="form-control" name="role" required>
                            <option value="staff">Staff</option>
                            <option value="kabid">Kabid</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>NIP</label>
                        <input type="text" class="form-control" name="nip" placeholder="NIP" />
                    </div>
                    <div class="form-group">
                        <label>Jabatan</label>
                        <input type="text" class="form-control" name="jabatan" placeholder="Jabatan" />
                    </div>
                </div>
                <div class="form-group">
                    <label>Unit Kerja</label>
                    <input type="text" class="form-control" name="unitKerja" placeholder="Unit Kerja" />
                </div>
                <div class="form-actions" style="margin-top: 16px;">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary" id="usersFormSubmit">
                        <i class="fas fa-save"></i> Buat User
                    </button>
                </div>
            </form>
        `;
        
        openModal('Tambah User Baru', formHTML);
        
        document.getElementById('usersForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('usersFormSubmit');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await API.post('users.create', data, App.token);
                if (response.status === 'success') {
                    closeModal();
                    showToast('success', 'Berhasil', 'User berhasil dibuat');
                    this.loadData();
                } else {
                    showToast('error', 'Error', response.message || 'Gagal membuat user');
                }
            } catch (error) {
                showToast('error', 'Error', 'Gagal membuat user: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Buat User';
            }
        });
    },
    
    // ========== EDIT USER ==========
    async editUser(id) {
        try {
            // Ambil data user dari list yang sudah dimuat
            let user = this.data.find(u => u.id === id);
            
            // Jika tidak ada di list, ambil dari API
            if (!user) {
                const response = await API.get('users.list', { token: App.token });
                if (response.status === 'success') {
                    user = response.data.items?.find(u => u.id === id);
                }
            }
            
            if (!user) {
                showToast('error', 'Error', 'User tidak ditemukan');
                return;
            }
            
            const formHTML = `
                <form id="usersEditForm" style="max-width: 100%;">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" class="form-control" value="${user.username}" disabled />
                            <small style="color: var(--text-light);">Username tidak dapat diubah</small>
                        </div>
                        <div class="form-group">
                            <label>Email <span class="required">*</span></label>
                            <input type="email" class="form-control" name="email" value="${user.email || ''}" required />
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Nama Lengkap <span class="required">*</span></label>
                        <input type="text" class="form-control" name="namaLengkap" value="${user.namaLengkap || ''}" required />
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Password (kosongkan jika tidak diubah)</label>
                            <input type="password" class="form-control" name="password" 
                                   placeholder="Minimal 8 karakter" autocomplete="new-password" />
                        </div>
                        <div class="form-group">
                            <label>Role</label>
                            <select class="form-control" name="role">
                                <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
                                <option value="kabid" ${user.role === 'kabid' ? 'selected' : ''}>Kabid</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>NIP</label>
                            <input type="text" class="form-control" name="nip" value="${user.nip || ''}" />
                        </div>
                        <div class="form-group">
                            <label>Jabatan</label>
                            <input type="text" class="form-control" name="jabatan" value="${user.jabatan || ''}" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Unit Kerja</label>
                        <input type="text" class="form-control" name="unitKerja" value="${user.unitKerja || ''}" />
                    </div>
                    <div class="form-actions" style="margin-top: 16px;">
                        <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                        <button type="submit" class="btn btn-primary" id="usersEditSubmit">
                            <i class="fas fa-save"></i> Update
                        </button>
                    </div>
                </form>
            `;
            
            openModal('Edit User', formHTML);
            
            document.getElementById('usersEditForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('usersEditSubmit');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
                
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                // Remove empty password
                if (!data.password) delete data.password;
                
                try {
                    const response = await API.put('users.update', {
                        id: id,
                        ...data
                    }, App.token);
                    
                    if (response.status === 'success') {
                        closeModal();
                        showToast('success', 'Berhasil', 'User berhasil diupdate');
                        this.loadData();
                    } else {
                        showToast('error', 'Error', response.message || 'Gagal mengupdate user');
                    }
                } catch (error) {
                    showToast('error', 'Error', 'Gagal mengupdate user: ' + error.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update';
                }
            });
        } catch (error) {
            showToast('error', 'Error', 'Gagal memuat data user: ' + error.message);
        }
    },
    
    // ========== TOGGLE USER ==========
    async toggleUser(id, currentActive) {
        const action = currentActive ? 'menonaktifkan' : 'mengaktifkan';
        const confirmText = `Apakah Anda yakin ingin ${action} user ini?\n\n${currentActive ? 'User akan dinonaktifkan dan tidak bisa login.' : 'User akan diaktifkan kembali.'}`;
        
        if (!confirm(confirmText)) return;
        
        try {
            const response = await API.put('users.update', {
                id: id,
                isActive: !currentActive
            }, App.token);
            
            if (response.status === 'success') {
                showToast('success', 'Berhasil', `User berhasil ${action}`);
                this.loadData();
            } else {
                showToast('error', 'Error', response.message || `Gagal ${action} user`);
            }
        } catch (error) {
            showToast('error', 'Error', `Gagal ${action} user: ${error.message}`);
        }
    },
    
    // ========== DELETE USER ==========
    async deleteUser(id) {
        if (id === App.user?.id) {
            showToast('error', 'Error', 'Tidak bisa menghapus akun sendiri');
            return;
        }
        
        const user = this.data.find(u => u.id === id);
        const confirmText = `Apakah Anda yakin ingin menghapus user "${user?.username || id}"?\n\nUser akan dinonaktifkan secara permanen.`;
        
        if (!confirm(confirmText)) return;
        
        try {
            const response = await API.delete('users.delete', id, App.token);
            
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'User berhasil dinonaktifkan');
                this.loadData();
            } else {
                showToast('error', 'Error', response.message || 'Gagal menghapus user');
            }
        } catch (error) {
            showToast('error', 'Error', 'Gagal menghapus user: ' + error.message);
        }
    }
};

console.log('👥 Users Module Loaded');
