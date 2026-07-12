/**
 * ============================================
 * REPORT.JS - Report Module
 * ARSIP SURAT DIGITAL v3.2.2
 * ============================================
 */

const Report = {
    chartInstances: {},
    
    // ========== RENDER ==========
    async render(params = {}) {
        return `
            <div class="report-page">
                <!-- Date Range -->
                <div class="card" style="margin-bottom: 20px;">
                    <div class="flex-between" style="flex-wrap: wrap; gap: 12px;">
                        <div class="flex" style="gap: 8px; flex-wrap: wrap;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>Dari</label>
                                <input type="date" id="reportStartDate" class="form-control" />
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>Sampai</label>
                                <input type="date" id="reportEndDate" class="form-control" />
                            </div>
                        </div>
                        <div class="flex" style="gap: 8px;">
                            <button class="btn btn-primary" id="reportGenerateBtn">
                                <i class="fas fa-chart-bar"></i> Generate
                            </button>
                            <button class="btn btn-success" id="reportExportBtn">
                                <i class="fas fa-file-excel"></i> Export
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Summary -->
                <div class="stats-grid" id="reportSummary">
                    <div class="stat-card">
                        <div class="stat-icon blue"><i class="fas fa-inbox"></i></div>
                        <div class="stat-number" id="reportTotalSM">0</div>
                        <div class="stat-label">Total Surat Masuk</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon green"><i class="fas fa-paper-plane"></i></div>
                        <div class="stat-number" id="reportTotalSK">0</div>
                        <div class="stat-label">Total Surat Keluar</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon orange"><i class="fas fa-clipboard-list"></i></div>
                        <div class="stat-number" id="reportTotalDisp">0</div>
                        <div class="stat-label">Total Disposisi</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon purple"><i class="fas fa-check-double"></i></div>
                        <div class="stat-number" id="reportApprovalRate">0%</div>
                        <div class="stat-label">Approval Rate</div>
                    </div>
                </div>
                
                <!-- Charts -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="card">
                        <div class="card-header">
                            <h3>Surat Masuk per Status</h3>
                        </div>
                        <canvas id="reportSMChart" height="250"></canvas>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3>Surat Keluar per Status</h3>
                        </div>
                        <canvas id="reportSKChart" height="250"></canvas>
                    </div>
                </div>
                
                <!-- Detail Table -->
                <div class="card">
                    <div class="card-header">
                        <h3>Detail Laporan</h3>
                    </div>
                    <div class="table-container" id="reportDetailTable">
                        <p class="text-muted">Generate laporan untuk melihat detail</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ========== INIT ==========
    init() {
        // Set default date range (last month)
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        
        document.getElementById('reportStartDate').value = oneMonthAgo.toISOString().split('T')[0];
        document.getElementById('reportEndDate').value = now.toISOString().split('T')[0];
        
        this.setupEventListeners();
        this.generateReport();
    },
    
    // ========== EVENT LISTENERS ==========
    setupEventListeners() {
        document.getElementById('reportGenerateBtn')?.addEventListener('click', () => {
            this.generateReport();
        });
        
        document.getElementById('reportExportBtn')?.addEventListener('click', () => {
            this.exportReport();
        });
    },
    
    // ========== GENERATE REPORT ==========
    async generateReport() {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        if (!startDate || !endDate) {
            showToast('warning', 'Peringatan', 'Pilih rentang tanggal terlebih dahulu');
            return;
        }
        
        try {
            // Load surat masuk report
            const smResponse = await API.get('report.suratMasuk', {
                token: App.token,
                startDate: startDate,
                endDate: endDate
            });
            
            // Load surat keluar report
            const skResponse = await API.get('report.suratKeluar', {
                token: App.token,
                startDate: startDate,
                endDate: endDate
            });
            
            // Load disposisi report
            const dispResponse = await API.get('report.disposisi', {
                token: App.token,
                startDate: startDate,
                endDate: endDate
            });
            
            if (smResponse.status === 'success') {
                this.renderSuratMasukReport(smResponse.data);
            }
            if (skResponse.status === 'success') {
                this.renderSuratKeluarReport(skResponse.data);
            }
            if (dispResponse.status === 'success') {
                this.renderDisposisiReport(dispResponse.data);
            }
            
            // Render summary
            this.renderSummary(smResponse.data, skResponse.data, dispResponse.data);
            
            // Render detail table
            this.renderDetailTable(smResponse.data, skResponse.data, dispResponse.data);
            
        } catch (error) {
            Utils.handleError(error, 'Gagal generate laporan');
        }
    },
    
    // ========== RENDER SURAT MASUK REPORT ==========
    renderSuratMasukReport(data) {
        const canvas = document.getElementById('reportSMChart');
        if (!canvas) return;
        
        if (this.chartInstances.sm) {
            this.chartInstances.sm.destroy();
        }
        
        const labels = Object.keys(data.byStatus || {});
        const values = Object.values(data.byStatus || {});
        const colors = ['#1976D2', '#FF9800', '#7B1FA2', '#4CAF50', '#F44336'];
        
        const ctx = canvas.getContext('2d');
        this.chartInstances.sm = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },
    
    // ========== RENDER SURAT KELUAR REPORT ==========
    renderSuratKeluarReport(data) {
        const canvas = document.getElementById('reportSKChart');
        if (!canvas) return;
        
        if (this.chartInstances.sk) {
            this.chartInstances.sk.destroy();
        }
        
        const labels = Object.keys(data.byStatus || {});
        const values = Object.values(data.byStatus || {});
        const colors = ['#4CAF50', '#FF9800', '#1976D2', '#F44336', '#7B1FA2'];
        
        const ctx = canvas.getContext('2d');
        this.chartInstances.sk = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },
    
    // ========== RENDER DISPOSISI REPORT ==========
    renderDisposisiReport(data) {
        // Update disposisi stats
        document.getElementById('reportTotalDisp').textContent = data.total || 0;
    },
    
    // ========== RENDER SUMMARY ==========
    renderSummary(smData, skData, dispData) {
        const totalSM = smData?.total || 0;
        const totalSK = skData?.total || 0;
        const totalDisp = dispData?.total || 0;
        
        document.getElementById('reportTotalSM').textContent = totalSM;
        document.getElementById('reportTotalSK').textContent = totalSK;
        document.getElementById('reportTotalDisp').textContent = totalDisp;
        
        // Approval rate
        const approved = skData?.approved || 0;
        const total = skData?.total || 0;
        const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
        document.getElementById('reportApprovalRate').textContent = rate + '%';
    },
    
    // ========== RENDER DETAIL TABLE ==========
    renderDetailTable(smData, skData, dispData) {
        const container = document.getElementById('reportDetailTable');
        
        const smItems = smData?.byStatus || {};
        const skItems = skData?.byStatus || {};
        const dispItems = dispData?.byStatus || {};
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Kategori</th>
                        <th>Status</th>
                        <th>Jumlah</th>
                        <th>Persentase</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Surat Masuk
        const smTotal = smData?.total || 1;
        Object.keys(smItems).forEach(status => {
            const count = smItems[status];
            html += `
                <tr>
                    <td><strong>Surat Masuk</strong></td>
                    <td>${Utils.getStatusLabel(status)}</td>
                    <td>${count}</td>
                    <td>${Math.round((count / smTotal) * 100)}%</td>
                </tr>
            `;
        });
        
        // Surat Keluar
        const skTotal = skData?.total || 1;
        Object.keys(skItems).forEach(status => {
            const count = skItems[status];
            html += `
                <tr>
                    <td><strong>Surat Keluar</strong></td>
                    <td>${Utils.getStatusLabel(status)}</td>
                    <td>${count}</td>
                    <td>${Math.round((count / skTotal) * 100)}%</td>
                </tr>
            `;
        });
        
        // Disposisi
        const dispTotal = dispData?.total || 1;
        Object.keys(dispItems).forEach(status => {
            const count = dispItems[status];
            html += `
                <tr>
                    <td><strong>Disposisi</strong></td>
                    <td>${Utils.getStatusLabel(status)}</td>
                    <td>${count}</td>
                    <td>${Math.round((count / dispTotal) * 100)}%</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
    },
    
    // ========== EXPORT REPORT ==========
    async exportReport() {
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        
        try {
            const response = await API.get('export.data', {
                token: App.token,
                type: 'surat-masuk',
                format: 'csv'
            });
            
            if (response.status === 'success') {
                showToast('success', 'Berhasil', 'Data berhasil diexport: ' + response.data.fileName);
                window.open(response.data.fileUrl, '_blank');
            } else {
                showToast('error', 'Error', response.message || 'Gagal export data');
            }
        } catch (error) {
            Utils.handleError(error, 'Gagal export data');
        }
    }
};
