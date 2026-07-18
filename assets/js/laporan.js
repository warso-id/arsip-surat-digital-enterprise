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

        // ============================================
        // INITIALIZATION
        // ============================================
        async init() {
            const container = document.getElementById('laporan-content');
            if (!container) return;

            // Render template
            container.innerHTML = this.getTemplate();
            
            // Setup event listeners
            this.setupEvents();
            
            // Set default date range (current month)
            this.setDefaultDateRange();
            
            // Generate initial report
            await this.generateReport();
        }

        setDefaultDateRange() {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            const startDateEl = document.getElementById('start-date');
            const endDateEl = document.getElementById('end-date');
            
            if (startDateEl) {
                startDateEl.value = this.formatDateISO(firstDay);
            }
            if (endDateEl) {
                endDateEl.value = this.formatDateISO(lastDay);
            }
            
            this.filters.startDate = this.formatDateISO(firstDay);
            this.filters.endDate = this.formatDateISO(lastDay);
        }

        // ============================================
        // TEMPLATE
        // ============================================
        getTemplate() {
            return `
                <!-- Filter Section -->
                <div class="report-filters">
                    <div class="filter-row">
                        <div class="form-group">
                            <label for="start-date">Periode Mulai</label>
                            <input type="date" id="start-date" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="end-date">Periode Selesai</label>
                            <input type="date" id="end-date" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="report-type">Jenis Laporan</label>
                            <select id="report-type" class="form-control">
                                <option value="semua">Semua Surat</option>
                                <option value="masuk">Surat Masuk</option>
                                <option value="keluar">Surat Keluar</option>
                                <option value="disposisi">Disposisi</option>
                            </select>
                        </div>
                        <div class="form-group" style="align-self: flex-end;">
                            <button class="btn btn-primary" id="btn-generate">
                                <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right:6px">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
                                </svg>
                                Generate Laporan
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="report-actions">
                    <button class="btn btn-secondary" id="btn-print-report" title="Cetak laporan">
                        🖨️ Cetak
                    </button>
                    <button class="btn btn-secondary" id="btn-export-pdf" title="Export ke PDF">
                        📄 Export PDF
                    </button>
                    <button class="btn btn-secondary" id="btn-export-excel" title="Export ke Excel">
                        📊 Export Excel
                    </button>
                    <button class="btn btn-secondary" id="btn-refresh-report" title="Refresh laporan">
                        🔄 Refresh
                    </button>
                </div>

                <!-- Report Content -->
                <div id="report-content">
                    <div class="loading-placeholder">
                        <p>📋 Silakan generate laporan terlebih dahulu</p>
                        <small>Pilih periode dan jenis laporan, lalu klik Generate</small>
                    </div>
                </div>
            `;
        }

        // ============================================
        // EVENT LISTENERS
        // ============================================
        setupEvents() {
            // Generate button
            document.getElementById('btn-generate')?.addEventListener('click', async () => {
                this.filters.startDate = document.getElementById('start-date').value;
                this.filters.endDate = document.getElementById('end-date').value;
                this.filters.type = document.getElementById('report-type').value;
                await this.generateReport();
            });

            // Print button
            document.getElementById('btn-print-report')?.addEventListener('click', () => {
                this.printReport();
            });

            // Export PDF button
            document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
                this.exportToPDF();
            });

            // Export Excel button
            document.getElementById('btn-export-excel')?.addEventListener('click', () => {
                this.exportToExcel();
            });

            // Refresh button
            document.getElementById('btn-refresh-report')?.addEventListener('click', async () => {
                await this.generateReport();
                showToast('Laporan diperbarui', 'success');
            });

            // Keyboard shortcut: Ctrl+Enter to generate
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    const reportContent = document.getElementById('report-content');
                    if (reportContent && reportContent.offsetParent !== null) {
                        e.preventDefault();
                        document.getElementById('btn-generate')?.click();
                    }
                }
            });
        }

        // ============================================
        // REPORT GENERATION
        // ============================================
        async generateReport() {
            const container = document.getElementById('report-content');
            if (!container) return;

            try {
                Spinner.show('Membuat laporan...');

                let suratMasuk = [];
                let suratKeluar = [];
                let disposisi = [];

                // Fetch data based on filter type
                if (this.filters.type === 'semua' || this.filters.type === 'masuk') {
                    const allMasuk = await DB.getAll('surat_masuk');
                    suratMasuk = allMasuk.filter(s => this.isInDateRange(s.tanggal_surat));
                }

                if (this.filters.type === 'semua' || this.filters.type === 'keluar') {
                    const allKeluar = await DB.getAll('surat_keluar');
                    suratKeluar = allKeluar.filter(s => this.isInDateRange(s.tanggal_surat));
                }

                if (this.filters.type === 'semua' || this.filters.type === 'disposisi') {
                    const allDisposisi = await DB.getAll('disposisi');
                    disposisi = allDisposisi.filter(d => this.isInDateRange(d.tanggal_disposisi));
                }

                // Render report
                container.innerHTML = this.renderReport(suratMasuk, suratKeluar, disposisi);

                // Scroll to report
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });

                Logger.info('Report generated successfully');

            } catch (error) {
                Logger.error('Failed to generate report:', error);
                container.innerHTML = `
                    <div class="error-state">
                        <p>❌ Gagal membuat laporan</p>
                        <small>${error.message}</small>
                        <br>
                        <button class="btn btn-secondary" onclick="Laporan.generateReport()">
                            Coba Lagi
                        </button>
                    </div>
                `;
            } finally {
                Spinner.hide();
            }
        }

        // ============================================
        // REPORT RENDERER
        // ============================================
        renderReport(suratMasuk, suratKeluar, disposisi) {
            const totalAll = suratMasuk.length + suratKeluar.length + disposisi.length;
            
            let html = '';

            // Report Header
            html += `
                <div class="report-header">
                    <h3>LAPORAN ARSIP SURAT DIGITAL</h3>
                    <p>Periode: ${this.formatDate(this.filters.startDate)} - ${this.formatDate(this.filters.endDate)}</p>
                    <p>Jenis: ${this.getTypeLabel(this.filters.type)}</p>
                </div>
            `;

            // Summary Cards
            html += `
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
                    <div class="summary-card">
                        <h4>Total Keseluruhan</h4>
                        <span class="summary-value">${totalAll}</span>
                    </div>
                </div>
            `;

            // Jika tidak ada data
            if (totalAll === 0) {
                html += `
                    <div class="empty-state">
                        <p>📭 Tidak ada data untuk periode yang dipilih</p>
                        <small>Silakan ubah filter periode atau jenis laporan</small>
                    </div>
                `;
                html += this.renderReportFooter();
                return html;
            }

            // Surat Masuk Section
            if (suratMasuk.length > 0) {
                html += `
                    <div class="report-section">
                        <h4>📨 Surat Masuk (${suratMasuk.length} data)</h4>
                        <div class="table-container">
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th width="5%">No</th>
                                        <th width="20%">Nomor Surat</th>
                                        <th width="12%">Tanggal</th>
                                        <th width="30%">Perihal</th>
                                        <th width="18%">Pengirim</th>
                                        <th width="15%">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${suratMasuk.map((s, i) => `
                                        <tr>
                                            <td class="text-center">${i + 1}</td>
                                            <td><strong>${this.escapeHtml(s.nomor_surat) || '-'}</strong></td>
                                            <td>${this.formatDate(s.tanggal_surat)}</td>
                                            <td>${this.escapeHtml(s.perihal) || '-'}</td>
                                            <td>${this.escapeHtml(s.pengirim) || '-'}</td>
                                            <td><span class="badge badge-${s.status || 'baru'}">${this.formatStatus(s.status)}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            // Surat Keluar Section
            if (suratKeluar.length > 0) {
                html += `
                    <div class="report-section">
                        <h4>📤 Surat Keluar (${suratKeluar.length} data)</h4>
                        <div class="table-container">
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th width="5%">No</th>
                                        <th width="20%">Nomor Surat</th>
                                        <th width="12%">Tanggal</th>
                                        <th width="30%">Perihal</th>
                                        <th width="18%">Penerima</th>
                                        <th width="15%">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${suratKeluar.map((s, i) => `
                                        <tr>
                                            <td class="text-center">${i + 1}</td>
                                            <td><strong>${this.escapeHtml(s.nomor_surat) || '-'}</strong></td>
                                            <td>${this.formatDate(s.tanggal_surat)}</td>
                                            <td>${this.escapeHtml(s.perihal) || '-'}</td>
                                            <td>${this.escapeHtml(s.penerima) || '-'}</td>
                                            <td><span class="badge badge-${s.status || 'baru'}">${this.formatStatus(s.status)}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            // Disposisi Section
            if (disposisi.length > 0) {
                html += `
                    <div class="report-section">
                        <h4>📋 Disposisi (${disposisi.length} data)</h4>
                        <div class="table-container">
                            <table class="report-table">
                                <thead>
                                    <tr>
                                        <th width="5%">No</th>
                                        <th width="20%">Surat Terkait</th>
                                        <th width="12%">Tanggal</th>
                                        <th width="18%">Tujuan</th>
                                        <th width="30%">Instruksi</th>
                                        <th width="15%">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${disposisi.map((d, i) => `
                                        <tr>
                                            <td class="text-center">${i + 1}</td>
                                            <td><strong>${this.escapeHtml(d.nomor_surat) || '-'}</strong></td>
                                            <td>${this.formatDate(d.tanggal_disposisi)}</td>
                                            <td>${this.escapeHtml(d.tujuan) || '-'}</td>
                                            <td>${this.escapeHtml(d.instruksi) || '-'}</td>
                                            <td><span class="badge badge-${d.status || 'pending'}">${this.formatStatus(d.status)}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }

            // Report Footer
            html += this.renderReportFooter();

            return html;
        }

        renderReportFooter() {
            return `
                <div class="report-footer">
                    <div class="footer-grid">
                        <div class="footer-item">
                            <p><strong>Dicetak pada:</strong></p>
                            <p>${new Date().toLocaleString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                        </div>
                        <div class="footer-item">
                            <p><strong>Dicetak oleh:</strong></p>
                            <p>${Auth.currentUser?.nama || 'Administrator'}</p>
                        </div>
                        <div class="footer-item">
                            <p><strong>Versi Aplikasi:</strong></p>
                            <p>${APP_CONFIG.APP_VERSION || '2026.1.0'}</p>
                        </div>
                    </div>
                    <div class="footer-disclaimer">
                        <small>Dokumen ini digenerate secara otomatis oleh Sistem Arsip Surat Digital Enterprise</small>
                    </div>
                </div>
            `;
        }

        // ============================================
        // EXPORT FUNCTIONS
        // ============================================
        printReport() {
            showToast('Membuka dialog cetak...', 'info');
            
            // Add print class to body
            document.body.classList.add('print-preview-mode');
            
            // Trigger print
            setTimeout(() => {
                window.print();
                document.body.classList.remove('print-preview-mode');
            }, 300);
        }

        async exportToPDF() {
            try {
                Spinner.show('Mengexport PDF...');

                // Get report content
                const reportContent = document.getElementById('report-content');
                if (!reportContent) {
                    throw new Error('Konten laporan tidak ditemukan');
                }

                // Create print window
                const printWindow = window.open('', '_blank', 'width=800,height=600');
                if (!printWindow) {
                    throw new Error('Popup diblokir. Izinkan popup untuk export PDF.');
                }

                // Get styles
                const styles = this.getAllStyles();

                // Write to print window
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html lang="id">
                    <head>
                        <meta charset="UTF-8">
                        <title>Laporan Arsip Surat Digital</title>
                        ${styles}
                        <style>
                            body {
                                padding: 20px;
                                font-family: Arial, sans-serif;
                                color: #000;
                                background: #fff;
                            }
                            .report-header {
                                text-align: center;
                                margin-bottom: 20px;
                                padding-bottom: 10px;
                                border-bottom: 2px solid #000;
                            }
                            .report-header h3 {
                                font-size: 18px;
                                margin: 0 0 5px;
                            }
                            .report-header p {
                                font-size: 12px;
                                margin: 2px 0;
                                color: #666;
                            }
                            .report-summary {
                                display: flex;
                                gap: 10px;
                                margin-bottom: 20px;
                            }
                            .summary-card {
                                flex: 1;
                                text-align: center;
                                padding: 10px;
                                border: 1px solid #ddd;
                                border-radius: 4px;
                            }
                            .summary-card h4 {
                                font-size: 11px;
                                margin: 0 0 5px;
                                color: #666;
                            }
                            .summary-value {
                                font-size: 24px;
                                font-weight: bold;
                                color: #1a73e8;
                            }
                            .report-section {
                                margin-bottom: 20px;
                            }
                            .report-section h4 {
                                font-size: 14px;
                                margin: 0 0 10px;
                                padding-bottom: 5px;
                                border-bottom: 1px solid #eee;
                            }
                            .report-table {
                                width: 100%;
                                border-collapse: collapse;
                                font-size: 11px;
                            }
                            .report-table th {
                                background: #f0f0f0;
                                padding: 8px;
                                text-align: left;
                                border: 1px solid #ddd;
                                font-weight: bold;
                            }
                            .report-table td {
                                padding: 6px 8px;
                                border: 1px solid #ddd;
                            }
                            .report-table tr:nth-child(even) {
                                background: #fafafa;
                            }
                            .badge {
                                display: inline-block;
                                padding: 2px 8px;
                                border-radius: 3px;
                                font-size: 10px;
                                font-weight: bold;
                            }
                            .badge-baru { background: #e8f0fe; color: #1a73e8; }
                            .badge-diproses { background: #fef7e0; color: #b8860b; }
                            .badge-selesai { background: #e6f4ea; color: #34a853; }
                            .badge-ditolak { background: #fce8e6; color: #ea4335; }
                            .badge-pending { background: #fef7e0; color: #b8860b; }
                            .report-footer {
                                margin-top: 30px;
                                padding-top: 10px;
                                border-top: 1px solid #eee;
                                font-size: 10px;
                                color: #999;
                            }
                            .footer-grid {
                                display: flex;
                                gap: 20px;
                                margin-bottom: 10px;
                            }
                            .footer-item {
                                flex: 1;
                            }
                            @page {
                                margin: 1.5cm;
                                size: A4;
                            }
                            @media print {
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        ${reportContent.innerHTML}
                    </body>
                    </html>
                `);

                printWindow.document.close();

                // Wait for content to load then print
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                    showToast('PDF berhasil diexport', 'success');
                }, 500);

            } catch (error) {
                Logger.error('Export PDF failed:', error);
                showToast('Gagal export PDF: ' + error.message, 'error');
                
                // Fallback to browser print
                window.print();
            } finally {
                Spinner.hide();
            }
        }

        async exportToExcel() {
            try {
                Spinner.show('Mengexport Excel...');

                // Get data
                let suratMasuk = [];
                let suratKeluar = [];
                let disposisi = [];

                if (this.filters.type === 'semua' || this.filters.type === 'masuk') {
                    const allMasuk = await DB.getAll('surat_masuk');
                    suratMasuk = allMasuk.filter(s => this.isInDateRange(s.tanggal_surat));
                }

                if (this.filters.type === 'semua' || this.filters.type === 'keluar') {
                    const allKeluar = await DB.getAll('surat_keluar');
                    suratKeluar = allKeluar.filter(s => this.isInDateRange(s.tanggal_surat));
                }

                if (this.filters.type === 'semua' || this.filters.type === 'disposisi') {
                    const allDisposisi = await DB.getAll('disposisi');
                    disposisi = allDisposisi.filter(d => this.isInDateRange(d.tanggal_disposisi));
                }

                // Build CSV content
                let csv = '';

                // BOM for Excel UTF-8
                csv += '\uFEFF';

                // Report info
                csv += `LAPORAN ARSIP SURAT DIGITAL\n`;
                csv += `Periode: ${this.formatDate(this.filters.startDate)} - ${this.formatDate(this.filters.endDate)}\n`;
                csv += `Jenis: ${this.getTypeLabel(this.filters.type)}\n\n`;

                // Surat Masuk
                if (suratMasuk.length > 0) {
                    csv += `SURAT MASUK\n`;
                    csv += `No,Nomor Surat,Tanggal,Perihal,Pengirim,Status\n`;
                    suratMasuk.forEach((s, i) => {
                        csv += `${i + 1},"${s.nomor_surat || ''}","${this.formatDate(s.tanggal_surat)}","${s.perihal || ''}","${s.pengirim || ''}","${this.formatStatus(s.status)}"\n`;
                    });
                    csv += `\n`;
                }

                // Surat Keluar
                if (suratKeluar.length > 0) {
                    csv += `SURAT KELUAR\n`;
                    csv += `No,Nomor Surat,Tanggal,Perihal,Penerima,Status\n`;
                    suratKeluar.forEach((s, i) => {
                        csv += `${i + 1},"${s.nomor_surat || ''}","${this.formatDate(s.tanggal_surat)}","${s.perihal || ''}","${s.penerima || ''}","${this.formatStatus(s.status)}"\n`;
                    });
                    csv += `\n`;
                }

                // Disposisi
                if (disposisi.length > 0) {
                    csv += `DISPOSISI\n`;
                    csv += `No,Surat Terkait,Tanggal,Tujuan,Instruksi,Status\n`;
                    disposisi.forEach((d, i) => {
                        csv += `${i + 1},"${d.nomor_surat || ''}","${this.formatDate(d.tanggal_disposisi)}","${d.tujuan || ''}","${d.instruksi || ''}","${this.formatStatus(d.status)}"\n`;
                    });
                }

                // Create and download file
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `laporan-arsip-surat-${Date.now()}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                showToast('Excel berhasil diexport', 'success');

            } catch (error) {
                Logger.error('Export Excel failed:', error);
                showToast('Gagal export Excel: ' + error.message, 'error');
            } finally {
                Spinner.hide();
            }
        }

        // ============================================
        // UTILITY FUNCTIONS
        // ============================================
        isInDateRange(dateString) {
            if (!dateString) return false;
            if (!this.filters.startDate && !this.filters.endDate) return true;

            const date = new Date(dateString);
            date.setHours(0, 0, 0, 0);

            const start = this.filters.startDate ? new Date(this.filters.startDate + 'T00:00:00') : null;
            const end = this.filters.endDate ? new Date(this.filters.endDate + 'T23:59:59') : null;

            if (start && date < start) return false;
            if (end && date > end) return false;
            return true;
        }

        formatDate(dateString) {
            if (!dateString) return '-';
            try {
                return new Date(dateString + 'T00:00:00').toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            } catch (e) {
                return dateString;
            }
        }

        formatDateISO(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        formatStatus(status) {
            const statusMap = {
                'baru': 'Baru',
                'diproses': 'Diproses',
                'selesai': 'Selesai',
                'ditolak': 'Ditolak',
                'pending': 'Pending'
            };
            return statusMap[status] || status || '-';
        }

        getTypeLabel(type) {
            const typeMap = {
                'semua': 'Semua Surat & Disposisi',
                'masuk': 'Surat Masuk',
                'keluar': 'Surat Keluar',
                'disposisi': 'Disposisi'
            };
            return typeMap[type] || type;
        }

        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        getAllStyles() {
            // Get all stylesheets
            let styles = '';
            const styleSheets = document.styleSheets;
            
            for (let i = 0; i < styleSheets.length; i++) {
                try {
                    const rules = styleSheets[i].cssRules || styleSheets[i].rules;
                    if (rules) {
                        for (let j = 0; j < rules.length; j++) {
                            styles += rules[j].cssText + '\n';
                        }
                    }
                } catch (e) {
                    // Cross-origin stylesheets may throw error
                    if (styleSheets[i].href) {
                        styles += `@import url("${styleSheets[i].href}");\n`;
                    }
                }
            }
            
            return `<style>${styles}</style>`;
        }
    }

    // ============================================
    // INITIALIZE MODULE
    // ============================================
    window.Laporan = new LaporanModule();
    Logger.info('Laporan module loaded');

})();
