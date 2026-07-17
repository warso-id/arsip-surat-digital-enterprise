// disposisi.js - Enterprise Disposisi Module
class DisposisiModule {
    constructor(app) {
        this.app = app;
        this.currentPage = 1;
    }

    async loadDisposisi(page = 1) {
        try {
            this.currentPage = page;
            
            const response = await this.app.apiRequest('getDisposisi', {
                page: page,
                limit: 10
            });

            if (response.success) {
                this.renderDisposisiTable(response.data);
                this.renderPagination(response.total, page);
            }
        } catch (error) {
            console.error('Load disposisi failed:', error);
            this.app.showToast('Gagal memuat data disposisi', 'error');
        }
    }

    renderDisposisiTable(data) {
        const tbody = document.getElementById('body-disposisi');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data disposisi</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(disposisi => `
            <tr>
                <td>
                    <span class="badge badge-warning">${disposisi.no_disposisi || '-'}</span>
                </td>
                <td>
                    <div class="user-cell">
                        <strong>${disposisi.surat_no_agenda || '-'}</strong>
                        <small>${this.app.truncateText(disposisi.surat_perihal, 30)}</small>
                    </div>
                </td>
                <td>${disposisi.dari_nama || '-'}</td>
                <td>${disposisi.kepada_nama || '-'}</td>
                <td>
                    <div class="instruksi-cell" title="${disposisi.instruksi || ''}">
                        ${this.app.truncateText(disposisi.instruksi, 40)}
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${disposisi.status || 'pending'}">
                        ${this.getStatusDisposisi(disposisi.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="viewDisposisiDetail(${disposisi.id})">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-success" onclick="updateStatusDisposisi(${disposisi.id})">
                            ✔️
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="trackDisposisi(${disposisi.id})">
                            📍
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination(total, currentPage) {
        const container = document.getElementById('pagination-disposisi');
        if (!container) return;

        const totalPages = Math.ceil(total / 10);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<div class="pagination-controls">';
        
        html += `
            <button class="btn btn-sm btn-page" 
                    onclick="window.disposisiModule.loadDisposisi(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}>
                « Prev
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            html += `
                <button class="btn btn-sm btn-page ${i === currentPage ? 'active' : ''}" 
                        onclick="window.disposisiModule.loadDisposisi(${i})">
                    ${i}
                </button>
            `;
        }

        html += `
            <button class="btn btn-sm btn-page" 
                    onclick="window.disposisiModule.loadDisposisi(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                Next »
            </button>
        `;

        html += '</div>';
        container.innerHTML = html;
    }

    getStatusDisposisi(status) {
        const statusMap = {
            'pending': 'Pending',
            'diterima': 'Diterima',
            'diproses': 'Diproses',
            'selesai': 'Selesai',
            'ditolak': 'Ditolak'
        };
        return statusMap[status] || status || 'Pending';
    }

    async viewDisposisiDetail(id) {
        try {
            const response = await this.app.apiRequest('getDisposisiById', { id });
            if (response.success && response.data) {
                const disposisi = response.data;
                const detailHtml = `
                    <div class="detail-disposisi">
                        <div class="detail-row">
                            <strong>No. Disposisi:</strong>
                            <span>${disposisi.no_disposisi}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Surat Masuk:</strong>
                            <span>${disposisi.surat_no_agenda} - ${disposisi.surat_perihal}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Dari:</strong>
                            <span>${disposisi.dari_nama} (${disposisi.dari_jabatan || ''})</span>
                        </div>
                        <div class="detail-row">
                            <strong>Kepada:</strong>
                            <span>${disposisi.kepada_nama} (${disposisi.kepada_jabatan || ''})</span>
                        </div>
                        <div class="detail-row">
                            <strong>Instruksi:</strong>
                            <p>${disposisi.instruksi}</p>
                        </div>
                        <div class="detail-row">
                            <strong>Sifat:</strong>
                            <span class="badge badge-${disposisi.sifat || 'biasa'}">${disposisi.sifat || 'Biasa'}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Status:</strong>
                            <span class="status-badge status-${disposisi.status}">${this.getStatusDisposisi(disposisi.status)}</span>
                        </div>
                        <div class="detail-row">
                            <strong>Tanggal:</strong>
                            <span>${this.app.formatDate(disposisi.tanggal_disposisi)}</span>
                        </div>
                        ${disposisi.batas_waktu ? `
                        <div class="detail-row">
                            <strong>Batas Waktu:</strong>
                            <span>${this.app.formatDate(disposisi.batas_waktu)}</span>
                        </div>
                        ` : ''}
                        ${disposisi.catatan ? `
                        <div class="detail-row">
                            <strong>Catatan:</strong>
                            <p>${disposisi.catatan}</p>
                        </div>
                        ` : ''}
                    </div>
                `;

                document.getElementById('detail-title').textContent = 'Detail Disposisi';
                document.getElementById('detail-body').innerHTML = detailHtml;
                document.getElementById('detail-modal').style.display = 'flex';
            }
        } catch (error) {
            console.error('View disposisi failed:', error);
            this.app.showToast('Gagal memuat detail disposisi', 'error');
        }
    }

    async updateStatusDisposisi(id) {
        const statusOptions = ['diterima', 'diproses', 'selesai', 'ditolak'];
        const currentStatus = await this.getCurrentStatus(id);
        
        const statusHtml = `
            <div class="status-update-form">
                <h4>Update Status Disposisi</h4>
                <div class="form-group">
                    <label>Status Baru</label>
                    <select id="new-status" class="form-control">
                        ${statusOptions.map(s => `
                            <option value="${s}" ${s === currentStatus ? 'selected' : ''}>
                                ${this.getStatusDisposisi(s)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Catatan</label>
                    <textarea id="status-catatan" class="form-control" rows="3" 
                              placeholder="Tambahkan catatan..."></textarea>
                </div>
            </div>
        `;

        document.getElementById('modal-title').textContent = 'Update Status Disposisi';
        document.getElementById('modal-body').innerHTML = statusHtml;
        document.getElementById('modal-save-btn').style.display = 'inline-block';
        document.getElementById('modal-save-btn').onclick = async () => {
            const newStatus = document.getElementById('new-status').value;
            const catatan = document.getElementById('status-catatan').value;

            try {
                const response = await this.app.apiRequest('updateDisposisiStatus', {
                    id: id,
                    status: newStatus,
                    catatan: catatan
                });

                if (response.success) {
                    this.app.showToast('Status disposisi berhasil diupdate', 'success');
                    this.app.closeCRUDModal();
                    await this.loadDisposisi();
                }
            } catch (error) {
                console.error('Update status failed:', error);
                this.app.showToast('Gagal mengupdate status', 'error');
            }
        };
        
        document.getElementById('crud-modal').style.display = 'flex';
    }

    async getCurrentStatus(id) {
        try {
            const response = await this.app.apiRequest('getDisposisiById', { id });
            return response.data?.status || 'pending';
        } catch {
            return 'pending';
        }
    }

    async trackDisposisi(id) {
        try {
            const response = await this.app.apiRequest('getDisposisiTracking', { id });
            if (response.success && response.data) {
                const tracking = response.data;
                const trackingHtml = `
                    <div class="tracking-timeline">
                        <h4>Tracking Disposisi #${tracking.no_disposisi}</h4>
                        <div class="timeline">
                            ${tracking.history.map((item, index) => `
                                <div class="timeline-item">
                                    <div class="timeline-marker ${index === 0 ? 'active' : ''}"></div>
                                    <div class="timeline-content">
                                        <strong>${this.getStatusDisposisi(item.status)}</strong>
                                        <p>${item.catatan || ''}</p>
                                        <small>Oleh: ${item.user_nama} - ${this.app.formatDate(item.tanggal)}</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

                document.getElementById('detail-title').textContent = 'Tracking Disposisi';
                document.getElementById('detail-body').innerHTML = trackingHtml;
                document.getElementById('detail-modal').style.display = 'flex';
            }
        } catch (error) {
            console.error('Tracking failed:', error);
            this.app.showToast('Gagal memuat tracking disposisi', 'error');
        }
    }
}

// Initialize
window.disposisiModule = new DisposisiModule(window.enterpriseApp);
