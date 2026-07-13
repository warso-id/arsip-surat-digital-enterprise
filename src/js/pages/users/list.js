/**
 * USERS LIST PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class UsersListPage {
  constructor() {
    this.container = null;
    this.users = [];
    this.pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };
    this.filters = { search: '', role: '', status: '' };
    this.selectedUsers = new Set();
    this.isLoading = false;
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    await this.loadUsers();
  }
  
  getTemplate() {
    return `
      <div class="users-page">
        <div class="content-area__header">
          <div class="header-left">
            <h1 class="content-area__title">Manajemen Pengguna</h1>
            <p class="content-area__description">Kelola pengguna sistem</p>
          </div>
          <div class="header-right">
            <button class="btn btn-primary" id="btn-add-user">
              <span class="material-icons">person_add</span>
              Tambah Pengguna
            </button>
            <button class="btn btn-secondary" id="btn-bulk-create">
              <span class="material-icons">upload</span>
              Import CSV
            </button>
          </div>
        </div>
        
        <div class="filters-bar">
          <div class="search-input">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input" placeholder="Cari pengguna..." id="filter-search">
          </div>
          <select class="form-select" id="filter-role" style="width:180px">
            <option value="">Semua Role</option>
            <option value="admin">Administrator</option>
            <option value="kabid">Kepala Bidang</option>
            <option value="kasubag">Kepala Sub Bagian</option>
            <option value="staff">Staff</option>
            <option value="sekretaris">Sekretaris</option>
          </select>
          <select class="form-select" id="filter-status" style="width:150px">
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          <span class="text-muted" id="total-users">0 pengguna</span>
        </div>
        
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" id="select-all" class="form-checkbox__input"></th>
                <th>Pengguna</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Unit Kerja</th>
                <th>Status</th>
                <th>Login Terakhir</th>
                <th width="100">Aksi</th>
              </tr>
            </thead>
            <tbody id="users-tbody"></tbody>
          </table>
        </div>
        
        <div class="pagination" id="pagination">
          <div class="pagination__info">
            Menampilkan <span id="page-start">0</span>-<span id="page-end">0</span> dari <span id="page-total">0</span>
          </div>
          <div class="pagination__controls">
            <button class="btn-icon" id="btn-prev" disabled><span class="material-icons">chevron_left</span></button>
            <span id="page-current">1</span>
            <button class="btn-icon" id="btn-next" disabled><span class="material-icons">chevron_right</span></button>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadUsers() {
    if (this.isLoading) return;
    this.isLoading = true;
    
    try {
      const response = await api.getUsersList({
        page: this.pagination.page,
        limit: this.pagination.limit,
        search: this.filters.search,
        role: this.filters.role,
        status: this.filters.status
      });
      
      if (response.status === 'success') {
        this.users = response.data.items || [];
        this.pagination = { ...this.pagination, ...response.data.pagination };
        this.renderTable();
        this.updatePagination();
        document.getElementById('total-users').textContent = `${this.pagination.total} pengguna`;
      }
    } catch (error) {
      NotificationService.error('Gagal memuat data pengguna');
    } finally {
      this.isLoading = false;
    }
  }
  
  renderTable() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    
    if (this.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center"><div class="empty-state"><span class="material-icons">people_outline</span><p>Tidak ada pengguna</p></div></td></tr>`;
      return;
    }
    
    tbody.innerHTML = this.users.map(user => `
      <tr class="data-table__row" data-id="${user.id}">
        <td><input type="checkbox" class="form-checkbox__input row-checkbox" data-id="${user.id}"></td>
        <td>
          <div class="user-cell">
            <div class="avatar avatar-sm">${this.getInitials(user)}</div>
            <div>
              <div class="user-name">${user.namaLengkap || user.username}</div>
              <div class="user-nip">${user.nip || '-'}</div>
            </div>
          </div>
        </td>
        <td><span class="text-mono">${user.username}</span></td>
        <td>${user.email || '-'}</td>
        <td><span class="badge badge-${this.getRoleClass(user.role)}">${Formatters.roleLabel(user.role)}</span></td>
        <td>${user.unitKerja || '-'}</td>
        <td>
          <span class="badge ${user.isActive ? 'badge-success' : 'badge-error'}">
            ${user.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        </td>
        <td>${Formatters.relativeTime(user.lastLogin)}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-icon-sm" onclick="window._editUser('${user.id}')" title="Edit">
              <span class="material-icons">edit</span>
            </button>
            <button class="btn-icon btn-icon-sm" onclick="window._resetPassword('${user.id}')" title="Reset Password">
              <span class="material-icons">lock_reset</span>
            </button>
            <div class="dropdown">
              <button class="btn-icon btn-icon-sm dropdown-toggle" title="Lainnya">
                <span class="material-icons">more_vert</span>
              </button>
              <div class="dropdown__menu">
                <button class="dropdown__item" onclick="window._viewActivity('${user.id}')">
                  <span class="material-icons">history</span> Aktivitas
                </button>
                <button class="dropdown__item" onclick="window._toggleUser('${user.id}')">
                  <span class="material-icons">${user.isActive ? 'block' : 'check_circle'}</span>
                  ${user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <div class="dropdown__divider"></div>
                <button class="dropdown__item dropdown__item--danger" onclick="window._deleteUser('${user.id}')">
                  <span class="material-icons">delete</span> Hapus
                </button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    `).join('');
  }
  
  async createUser() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modal-content--md">
        <div class="modal-header">
          <h3>Tambah Pengguna</h3>
          <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form">
            <div class="form-row">
              <div class="form-field">
                <label class="form-label form-label--required">Username</label>
                <input type="text" class="form-input" id="new-username" placeholder="Username">
              </div>
              <div class="form-field">
                <label class="form-label form-label--required">Password</label>
                <input type="password" class="form-input" id="new-password" placeholder="Minimal 8 karakter">
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label form-label--required">Nama Lengkap</label>
                <input type="text" class="form-input" id="new-nama" placeholder="Nama lengkap">
              </div>
              <div class="form-field">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="new-email" placeholder="Email">
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">NIP</label>
                <input type="text" class="form-input" id="new-nip" placeholder="18 digit NIP">
              </div>
              <div class="form-field">
                <label class="form-label">Jabatan</label>
                <input type="text" class="form-input" id="new-jabatan" placeholder="Jabatan">
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Unit Kerja</label>
                <input type="text" class="form-input" id="new-unit" placeholder="Unit kerja">
              </div>
              <div class="form-field">
                <label class="form-label">Role</label>
                <select class="form-select" id="new-role">
                  <option value="staff">Staff</option>
                  <option value="kasubag">Kepala Sub Bagian</option>
                  <option value="kabid">Kepala Bidang</option>
                  <option value="sekretaris">Sekretaris</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Batal</button>
          <button class="btn btn-primary" id="btn-save-user">Simpan</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#btn-save-user').addEventListener('click', async () => {
      const data = {
        username: modal.querySelector('#new-username').value.trim(),
        password: modal.querySelector('#new-password').value,
        namaLengkap: modal.querySelector('#new-nama').value.trim(),
        email: modal.querySelector('#new-email').value.trim(),
        nip: modal.querySelector('#new-nip').value.trim(),
        jabatan: modal.querySelector('#new-jabatan').value.trim(),
        unitKerja: modal.querySelector('#new-unit').value.trim(),
        role: modal.querySelector('#new-role').value
      };
      
      if (!data.username || !data.password || !data.namaLengkap) {
        NotificationService.error('Username, password, dan nama lengkap wajib diisi');
        return;
      }
      
      try {
        const response = await api.createUser(data);
        if (response.status === 'success') {
          NotificationService.success('Pengguna berhasil ditambahkan');
          modal.remove();
          this.loadUsers();
        }
      } catch (error) {
        NotificationService.error('Gagal menambah pengguna');
      }
    });
    
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }
  
  async editUser(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content modal-content--md">
        <div class="modal-header">
          <h3>Edit Pengguna</h3>
          <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form">
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Username</label>
                <input type="text" class="form-input" id="edit-username" value="${user.username}" disabled>
              </div>
              <div class="form-field">
                <label class="form-label form-label--required">Nama Lengkap</label>
                <input type="text" class="form-input" id="edit-nama" value="${user.namaLengkap || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" id="edit-email" value="${user.email || ''}">
              </div>
              <div class="form-field">
                <label class="form-label">NIP</label>
                <input type="text" class="form-input" id="edit-nip" value="${user.nip || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Jabatan</label>
                <input type="text" class="form-input" id="edit-jabatan" value="${user.jabatan || ''}">
              </div>
              <div class="form-field">
                <label class="form-label">Unit Kerja</label>
                <input type="text" class="form-input" id="edit-unit" value="${user.unitKerja || ''}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Role</label>
                <select class="form-select" id="edit-role">
                  <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>Staff</option>
                  <option value="kasubag" ${user.role === 'kasubag' ? 'selected' : ''}>Kepala Sub Bagian</option>
                  <option value="kabid" ${user.role === 'kabid' ? 'selected' : ''}>Kepala Bidang</option>
                  <option value="sekretaris" ${user.role === 'sekretaris' ? 'selected' : ''}>Sekretaris</option>
                  <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">Status</label>
                <div class="form-switch">
                  <input type="checkbox" class="form-switch__input" id="edit-active" ${user.isActive ? 'checked' : ''}>
                  <div class="form-switch__track"></div>
                  <span class="form-switch__label">${user.isActive ? 'Aktif' : 'Nonaktif'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove()">Batal</button>
          <button class="btn btn-primary" id="btn-update-user">Simpan Perubahan</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#btn-update-user').addEventListener('click', async () => {
      const data = {
        namaLengkap: modal.querySelector('#edit-nama').value.trim(),
        email: modal.querySelector('#edit-email').value.trim(),
        nip: modal.querySelector('#edit-nip').value.trim(),
        jabatan: modal.querySelector('#edit-jabatan').value.trim(),
        unitKerja: modal.querySelector('#edit-unit').value.trim(),
        role: modal.querySelector('#edit-role').value,
        isActive: modal.querySelector('#edit-active').checked
      };
      
      try {
        const response = await api.updateUser(id, data);
        if (response.status === 'success') {
          NotificationService.success('Pengguna berhasil diupdate');
          modal.remove();
          this.loadUsers();
        }
      } catch (error) {
        NotificationService.error('Gagal mengupdate pengguna');
      }
    });
    
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }
  
  async resetPassword(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;
    
    const confirmed = await NotificationService.confirm(
      `Reset password untuk pengguna "${user.username}"? Password akan direset ke default.`,
      'Reset Password'
    );
    
    if (confirmed) {
      try {
        await api.post('users.update', { id, password: 'Pass1234!' });
        NotificationService.success(`Password untuk ${user.username} telah direset`);
      } catch (error) {
        NotificationService.error('Gagal mereset password');
      }
    }
  }
  
  async toggleUser(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;
    
    const action = user.isActive ? 'menonaktifkan' : 'mengaktifkan';
    const confirmed = await NotificationService.confirm(
      `Apakah Anda yakin ingin ${action} pengguna "${user.username}"?`
    );
    
    if (confirmed) {
      try {
        await api.updateUser(id, { isActive: !user.isActive });
        NotificationService.success(`Pengguna berhasil ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
        this.loadUsers();
      } catch (error) {
        NotificationService.error('Gagal mengubah status pengguna');
      }
    }
  }
  
  async deleteUser(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) return;
    
    const confirmed = await NotificationService.confirm(
      `Hapus pengguna "${user.username}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      'Konfirmasi Hapus',
      { type: 'error', confirmText: 'Hapus', confirmClass: 'btn-error' }
    );
    
    if (confirmed) {
      try {
        await api.deleteUser(id);
        NotificationService.success('Pengguna berhasil dihapus');
        this.loadUsers();
      } catch (error) {
        NotificationService.error('Gagal menghapus pengguna');
      }
    }
  }
  
  getInitials(user) {
    const name = user.namaLengkap || user.username;
    return Formatters.initials(name);
  }
  
  getRoleClass(role) {
    const classes = { 'admin': 'error', 'kabid': 'warning', 'kasubag': 'info', 'staff': 'default', 'sekretaris': 'primary' };
    return classes[role] || 'default';
  }
  
  updatePagination() {
    const { page, total, totalPages } = this.pagination;
    document.getElementById('btn-prev').disabled = page <= 1;
    document.getElementById('btn-next').disabled = page >= totalPages;
    document.getElementById('page-current').textContent = page;
    document.getElementById('page-start').textContent = total > 0 ? (page - 1) * 20 + 1 : 0;
    document.getElementById('page-end').textContent = Math.min(page * 20, total);
    document.getElementById('page-total').textContent = total;
  }
  
  bindEvents() {
    document.getElementById('btn-add-user')?.addEventListener('click', () => this.createUser());
    document.getElementById('filter-search')?.addEventListener('input', debounce((e) => {
      this.filters.search = e.target.value;
      this.pagination.page = 1;
      this.loadUsers();
    }, 500));
    document.getElementById('filter-role')?.addEventListener('change', (e) => {
      this.filters.role = e.target.value;
      this.pagination.page = 1;
      this.loadUsers();
    });
    document.getElementById('filter-status')?.addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.pagination.page = 1;
      this.loadUsers();
    });
    document.getElementById('btn-prev')?.addEventListener('click', () => {
      if (this.pagination.page > 1) { this.pagination.page--; this.loadUsers(); }
    });
    document.getElementById('btn-next')?.addEventListener('click', () => {
      if (this.pagination.page < this.pagination.totalPages) { this.pagination.page++; this.loadUsers(); }
    });
  }
}

window._editUser = (id) => { const page = document.querySelector('.users-page'); if (page?._instance) page._instance.editUser(id); };
window._resetPassword = (id) => { const page = document.querySelector('.users-page'); if (page?._instance) page._instance.resetPassword(id); };
window._toggleUser = (id) => { const page = document.querySelector('.users-page'); if (page?._instance) page._instance.toggleUser(id); };
window._deleteUser = (id) => { const page = document.querySelector('.users-page'); if (page?._instance) page._instance.deleteUser(id); };
window._viewActivity = (id) => { router.navigate(`/audit-log?userId=${id}`); };

const UsersListComponent = (props) => {
  const page = new UsersListPage();
  const container = document.createElement('div');
  container.className = 'content-area users-page';
  container._instance = page;
  page.render(container);
  return container;
};
