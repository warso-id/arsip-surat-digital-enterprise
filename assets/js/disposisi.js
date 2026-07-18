/* ============================================
   ENTERPRISE DISPOSISI MODULE
   ============================================ */
(function() {
    'use strict';

    class DisposisiModule {
        constructor() {
            this.filters = {};
            this.currentPage = 1;
            this.pageSize = 20;
        }

        async showList() {
            const container = document.getElementById('disposisi-list-content');
            if (!container) return;

            container.innerHTML = this.getListTemplate();
            await this.loadData();
            this.setupEvents();
        }

        getListTemplate() {
            return `
                <div class="toolbar">
                    <div class="search-box">
                        <input type="text" class="search-input" placeholder="Cari disposisi..." id="search-disposisi">
                    </div>
                    <div class="filter-group">
                        <select id="filter-status-disposisi" class="form-control">
                            <option value="">Semua Status</option>
                            <option value="pending">Pending</option>
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
                                <th>Surat Terkait</th>
                                <th>Tujuan</th>
                                <th>Instruksi</th>
                                <th>Tanggal</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="disposisi-table-body">
                            <tr><td colspan="7" class="text-center">Memuat data...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="pagination" id="disposisi-pagination"></div>
            `;
        }

        async loadData() {
            const tbody = document.getElementById('disposisi-table-body');
            if (!tbody) return;

            try {
                let data = await DB.getAll('disposisi');

                // Apply filters
                if (this.filters.status) {
                    data = data.filter(item => item.status === this.filters.status);
                }
                if (this.filters.search) {
                    const term = this.filters.search.toLowerCase();
                    data = data.filter(item =>
                        item.tujuan?.toLowerCase().includes(term) ||
                        item.instruksi?.toLowerCase().includes(term)
                    );
                }

                // Pagination
                const totalItems = data.length;
                const totalPages = Math.ceil(totalItems / this.pageSize);
                const start = (this.currentPage - 1) * this.pageSize;
                const paginatedData = data.slice(start, start + this.pageSize);

                if (paginatedData.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" class="text-center">Tidak ada data disposisi</td></tr>`;
                } else {
                    tbody.innerHTML = paginatedData.map((item, index) => `
                        <tr>
                            <td>${start + index + 1}</td>
                            <td>${item.nomor_surat || '-'}</td>
                            <td>${item.tujuan || '-'}</td>
                            <td>${item.instruksi || '-'}</td>
                            <td>${this.formatDate(item.tanggal_disposisi)}</td>
                            <td><span class="badge badge-${item.status}">${item.status || 'Pending'}</span></td>
                            <td class="action-buttons">
                                <button class="btn-icon btn-view" data-id="${item.id}">
                                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/></svg>
                                </button>
                                <button class="btn-icon btn-delete" data-id="${item.id}">
                                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
                                </button>
                            </td>
                        </tr>
                    `).join('');
                }

                this.renderPagination(totalPages, totalItems);

            } catch (error) {
                Logger.error('Failed to load disposisi:', error);
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Gagal memuat data</td></tr>`;
            }
        }

        renderPagination(totalPages, totalItems) {
            const pagination = document.getElementById('disposisi-pagination');
            if (!pagination) return;

            if (totalPages <= 1) {
                pagination.innerHTML = '';
                return;
            }

            let html = `<div class="pagination-info">Total: ${totalItems} data</div><div class="pagination-buttons">`;
            
            for (let i = 1; i <= totalPages; i++) {
                html += `<button class="btn-page ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }
            
            html += '</div>';
            pagination.innerHTML = html;

            pagination.querySelectorAll('.btn-page').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.currentPage = parseInt(btn.dataset.page);
                    this.loadData();
                });
            });
        }

        async showForm() {
            const container = document.getElementById('disposisi-form-content');
            if (!container) return;

            // Get surat masuk list for selection
            const suratMasuk = await DB.getAll('surat_masuk');

            container.innerHTML = `
                <form id="disposisi-form" class="enterprise-form">
                    <div class="form-card">
                        <h3>Tambah Disposisi</h3>
                        
                        <div class="form-group">
                            <label>Surat Terkait *</label>
                            <select id="surat_id" class="form-control" required>
                                <option value="">Pilih Surat</option>
                                ${suratMasuk.map(s => `
                                    <option value="${s.id}">${s.nomor_surat} - ${s.perihal}</option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Tujuan Disposisi *</label>
                            <input type="text" id="tujuan" class="form-control" required 
                                   placeholder="Nama/Unit tujuan disposisi">
                        </div>

                        <div class="form-group">
                            <label>Instruksi *</label>
                            <textarea id="instruksi" class="form-control" rows="3" required 
                                      placeholder="Instruksi disposisi"></textarea>
                        </div>

                        <div class="form-group">
                            <label>Tanggal Disposisi *</label>
                            <input type="date" id="tanggal_disposisi" class="form-control" required>
                        </div>

                        <div class="form-group">
                            <label>Status</label>
                            <select id="status" class="form-control">
                                <option value="pending">Pending</option>
                                <option value="diproses">Diproses</option>
                                <option value="selesai">Selesai</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Catatan</label>
                            <textarea id="catatan" class="form-control" rows="2" 
                                      placeholder="Catatan tambahan"></textarea>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="history.back()">Batal</button>
                            <button type="submit" class="btn btn-primary">Simpan Disposisi</button>
                        </div>
                    </div>
                </form>
            `;

            // Set default date to today
            document.getElementById('tanggal_disposisi').value = new Date().toISOString().split('T')[0];

            // Form submit handler
            document.getElementById('disposisi-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveDisposisi();
            });
        }

        async saveDisposisi() {
            try {
                Spinner.show('Menyimpan disposisi...');

                const suratId = parseInt(document.getElementById('surat_id').value);
                const surat = await DB.getById('surat_masuk', suratId);

                const disposisiData = {
                    surat_id: suratId,
                    nomor_surat: surat?.nomor_surat || '',
                    perihal: surat?.perihal || '',
                    tujuan: document.getElementById('tujuan').value,
                    instruksi: document.getElementById('instruksi').value,
                    tanggal_disposisi: document.getElementById('tanggal_disposisi').value,
                    status: document.getElementById('status').value,
                    catatan: document.getElementById('catatan').value
                };

                await DB.add('disposisi', disposisiData);
                
                // Update surat status
                await DB.update('surat_masuk', suratId, { 
                    ...surat, 
                    status: 'diproses' 
                });

                showToast('Disposisi berhasil disimpan', 'success');
                Router.navigate('/disposisi');

            } catch (error) {
                Logger.error('Failed to save disposisi:', error);
                showToast('Gagal menyimpan disposisi', 'error');
            } finally {
                Spinner.hide();
            }
        }

        async showDetail(id) {
            const container = document.getElementById('disposisi-detail-content');
            if (!container) return;

            try {
                const data = await DB.getById('disposisi', id);
                if (!data) {
                    container.innerHTML = '<div class="error-state">Data tidak ditemukan</div>';
                    return;
                }

                container.innerHTML = `
                    <div class="detail-card">
                        <h3>Detail Disposisi</h3>
                        <table class="detail-table">
                            <tr><td class="label">Nomor Surat</td><td>: ${data.nomor_surat || '-'}</td></tr>
                            <tr><td class="label">Perihal Surat</td><td>: ${data.perihal || '-'}</td></tr>
                            <tr><td class="label">Tujuan</td><td>: ${data.tujuan || '-'}</td></tr>
                            <tr><td class="label">Instruksi</td><td>: ${data.instruksi || '-'}</td></tr>
                            <tr><td class="label">Tanggal</td><td>: ${this.formatDate(data.tanggal_disposisi)}</td></tr>
                            <tr><td class="label">Status</td><td>: <span class="badge badge-${data.status}">${data.status}</span></td></tr>
                            <tr><td class="label">Catatan</td><td>: ${data.catatan || '-'}</td></tr>
                        </table>
                        <button class="btn btn-secondary" onclick="history.back()">Kembali</button>
                    </div>
                `;
            } catch (error) {
                container.innerHTML = '<div class="error-state">Gagal memuat detail</div>';
            }
        }

        setupEvents() {
            // Search
            document.getElementById('search-disposisi')?.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.loadData();
            });

            // Filter status
            document.getElementById('filter-status-disposisi')?.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.currentPage = 1;
                this.loadData();
            });

            // Action buttons
            document.getElementById('disposisi-table-body')?.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;

                const id = parseInt(btn.dataset.id);
                
                if (btn.classList.contains('btn-view')) {
                    Router.navigate(`/disposisi?id=${id}`);
                } else if (btn.classList.contains('btn-delete')) {
                    this.deleteDisposisi(id);
                }
            });
        }

        async deleteDisposisi(id) {
            const confirmed = await App.showConfirm(
                'Apakah Anda yakin ingin menghapus disposisi ini?',
                'Konfirmasi Hapus'
            );

            if (confirmed) {
                try {
                    await DB.delete('disposisi', id);
                    showToast('Disposisi berhasil dihapus', 'success');
                    await this.loadData();
                } catch (error) {
                    showToast('Gagal menghapus disposisi', 'error');
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
    }

    window.Disposisi = new DisposisiModule();
    Logger.info('Disposisi module loaded');
})();
