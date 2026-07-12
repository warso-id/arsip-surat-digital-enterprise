/**
 * ============================================
 * USERS.JS - Users Module
 * ARSIP SURAT DIGITAL v3.2.2
 * ============================================
 */

const Users = {
    data: [],
    currentPage: 1,
    totalPages: 1,
    filters: {},
    
    // ========== RENDER ==========
    async render(params = {}) {
        this.filters = params;
        this.currentPage = parseInt(params.page) || 1;
        
        // Check if admin
        if (App.user?.role !== 'admin') {
            return `
                <div class="card">
                    <h3>Akses Ditolak</h3>
                    <p class="text-danger">Anda tidak memiliki akses ke halaman ini.</p>
                </div>
            `;
        }
        
        return `
            <div class="users-page">
                <!-- Toolbar -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
                        <div class="flex" style="gap: 8px; flex-wrap: wrap;">
                            <input type="text" id="usersSearch" class="form-control" placeholder="Cari user..." style="width: 250px;" />
                            <select id="usersRole" class="form-control" style="width: 150px;">
                                <option value="">Semua Role</option>
                                <option value="admin">Admin</option>
                                <option value="kabid">Kabid</option>
                                <option value="staff">Staff</option>
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
                
                <!-- Table -->
                <div class="card">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Nama Lengkap</th>
                                    <th>Email</th>
                                    <th>Jabatan</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                                <tr><td colspan="7" class="text-center text-muted">Memuat data...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="usersPagination" class="flex-center" style="margin-top: 16px;"></div>
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
            const response = await API.get('users.list', {
                token: App.token,
                page: this.currentPage,
                limit: 20,
                search: this.filters.search || '',
                role: this.filters.role || ''
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
            Utils.handleError(error, 'Gagal memuat data users');
        }
    },
    
    // ========== RENDER TABLE ==========
    renderTable() {
        const tbody = document.getElementById('usersTableBody');
        
        if (this.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Tidak ada data</td></tr>`;
            return;
        }
        
        tbody.innerHTML = this.data.map(item => `
            <tr>
                <td><strong>${item.username}</strong></td>
                <td>${item.namaLengkap || '-'}</td>
                <td>${item.email || '-'}</td>
                <td>${item.jabatan || '-'}</td>
                <td><span class="status-badge">${item.role}</span></td>
                <td>
                    <span class="status-badge ${item.isActive ? 'status-badge approved' : 'status-badge rejected'}">
                        ${item.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline users-edit-btn" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm ${item.isActive ? 'btn-warning' : 'btn-success'} users-toggle-btn" data-id="${item.id}" data-active="${item.isActive}">
                        <i class="fas ${item.isActive ? 'fa-ban' : 'fa-check'}"></i>
                    </button>
                    ${item.id !== App.user?.id ? `
                        <button class="btn btn-sm btn-danger users-delete-btn" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
        // Attach event listeners
        tbody.querySelectorAll('.users-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editUser(btn.dataset.id));
        });
        tbody.querySelectorAll('.users-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleUser(btn.dataset.id, btn.dataset.active === 'true'));
        });
        tbody.querySelectorAll('.users-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteUser(btn.dataset.id));
        });
    },
    
    // ========== RENDER PAGINATION ==========
    renderPagination() {
        const container = document.getElementById('usersPagination');
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
        const searchInput = document.getElementById('usersSearch');
        let searchTimeout;
        searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = searchInput.value;
                this.currentPage = 1;
                this.loadData();
            }, 500);
        });
        
        document.getElementById('usersRole')?.addEventListener('change', (e) => {
            this.filters.role = e.target.value;
            this.currentPage = 1;
            this.loadData();
        });
        
        document.getElementById('usersCreateBtn')?.addEventListener('click', () => {
            this.showCreateForm();
        });
        
        document.getElementById('usersRefreshBtn')?.addEventListener('click', () => {
            this.loadData();
        });
    },
    
    // ========== CREATE FORM ==========
    showCreateForm() {
        const formHTML = `
            <form id="usersForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Username <span class="required">*</span></label>
                        <input type="text" class="form-control" name="username" required />
                    </div>
                    <div class="form-group">
                        <label>Email <span class="required">*</span></label>
                        <input type="email" class="form-control" name="email" required />
                    </div>
                </div>
                <div class="form-group">
                    <label>Nama Lengkap <span class="required">*</span></label>
                    <input type="text" class="form-control" name="namaLengkap" required />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Password <span class="required">*</span></label>
                        <input type="password" class="form-control" name="password" required minlength="8" />
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
                        <input type="text" class="form-control" name="nip" />
                    </div>
                    <div class="form-group">
                        <label>Jabatan</label>
                        <input type="text" class="form-control" name="jabatan" />
                    </div>
                </div>
                <div class="form-group">
                    <label>Unit Kerja</label>
                    <input type="text" class="form-control" name="unitKerja" />
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn btn-primary">Buat User</button>
                </div>
            </form>
        `;
        
        openModal('Tambah User Baru', formHTML);
        
        document.getElementById('usersForm').addEventListener('submit', async (e) => {
            e.preventDefault();
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
                Utils.handleError(error, 'Gagal membuat user');
            }
        });
    },
    
    // ========== EDIT USER ==========
    async editUser(id) {
        try {
            const response = await API.get('users.list', {
                token: App.token
            });
            
            if (response.status === 'success') {
                const user = response.data.items?.find(u => u.id === id);
                if (!user) {
                    showToast('error', 'Error', 'User tidak ditemukan');
                    return;
                }
                
                const formHTML = `
                    <form id="usersEditForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Username</label>
                                <input type="text" class="form-control" value="${user.username}" disabled />
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" class="form-control" name="email" value="${user.email || ''}" required />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Nama Lengkap</label>
                            <input type="text" class="form-control" name="namaLengkap" value="${user.namaLengkap || ''}" required />
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Password (kosongkan jika tidak diubah)</label>
                                <input type="password" class="form-control" name="password" placeholder="Minimal 8 karakter" />
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
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                            <button type="submit" class="btn btn-primary">Update</button>
                        </div>
                    </form>
                `;
                
                openModal('Edit User', formHTML);
                
                document.getElementById('usersEditForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    
                    // Remove empty password
                    if (!data.password) delete data.password;
                    
                    try {
                        const response = await API.post('users.update', {
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
                        Utils.handleError(error, 'Gagal mengupdate user');
                    }
                });
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal memuat data user');
        }
    },
    
    // ========== TOGGLE USER ==========
    async toggleUser(id, currentActive) {
        const action = currentActive ? 'menonaktifkan' : 'mengaktifkan';
        if (!confirm(`Apakah Anda yakin ingin ${action} user ini?`)) return;
        
        try {
            const response = await API.post('users.update', {
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
            Utils.handleError(error, `Gagal ${action} user`);
        }
    },
    
    // ========== DELETE USER ==========
    async deleteUser(id) {
        if (id === App.user?.id) {
            showToast('error', 'Error', 'Tidak bisa menghapus sendiri');
            return;
        }
        
        if (!confirm('Apakah Anda yakin ingin menonaktifkan user ini?')) return;
        
        try {
            const response = await API.post('users.delete', {
                id: id
            }, App.token);
            
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'User berhasil dinonaktifkan');
                this.loadData();
            } else {
                showToast('error', 'Error', response.message || 'Gagal menonaktifkan user');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal menonaktifkan user');
        }
    }
};
