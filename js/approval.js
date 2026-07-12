/**
 * ============================================
 * APPROVAL.JS - Approval Module
 * ARSIP SURAT DIGITAL v3.2.2
 * ============================================
 */

const Approval = {
    data: [],
    currentPage: 1,
    totalPages: 1,
    filters: {},
    
    // ========== RENDER ==========
    async render(params = {}) {
        this.filters = params;
        this.currentPage = parseInt(params.page) || 1;
        
        return `
            <div class="approval-page">
                <!-- Toolbar -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
                        <div class="flex" style="gap: 8px; flex-wrap: wrap;">
                            <select id="apprStatus" class="form-control" style="width: 150px;">
                                <option value="">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                        </div>
                        <div class="flex" style="gap: 8px;">
                            <button class="btn btn-success" id="apprRefreshBtn">
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
                                    <th>Surat Keluar</th>
                                    <th>Level</th>
                                    <th>Status</th>
                                    <th>Komentar</th>
                                    <th>Tanggal</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="apprTableBody">
                                <tr><td colspan="6" class="text-center text-muted">Memuat data...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="apprPagination" class="flex-center" style="margin-top: 16px;"></div>
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
            const response = await API.get('approval.list', {
                token: App.token,
                page: this.currentPage,
                limit: 20,
                status: this.filters.status || ''
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
            Utils.handleError(error, 'Gagal memuat data approval');
        }
    },
    
    // ========== RENDER TABLE ==========
    renderTable() {
        const tbody = document.getElementById('apprTableBody');
        
        if (this.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Tidak ada data</td></tr>`;
            return;
        }
        
        tbody.innerHTML = this.data.map(item => `
            <tr>
                <td>${item.suratKeluarId || '-'}</td>
                <td>Level ${item.level || 1}</td>
                <td><span class="${Utils.getStatusBadge(item.status)}">${Utils.getStatusLabel(item.status)}</span></td>
                <td>${Utils.truncate(item.komentar, 30) || '-'}</td>
                <td>${Utils.formatDate(item.createdAt)}</td>
                <td>
                    ${item.status === 'pending' ? `
                        <button class="btn btn-sm btn-success appr-approve-btn" data-id="${item.id}">
                            <i class="fas fa-check"></i> Setuju
                        </button>
                        <button class="btn btn-sm btn-danger appr-reject-btn" data-id="${item.id}">
                            <i class="fas fa-times"></i> Tolak
                        </button>
                    ` : `
                        <span class="text-muted">Selesai</span>
                    `}
                </td>
            </tr>
        `).join('');
        
        // Attach event listeners
        tbody.querySelectorAll('.appr-approve-btn').forEach(btn => {
            btn.addEventListener('click', () => this.processApproval(btn.dataset.id, 'approved'));
        });
        tbody.querySelectorAll('.appr-reject-btn').forEach(btn => {
            btn.addEventListener('click', () => this.processApproval(btn.dataset.id, 'rejected'));
        });
    },
    
    // ========== RENDER PAGINATION ==========
    renderPagination() {
        const container = document.getElementById('apprPagination');
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
        document.getElementById('apprStatus')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.currentPage = 1;
            this.loadData();
        });
        
        document.getElementById('apprRefreshBtn')?.addEventListener('click', () => {
            this.loadData();
        });
    },
    
    // ========== PROCESS APPROVAL ==========
    processApproval(id, status) {
        const actionText = status === 'approved' ? 'menyetujui' : 'menolak';
        const confirmText = `Apakah Anda yakin ingin ${actionText} approval ini?`;
        
        if (!confirm(confirmText)) return;
        
        const formHTML = `
            <form id="apprForm">
                <div class="form-group">
                    <label>Komentar</label>
                    <textarea class="form-control" name="komentar" rows="3" placeholder="Tambahkan komentar..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Batal</button>
                    <button type="submit" class="btn ${status === 'approved' ? 'btn-success' : 'btn-danger'}">
                        ${status === 'approved' ? 'Setujui' : 'Tolak'}
                    </button>
                </div>
            </form>
        `;
        
        openModal(`${status === 'approved' ? 'Setujui' : 'Tolak'} Approval`, formHTML);
        
        document.getElementById('apprForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await API.post('approval.process', {
                    id: id,
                    status: status,
                    komentar: data.komentar || ''
                }, App.token);
                
                if (response.status === 'success') {
                    closeModal();
                    showToast('success', 'Berhasil', `Approval berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
                    this.loadData();
                } else {
                    showToast('error', 'Error', response.message || `Gagal ${status === 'approved' ? 'menyetujui' : 'menolak'} approval`);
                }
            } catch (error) {
                Utils.handleError(error, `Gagal ${status === 'approved' ? 'menyetujui' : 'menolak'} approval`);
            }
        });
    }
};
