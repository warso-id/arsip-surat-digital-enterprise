/* ============================================
   ENTERPRISE LAPORAN MODULE
   ============================================ */
(function() {
    'use strict';

    class LaporanModule {
        constructor() {
            this.filters = {
                startDate: '',
                endDate: '',
                type: 'semua'
            };
        }

        async init() {
            const container = document.getElementById('laporan-content');
            if (!container) return;

            container.innerHTML = this.getTemplate();
            this.setupEvents();
            
            // Set default date range (current month)
            const now = new Date();
            document.getElementById('start-date').value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            document.getElementById('end-date').value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            
            await this.generateReport();
        }

        getTemplate() {
            return `
                <div class="report-filters">
                    <div class="filter-row">
                        <div class="form-group">
                            <label>Periode Mulai</label>
                            <input type="date" id="start-date" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Periode Selesai</label>
                            <input type="date" id="end-date" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Jenis Laporan</label>
                            <select id="report-type" class="form-control">
                                <option value="semua">Semua Surat</option>
                                <option value="masuk">Surat Masuk</option>
                                <option value="keluar">Surat Keluar</option>
                                <option value="disposisi">Disposisi</option>
                            </select>
                        </div>
                        <div class="form-group" style="align-self: flex-end;">
                            <button class="btn btn-primary" id="btn-generate">Generate Laporan</button>
                        </div>
                    </div>
                </div>

                <div class="report-actions">
                    <button class="btn btn-secondary" id="btn-print-report">
                        🖨️ Cetak Laporan
                    </button>
                    <button class="btn btn-secondary" id="btn-export-pdf">
                        📄 Export PDF
                    </button>
                    <button class="btn btn-secondary" id="btn-export-excel">
                        📊 Export Excel
                    </button>
                </div>

                <div id="report-content">
                    <div class="loading-placeholder">Silakan generate laporan terlebih dahulu</div>
                </div>
            `;
        }

        setupEvents() {
            document.getElementById('btn-generate')?.addEventListener('click', async () => {
                this.filters.startDate = document.getElementById('start-date').value;
                this.filters.endDate = document.getElementById('end-date').value;
                this.filters.type = document.getElementById('report-type').value;
                await this.generateReport();
            });

            document.getElementById('btn-print-report')?.addEventListener('click', () => {
                window.print();
            });

            document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
                this.exportToPDF();
            });

            document.getElementById('btn-export-excel')?.addEventListener('click', () => {
                this.exportToExcel();
            });
        }

        async generateReport() {
            const container = document.getElementById('report-content');
            if (!container) return;

            try {
                Spinner.show('Membuat laporan...');

                let suratMasuk = [];
                let suratKeluar = [];
                let disposisi = [];

                if (this.filters.type === 'semua' || this.filters.type === 'masuk') {
                    suratMasuk = (await DB.getAll('surat_masuk')).filter(s => 
                        this.isInDateRange(s.tanggal_surat)
                    );
                }

                if (this.filters.type === 'semua' || this.filters.type === 'keluar') {
                    suratKeluar = (await DB.getAll('surat_keluar')).filter(s => 
                        this.isInDateRange(s.tanggal_surat)
                    );
                }

                if (this.filters.type === 'semua' || this.filters.type === 'disposisi') {
                    disposisi = (await DB.getAll('disposisi')).filter(d => 
                        this.isInDateRange(d.tanggal_disposisi)
                    );
                }

                container.innerHTML = this.renderReport(suratMasuk, suratKeluar, disposisi);

            } catch (error) {
                Logger.error('Failed to generate report:', error);
                container.innerHTML = '<div class="error-state">Gagal membuat laporan</div>';
            } finally {
                Spinner.hide();
            }
        }

        renderReport(suratMasuk, suratKeluar, disposisi) {
            return `
                <div class="report-header">
                    <h3>LAPORAN ARSIP SURAT DIGITAL</h3>
                    <p>Periode: ${this.formatDate(this.filters.startDate)} - ${this.formatDate(this.filters.endDate)}</p>
                </div>

                <div class="report-summary">
                    <div class="summary-card">
                        <h4>Total Surat Masuk</h4>
                        <span class="summary-value">${suratMasuk.length}</span>
                    </div>
                    <div class="summary-card">
                        <h4>Total Surat Keluar</h4>
                        <span class="summary-value">${suratKeluar.length}</span>
                    </div>
                    <div class="summary-card">
                        <h4>Total Disposisi</h4>
                        <span class="summary-value">${disposisi.length}</span>
                    </div>
                </div>

                ${suratMasuk.length > 0 ? `
                    <div class="report-section">
                        <h4>Surat Masuk</h4>
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Nomor Surat</th>
                                    <th>Tanggal</th>
                                    <th>Perihal</th>
                                    <th>Pengirim</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${suratMasuk.map((s, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${s.nomor_surat || '-'}</td>
                                        <td>${this.formatDate(s.tanggal_surat)}</td>
                                        <td>${s.perihal || '-'}</td>
                                        <td>${s.pengirim || '-'}</td>
                                        <td><span class="badge badge-${s.status}">${s.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}

                ${suratKeluar.length > 0 ? `
                    <div class="report-section">
                        <h4>Surat Keluar</h4>
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Nomor Surat</th>
                                    <th>Tanggal</th>
                                    <th>Perihal</th>
                                    <th>Penerima</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${suratKeluar.map((s, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${s.nomor_surat || '-'}</td>
                                        <td>${this.formatDate(s.tanggal_surat)}</td>
                                        <td>${s.perihal || '-'}</td>
                                        <td>${s.penerima || '-'}</td>
                                        <td><span class="badge badge-${s.status}">${s.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}

                ${disposisi.length > 0 ? `
                    <div class="report-section">
                        <h4>Disposisi</h4>
                        <table class="report-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Surat Terkait</th>
                                    <th>Tanggal</th>
                                    <th>Tujuan</th>
                                    <th>Instruksi</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${disposisi.map((d, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${d.nomor_surat || '-'}</td>
                                        <td>${this.formatDate(d.tanggal_disposisi)}</td>
                                        <td>${d.tujuan || '-'}</td>
                                        <td>${d.instruksi || '-'}</td>
                                        <td><span class="badge badge-${d.status}">${d.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}

                <div class="report-footer">
                    <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
                    <p>Dicetak oleh: ${Auth.currentUser?.nama || 'Administrator'}</p>
                </div>
            `;
        }

        isInDateRange(dateString) {
            if (!dateString) return false;
            if (!this.filters.startDate && !this.filters.endDate) return true;

            const date = new Date(dateString);
            const start = this.filters.startDate ? new Date(this.filters.startDate) : null;
            const end = this.filters.endDate ? new Date(this.filters.endDate) : null;

            if (start && date < start) return false;
            if (end && date > end) return false;
            return true;
        }

        async exportToPDF() {
            showToast('Fitur export PDF akan segera hadir', 'info');
            // Implement PDF export using jsPDF or browser print
            window.print();
        }

        async exportToExcel() {
            showToast('Fitur export Excel akan segera hadir', 'info');
            
            // Simple CSV export
            const data = [];
            data.push(['No', 'Nomor Surat', 'Tanggal', 'Perihal', 'Status']);
            
            // Add actual data here
            const csv = data.map(row => row.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `laporan-${Date.now()}.csv`;
            a.click();
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

    window.Laporan = new LaporanModule();
    Logger.info('Laporan module loaded');
})();
