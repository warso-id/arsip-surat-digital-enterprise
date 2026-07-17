// surat.js - Enterprise Surat Management Module
class SuratModule {
    constructor(app) {
        this.app = app;
        this.currentPage = {
            masuk: 1,
            keluar: 1
        };
        this.pageSize = 10;
    }

    async loadSuratMasuk(page = 1) {
        try {
            this.currentPage.masuk = page;
            
            const filters = this.getFilters('masuk');
            const search = document.getElementById('search-surat-masuk')?.value || '';
            
            const response = await this.app.apiRequest('getSuratMasuk', {
                page: page,
                limit: this.pageSize,
                search: search,
                filters: filters
            });

            if (response.success) {
                this.renderSuratMasukTable(response.data);
                this.renderPagination('masuk', response.total, page);
                this.app.cacheData('surat-masuk', response.data);
            }
        } catch (error) {
            console.error('Load surat masuk failed:', error);
            this.app.showToast('Gagal memuat data surat masuk', 'error');
        }
    }

    async loadSuratKeluar(page = 1) {
        try {
            this.currentPage.keluar = page;
            
            const filters = this.getFilters('keluar');
            const search = document.getElementById('search-surat-keluar')?.value || '';
            
            const response = await this.app.apiRequest('getSuratKeluar', {
                page: page,
                limit: this.pageSize,
                search: search,
                filters: filters
            });

            if (response.success) {
                this.renderSuratKeluarTable(response.data);
                this.renderPagination('keluar', response.total, page);
                this.app.cacheData('surat-keluar', response.data);
            }
        } catch (error) {
            console.error('Load surat keluar failed:', error);
            this.app.showToast('Gagal memuat data surat keluar', 'error');
        }
    }

    renderSuratMasukTable(data) {
        const tbody = document.getElementById('body-surat-masuk');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center">Tidak ada data surat masuk</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map((surat, index) => `
            <tr class="table-row" data-id="${surat.id}">
                <td>
                    <input type="checkbox" class="select-item" 
                           onchange="window.suratModule.toggleItemSelection('masuk', ${surat.id})">
                </td>
                <td>
                    <span class="badge badge-primary">${surat.no_agenda || '-'}</span>
                </td>
                <td>${this.formatDate(surat.tanggal_terima)}</td>
                <td>
                    <div class="user-cell">
                        <strong>${surat.pengirim || '-'}</strong>
                        <small>${surat.instansi_nama || ''}</small>
                    </div>
                </td>
                <td>
                    <div class="perihal-cell" title="${surat.perihal || ''}">
                        ${this.truncateText(surat.perihal, 50)}
                    </div>
                </td>
                <td>
                    <span class="badge badge-info">${surat.kategori_nama || 'Umum'}</span>
                </td>
                <td>
                    <span class="status-badge status-${surat.status || 'baru'}">
                        ${this.getStatusLabel(surat.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="viewRecord('surat-masuk', ${surat.id})" 
                                title="Lihat Detail">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="showCRUDForm('surat-masuk', 'edit', ${JSON.stringify(surat).replace(/"/g, '&quot;')})" 
                                title="Edit">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteRecord('surat-masuk', ${surat.id})" 
                                title="Hapus">
                            🗑️
                        </button>
                        <button class="btn btn-sm btn-success" onclick="window.suratModule.createDisposisi(${surat.id})" 
                                title="Buat Disposisi">
                            📋
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add click event for row detail
        tbody.querySelectorAll('.table-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('input[type="checkbox"]')) {
                    const id = row.dataset.id;
                    viewRecord('surat-masuk', id);
                }
            });
        });
    }

    renderSuratKeluarTable(data) {
        const tbody = document.getElementById('body-surat-keluar');
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">Tidak ada data surat keluar</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(surat => `
            <tr class="table-row" data-id="${surat.id}">
                <td>
                    <input type="checkbox" class="select-item" 
                           onchange="window.suratModule.toggleItemSelection('keluar', ${surat.id})">
                </td>
                <td>
                    <span class="badge badge-success">${surat.no_surat || '-'}</span>
                </td>
                <td>${this.formatDate(surat.tanggal_surat)}</td>
                <td>
                    <div class="user-cell">
                        <strong>${surat.tujuan || '-'}</strong>
                        <small>${surat.instansi_nama || ''}</small>
                    </div>
                </td>
                <td>
                    <div class="perihal-cell" title="${surat.perihal || ''}">
                        ${this.truncateText(surat.perihal, 50)}
                    </div>
                </td>
                <td>
                    <span class="badge badge-info">${surat.kategori_nama || 'Umum'}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="viewRecord('surat-keluar', ${surat.id})">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="showCRUDForm('surat-keluar', 'edit', ${JSON.stringify(surat).replace(/"/g, '&quot;')})">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteRecord('surat-keluar', ${surat.id})">
                            🗑️
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="window.suratModule.printSurat(${surat.id})">
                            🖨️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination(type, total, currentPage) {
        const container = document.getElementById(`pagination-surat-${type}`);
        if (!container) return;

        const totalPages = Math.ceil(total / this.pageSize);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<div class="pagination-controls">';
        
        // Previous button
        html += `
            <button class="btn btn-sm btn-page" 
                    onclick="window.suratModule.loadSurat${type === 'masuk' ? 'Masuk' : 'Keluar'}(${currentPage - 1})"
                    ${currentPage === 1 ? 'disabled' : ''}>
                « Prev
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                html += `
                    <button class="btn btn-sm btn-page ${i === currentPage ? 'active' : ''}" 
                            onclick="window.suratModule.loadSurat${type === 'masuk' ? 'Masuk' : 'Keluar'}(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                html += '<span class="page-ellipsis">...</span>';
            }
        }

        // Next button
        html += `
            <button class="btn btn-sm btn-page" 
                    onclick="window.suratModule.loadSurat${type === 'masuk' ? 'Masuk' : 'Keluar'}(${currentPage + 1})"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                Next »
            </button>
        `;

        html += '</div>';
        html += `<div class="pagination-info">Halaman ${currentPage} dari ${totalPages} (Total: ${total} data)</div>`;
        
        container.innerHTML = html;
    }

    getFilters(type) {
        const filters = {};
        const prefix = `filter-${type}`;
        
        const kategoriEl = document.getElementById(`filter-kategori-${type}`);
        if (kategoriEl?.value) filters.kategori_id = kategoriEl.value;
        
        const statusEl = document.getElementById(`filter-status-${type}`);
        if (statusEl?.value) filters.status = statusEl.value;
        
        const dariEl = document.getElementById(`filter-tanggal-dari-${type}`);
        if (dariEl?.value) filters.tanggal_dari = dariEl.value;
        
        const sampaiEl = document.getElementById(`filter-tanggal-sampai-${type}`);
        if (sampaiEl?.value) filters.tanggal_sampai = sampaiEl.value;

        return filters;
    }

    toggleItemSelection(type, id) {
        if (!this.selectedItems) {
            this.selectedItems = { masuk: new Set(), keluar: new Set() };
        }
        
        const set = this.selectedItems[type];
        if (set.has(id)) {
            set.delete(id);
        } else {
            set.add(id);
        }

        this.updateBulkActions(type);
    }

    updateBulkActions(type) {
        const bulkDiv = document.getElementById(`bulk-actions-${type}`);
        const countSpan = document.getElementById(`selected-count-${type}`);
        
        if (!bulkDiv || !countSpan) return;

        const count = this.selectedItems?.[type]?.size || 0;
        
        if (count > 0) {
            bulkDiv.style.display = 'flex';
            countSpan.textContent = `${count} item dipilih`;
        } else {
            bulkDiv.style.display = 'none';
        }
    }

    async bulkDelete(type) {
        const selected = this.selectedItems?.[type];
        if (!selected || selected.size === 0) return;

        if (!confirm(`Hapus ${selected.size} surat ${type} yang dipilih?`)) return;

        try {
            const response = await this.app.apiRequest('bulkDelete', {
                table: type === 'masuk' ? 'surat_masuk' : 'surat_keluar',
                ids: Array.from(selected)
            });

            if (response.success) {
                this.app.showToast(`${selected.size} data berhasil dihapus`, 'success');
                this.selectedItems[type].clear();
                this.updateBulkActions(type);
                
                if (type === 'masuk') {
                    await this.loadSuratMasuk();
                } else {
                    await this.loadSuratKeluar();
                }
            }
        } catch (error) {
            console.error('Bulk delete failed:', error);
            this.app.showToast('Gagal menghapus data', 'error');
        }
    }

    async createDisposisi(suratMasukId) {
        // Load surat masuk detail
        try {
            const response = await this.app.apiRequest('getSuratMasukById', { id: suratMasukId });
            if (response.success && response.data) {
                const surat = response.data;
                
                // Show disposisi form
                const formHtml = `
                    <form id="disposisi-form" onsubmit="event.preventDefault(); window.suratModule.saveDisposisi(${suratMasukId})">
                        <div class="form-group">
                            <label>Surat Masuk</label>
                            <input type="text" class="form-control" value="${surat.no_agenda} - ${surat.perihal}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Tujuan Disposisi</label>
                            <select name="tujuan_user_id" class="form-control" required>
                                <option value="">Pilih Pengguna</option>
                                ${this.generateUserOptions()}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Instruksi</label>
                            <textarea name="instruksi" class="form-control" rows="3" required 
                                      placeholder="Tulis instruksi disposisi..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>Sifat</label>
                            <select name="sifat" class="form-control">
                                <option value="biasa">Biasa</option>
                                <option value="segera">Segera</option>
                                <option value="penting">Penting</option>
                                <option value="rahasia">Rahasia</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Batas Waktu</label>
                            <input type="date" name="batas_waktu" class="form-control">
                        </div>
                    </form>
                `;

                document.getElementById('modal-title').textContent = 'Buat Disposisi';
                document.getElementById('modal-body').innerHTML = formHtml;
                document.getElementById('modal-save-btn').style.display = 'inline-block';
                document.getElementById('modal-save-btn').onclick = () => this.saveDisposisi(suratMasukId);
                document.getElementById('crud-modal').style.display = 'flex';
            }
        } catch (error) {
            console.error('Create disposisi failed:', error);
            this.app.showToast('Gagal membuat disposisi', 'error');
        }
    }

    async saveDisposisi(suratMasukId) {
        const form = document.getElementById('disposisi-form');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.surat_masuk_id = suratMasukId;
        data.dari_user_id = this.app.state.currentUser?.id;

        try {
            const response = await this.app.apiRequest('createDisposisi', data);
            if (response.success) {
                this.app.showToast('Disposisi berhasil dibuat', 'success');
                this.app.closeCRUDModal();
                await this.loadSuratMasuk();
            }
        } catch (error) {
            console.error('Save disposisi failed:', error);
            this.app.showToast('Gagal menyimpan disposisi', 'error');
        }
    }

    async printSurat(id) {
        try {
            const response = await this.app.apiRequest('getSuratKeluarById', { id });
            if (response.success && response.data) {
                const surat = response.data;
                const printWindow = window.open('', '_blank');
                printWindow.document.write(this.generatePrintTemplate(surat));
                printWindow.document.close();
                printWindow.print();
            }
        } catch (error) {
            console.error('Print failed:', error);
            this.app.showToast('Gagal mencetak surat', 'error');
        }
    }

    generatePrintTemplate(surat) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cetak Surat - ${surat.no_surat}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 2cm; }
                    .header { text-align: center; margin-bottom: 2cm; }
                    .content { margin: 2cm 0; }
                    .footer { margin-top: 2cm; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${surat.instansi_nama || 'INSTANSI'}</h2>
                    <p>${surat.instansi_alamat || ''}</p>
                    <hr>
                </div>
                <div class="content">
                    <p>Nomor: ${surat.no_surat}</p>
                    <p>Perihal: ${surat.perihal}</p>
                    <p>Kepada Yth:</p>
                    <p>${surat.tujuan}</p>
                    <p>di tempat</p>
                    <br>
                    <p>${surat.isi_surat || ''}</p>
                </div>
                <div class="footer">
                    <p>${surat.tempat || ''}, ${this.formatDate(surat.tanggal_surat)}</p>
                    <br><br>
                    <p>(${surat.penandatangan || ''})</p>
                </div>
            </body>
            </html>
        `;
    }

    generateUserOptions() {
        const users = JSON.parse(localStorage.getItem('pengguna_list') || '[]');
        return users.map(u => 
            `<option value="${u.id}">${u.nama} - ${u.role_nama || ''}</option>`
        ).join('');
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    truncateText(text, maxLength) {
        if (!text) return '-';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    getStatusLabel(status) {
        const labels = {
            'baru': 'Baru',
            'diproses': 'Diproses',
            'selesai': 'Selesai',
            'draft': 'Draft',
            'terkirim': 'Terkirim'
        };
        return labels[status] || status || 'Baru';
    }

    async exportData(type) {
        try {
            const response = await this.app.apiRequest('exportData', {
                table: type === 'masuk' ? 'surat_masuk' : 'surat_keluar',
                format: 'excel'
            });

            if (response.success && response.data) {
                // Download file
                const link = document.createElement('a');
                link.href = response.data.url;
                link.download = `export-${type}-${Date.now()}.xlsx`;
                link.click();
                this.app.showToast('Export berhasil', 'success');
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.app.showToast('Gagal export data', 'error');
        }
    }

    async importData(type) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const response = await this.app.apiRequest('importData', {
                        table: type === 'masuk' ? 'surat_masuk' : 'surat_keluar',
                        data: event.target.result,
                        filename: file.name
                    });

                    if (response.success) {
                        this.app.showToast(`Import berhasil: ${response.imported} data`, 'success');
                        if (type === 'masuk') {
                            await this.loadSuratMasuk();
                        } else {
                            await this.loadSuratKeluar();
                        }
                    }
                } catch (error) {
                    console.error('Import failed:', error);
                    this.app.showToast('Gagal import data', 'error');
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
}

// Initialize
window.suratModule = new SuratModule(window.enterpriseApp);
