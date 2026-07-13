/**
 * EXPORT SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Export data to PDF, Excel, CSV formats
 */

class ExportService {
  constructor() {
    this.exporting = false;
  }
  
  /**
   * Initialize export service
   */
  init() {
    console.log('✅ Export Service initialized');
  }
  
  /**
   * Export to PDF
   */
  async exportPDF(type, data, options = {}) {
    const {
      title = 'Laporan',
      orientation = 'portrait',
      pageSize = 'A4',
      includeHeader = true,
      includeFooter = true,
      template = null
    } = options;
    
    this.checkExporting();
    this.exporting = true;
    
    try {
      NotificationService.show('Membuat PDF...', 'info', { duration: 3000 });
      
      // Generate PDF content
      const content = this.generatePDFContent(type, data, options);
      
      // Create print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            @page {
              size: ${pageSize} ${orientation};
              margin: 20mm;
            }
            
            body {
              font-family: 'Roboto', Arial, sans-serif;
              font-size: 12px;
              color: #333;
              line-height: 1.5;
            }
            
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #1976D2;
              padding-bottom: 10px;
            }
            
            .header h1 {
              font-size: 18px;
              margin: 0 0 5px 0;
              color: #1976D2;
            }
            
            .header p {
              font-size: 11px;
              color: #666;
              margin: 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            th {
              background-color: #1976D2;
              color: white;
              padding: 8px;
              text-align: left;
              font-weight: 500;
              font-size: 11px;
            }
            
            td {
              padding: 6px 8px;
              border-bottom: 1px solid #e0e0e0;
              font-size: 11px;
            }
            
            tr:nth-child(even) {
              background-color: #f5f5f5;
            }
            
            .footer {
              text-align: center;
              font-size: 10px;
              color: #999;
              margin-top: 30px;
              border-top: 1px solid #e0e0e0;
              padding-top: 10px;
            }
            
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 10px;
              font-weight: 500;
            }
            
            .badge-success { background: #C8E6C9; color: #2E7D32; }
            .badge-warning { background: #FFE0B2; color: #E65100; }
            .badge-info { background: #B3E5FC; color: #0277BD; }
            .badge-error { background: #FFCDD2; color: #C62828; }
            
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${includeHeader ? this.generatePDFHeader(title) : ''}
          ${content}
          ${includeFooter ? this.generatePDFFooter() : ''}
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
      
      NotificationService.success('PDF siap dicetak');
      
    } catch (error) {
      NotificationService.error('Gagal membuat PDF: ' + error.message);
    } finally {
      this.exporting = false;
    }
  }
  
  /**
   * Generate PDF header
   */
  generatePDFHeader(title) {
    return `
      <div class="header">
        <h1>${title}</h1>
        <p>Arsip Surat Digital Enterprise v3.2.2</p>
        <p>Dicetak: ${new Date().toLocaleString('id-ID')}</p>
      </div>
    `;
  }
  
  /**
   * Generate PDF footer
   */
  generatePDFFooter() {
    return `
      <div class="footer">
        <p>Dokumen ini dicetak dari Arsip Surat Digital Enterprise</p>
        <p>© ${new Date().getFullYear()} - Semua hak dilindungi</p>
      </div>
    `;
  }
  
  /**
   * Generate PDF content based on type
   */
  generatePDFContent(type, data, options) {
    switch (type) {
      case 'surat-masuk':
        return this.generateSuratMasukPDF(data);
      case 'surat-keluar':
        return this.generateSuratKeluarPDF(data);
      case 'disposisi':
        return this.generateDisposisiPDF(data);
      case 'report':
        return this.generateReportPDF(data);
      case 'detail':
        return this.generateDetailPDF(data);
      default:
        return this.generateGenericPDF(data);
    }
  }
  
  /**
   * Generate surat masuk PDF
   */
  generateSuratMasukPDF(items) {
    if (!items || items.length === 0) {
      return '<p>Tidak ada data</p>';
    }
    
    const rows = items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.nomorAgenda || '-'}</td>
        <td>${item.nomorSurat || '-'}</td>
        <td>${this.formatDate(item.tanggalSurat)}</td>
        <td>${item.pengirim || '-'}</td>
        <td>${item.perihal || '-'}</td>
        <td><span class="badge badge-${this.getStatusClass(item.status)}">${item.status || '-'}</span></td>
      </tr>
    `).join('');
    
    return `
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>No. Agenda</th>
            <th>No. Surat</th>
            <th>Tanggal</th>
            <th>Pengirim</th>
            <th>Perihal</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }
  
  /**
   * Generate surat keluar PDF
   */
  generateSuratKeluarPDF(items) {
    if (!items || items.length === 0) {
      return '<p>Tidak ada data</p>';
    }
    
    const rows = items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.nomorSurat || '-'}</td>
        <td>${this.formatDate(item.tanggalSurat)}</td>
        <td>${item.tujuan || '-'}</td>
        <td>${item.perihal || '-'}</td>
        <td><span class="badge badge-${this.getStatusClass(item.status)}">${item.status || '-'}</span></td>
      </tr>
    `).join('');
    
    return `
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>No. Surat</th>
            <th>Tanggal</th>
            <th>Tujuan</th>
            <th>Perihal</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }
  
  /**
   * Generate disposisi PDF
   */
  generateDisposisiPDF(items) {
    if (!items || items.length === 0) {
      return '<p>Tidak ada data</p>';
    }
    
    const rows = items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.suratMasukId || '-'}</td>
        <td>${item.instruksi || '-'}</td>
        <td>${this.formatDate(item.batasWaktu)}</td>
        <td><span class="badge badge-${this.getStatusClass(item.status)}">${item.status || '-'}</span></td>
      </tr>
    `).join('');
    
    return `
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Surat Masuk</th>
            <th>Instruksi</th>
            <th>Batas Waktu</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }
  
  /**
   * Generate report PDF
   */
  generateReportPDF(data) {
    let html = '';
    
    if (data.summary) {
      html += `
        <h3>Ringkasan</h3>
        <table>
          <tr><td><strong>Total Surat Masuk</strong></td><td>${data.summary.suratMasuk || 0}</td></tr>
          <tr><td><strong>Total Surat Keluar</strong></td><td>${data.summary.suratKeluar || 0}</td></tr>
          <tr><td><strong>Total Disposisi</strong></td><td>${data.summary.disposisi || 0}</td></tr>
          <tr><td><strong>Periode</strong></td><td>${data.summary.periode || '-'}</td></tr>
        </table>
        <br>
      `;
    }
    
    if (data.charts) {
      html += '<p><em>Grafik tidak dapat ditampilkan dalam format cetak</em></p><br>';
    }
    
    return html;
  }
  
  /**
   * Generate detail PDF
   */
  generateDetailPDF(data) {
    if (!data) return '<p>Tidak ada data</p>';
    
    const fields = [
      { label: 'Nomor Agenda', value: data.nomorAgenda },
      { label: 'Nomor Surat', value: data.nomorSurat },
      { label: 'Tanggal Surat', value: this.formatDate(data.tanggalSurat) },
      { label: 'Tanggal Terima', value: this.formatDate(data.tanggalTerima) },
      { label: 'Pengirim', value: data.pengirim },
      { label: 'Perihal', value: data.perihal },
      { label: 'Sifat', value: data.sifat },
      { label: 'Status', value: data.status },
      { label: 'Klasifikasi', value: data.klasifikasi },
      { label: 'Catatan', value: data.catatan }
    ];
    
    const rows = fields
      .filter(f => f.value)
      .map(f => `<tr><td><strong>${f.label}</strong></td><td>${f.value}</td></tr>`)
      .join('');
    
    return `<table>${rows}</table>`;
  }
  
  /**
   * Generate generic PDF
   */
  generateGenericPDF(data) {
    if (!data) return '<p>Tidak ada data</p>';
    
    if (Array.isArray(data)) {
      return this.generateSuratMasukPDF(data);
    }
    
    return this.generateDetailPDF(data);
  }
  
  /**
   * Export to Excel
   */
  async exportExcel(type, data, options = {}) {
    const { fileName = `export-${Date.now()}.xlsx` } = options;
    
    this.checkExporting();
    this.exporting = true;
    
    try {
      NotificationService.show('Membuat file Excel...', 'info');
      
      // Convert data to worksheet format
      const worksheet = this.convertToWorksheet(type, data);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      // Generate and download
      XLSX.writeFile(workbook, fileName);
      
      NotificationService.success('File Excel berhasil didownload');
      
    } catch (error) {
      NotificationService.error('Gagal membuat Excel: ' + error.message);
    } finally {
      this.exporting = false;
    }
  }
  
  /**
   * Convert data to worksheet
   */
  convertToWorksheet(type, items) {
    let headers = [];
    let rows = [];
    
    switch (type) {
      case 'surat-masuk':
        headers = ['No', 'No. Agenda', 'No. Surat', 'Tanggal Surat', 'Tanggal Terima', 
                   'Pengirim', 'Perihal', 'Sifat', 'Status', 'Klasifikasi'];
        rows = items.map((item, i) => [
          i + 1,
          item.nomorAgenda,
          item.nomorSurat,
          this.formatDate(item.tanggalSurat),
          this.formatDate(item.tanggalTerima),
          item.pengirim,
          item.perihal,
          item.sifat,
          item.status,
          item.klasifikasi
        ]);
        break;
        
      case 'surat-keluar':
        headers = ['No', 'No. Surat', 'Tanggal', 'Tujuan', 'Perihal', 'Sifat', 
                   'Jenis Surat', 'Status', 'Approval'];
        rows = items.map((item, i) => [
          i + 1,
          item.nomorSurat,
          this.formatDate(item.tanggalSurat),
          item.tujuan,
          item.perihal,
          item.sifat,
          item.jenisSurat,
          item.status,
          item.approvalStatus
        ]);
        break;
        
      case 'disposisi':
        headers = ['No', 'Surat Masuk', 'Dari', 'Kepada', 'Instruksi', 
                   'Sifat', 'Batas Waktu', 'Status'];
        rows = items.map((item, i) => [
          i + 1,
          item.suratMasukId,
          item.dariUserId,
          item.kepadaUserId,
          item.instruksi,
          item.sifat,
          this.formatDate(item.batasWaktu),
          item.status
        ]);
        break;
        
      default:
        if (items && items.length > 0) {
          headers = Object.keys(items[0]);
          rows = items.map((item, i) => [i + 1, ...Object.values(item)]);
        }
    }
    
    return XLSX.utils.aoa_to_sheet([headers, ...rows]);
  }
  
  /**
   * Export to CSV
   */
  exportCSV(type, data, options = {}) {
    const { fileName = `export-${Date.now()}.csv`, delimiter = ',' } = options;
    
    this.checkExporting();
    
    try {
      let csv = '';
      
      // Convert to CSV format
      if (type === 'surat-masuk' && Array.isArray(data)) {
        csv = this.convertToCSV(data, [
          { key: 'nomorAgenda', label: 'No. Agenda' },
          { key: 'nomorSurat', label: 'No. Surat' },
          { key: 'tanggalSurat', label: 'Tanggal Surat', format: 'date' },
          { key: 'pengirim', label: 'Pengirim' },
          { key: 'perihal', label: 'Perihal' },
          { key: 'sifat', label: 'Sifat' },
          { key: 'status', label: 'Status' }
        ], delimiter);
      } else if (Array.isArray(data) && data.length > 0) {
        const keys = Object.keys(data[0]);
        csv = this.convertToCSV(data, keys.map(k => ({ key: k, label: k })), delimiter);
      }
      
      // Download
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      
      NotificationService.success('File CSV berhasil didownload');
      
    } catch (error) {
      NotificationService.error('Gagal membuat CSV: ' + error.message);
    }
  }
  
  /**
   * Convert data to CSV string
   */
  convertToCSV(data, columns, delimiter) {
    const header = columns.map(c => this.escapeCSV(c.label)).join(delimiter);
    const rows = data.map(item => 
      columns.map(c => {
        let value = item[c.key] || '';
        if (c.format === 'date') value = this.formatDate(value);
        return this.escapeCSV(String(value));
      }).join(delimiter)
    );
    
    return [header, ...rows].join('\n');
  }
  
  /**
   * Escape CSV value
   */
  escapeCSV(value) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  }
  
  /**
   * Export all data
   */
  async exportAll() {
    try {
      NotificationService.show('Mengexport semua data...', 'info', { duration: 5000 });
      
      const response = await api.get('export.all');
      
      if (response.status === 'success') {
        const { suratMasuk, suratKeluar, disposisi, users } = response.data;
        
        // Create ZIP file
        const zip = new JSZip();
        
        if (suratMasuk) {
          zip.file('surat-masuk.json', JSON.stringify(suratMasuk, null, 2));
          zip.file('surat-masuk.csv', this.convertToCSV(suratMasuk, [
            { key: 'nomorAgenda', label: 'No. Agenda' },
            { key: 'nomorSurat', label: 'No. Surat' },
            { key: 'tanggalSurat', label: 'Tanggal Surat' },
            { key: 'pengirim', label: 'Pengirim' },
            { key: 'perihal', label: 'Perihal' }
          ], ','));
        }
        
        if (suratKeluar) {
          zip.file('surat-keluar.json', JSON.stringify(suratKeluar, null, 2));
        }
        
        if (disposisi) {
          zip.file('disposisi.json', JSON.stringify(disposisi, null, 2));
        }
        
        if (users) {
          // Remove sensitive data
          const safeUsers = users.map(u => ({
            id: u.id,
            username: u.username,
            namaLengkap: u.namaLengkap,
            role: u.role,
            isActive: u.isActive
          }));
          zip.file('users.json', JSON.stringify(safeUsers, null, 2));
        }
        
        // Generate ZIP
        const blob = await zip.generateAsync({ type: 'blob' });
        
        // Download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `arsip-surat-export-${new Date().toISOString().split('T')[0]}.zip`;
        link.click();
        URL.revokeObjectURL(url);
        
        NotificationService.success('Export berhasil');
      }
    } catch (error) {
      NotificationService.error('Gagal export: ' + error.message);
    }
  }
  
  /**
   * Check if export is in progress
   */
  checkExporting() {
    if (this.exporting) {
      throw new Error('Export sedang berlangsung. Silakan tunggu.');
    }
  }
  
  /**
   * Get status class
   */
  getStatusClass(status) {
    const classes = {
      'diterima': 'info',
      'diproses': 'warning',
      'selesai': 'success',
      'diarsipkan': 'success',
      'draft': 'default',
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'error'
    };
    return classes[status] || 'default';
  }
  
  /**
   * Format date
   */
  formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

// Singleton instance
const ExportService = new ExportService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExportService };
}
