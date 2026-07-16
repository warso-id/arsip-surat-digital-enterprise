// ==================== PDF SERVICE ====================
// Arsip Surat Digital Enterprise

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const config = require('../../../config/app');

class PdfService {
    constructor() {
        this.defaultFont = 'Helvetica';
        this.defaultFontSize = 12;
        this.pageSize = 'A4';
        this.margin = 50;
    }

    /**
     * Generate surat masuk report PDF
     */
    async generateSuratMasukReport(data, options = {}) {
        const doc = this.createDocument(options);
        const filename = `Laporan_Surat_Masuk_${Date.now()}.pdf`;
        const filePath = path.join(config.storage.disks.local.root, 'reports', filename);

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

        return new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header
            this.addHeader(doc, 'LAPORAN SURAT MASUK');
            this.addPeriodInfo(doc, options);
            
            // Statistics Summary
            if (data.statistics) {
                this.addStatisticsSummary(doc, data.statistics);
            }

            // Table
            this.addSuratTable(doc, data.items, [
                { header: 'No. Agenda', width: 80, key: 'nomor_agenda' },
                { header: 'Tanggal', width: 70, key: 'tanggal_terima' },
                { header: 'Pengirim', width: 120, key: 'pengirim' },
                { header: 'Perihal', width: 150, key: 'perihal' },
                { header: 'Status', width: 70, key: 'status' },
            ]);

            // Footer
            this.addFooter(doc);

            doc.end();

            stream.on('finish', () => {
                resolve({
                    filename: filename,
                    path: `reports/${filename}`,
                    url: `/storage/reports/${filename}`,
                });
            });

            stream.on('error', reject);
        });
    }

    /**
     * Generate surat keluar report PDF
     */
    async generateSuratKeluarReport(data, options = {}) {
        const doc = this.createDocument(options);
        const filename = `Laporan_Surat_Keluar_${Date.now()}.pdf`;
        const filePath = path.join(config.storage.disks.local.root, 'reports', filename);

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

        return new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            this.addHeader(doc, 'LAPORAN SURAT KELUAR');
            this.addPeriodInfo(doc, options);
            
            if (data.statistics) {
                this.addStatisticsSummary(doc, data.statistics);
            }

            this.addSuratTable(doc, data.items, [
                { header: 'No. Surat', width: 80, key: 'nomor_surat' },
                { header: 'Tanggal', width: 70, key: 'tanggal_surat' },
                { header: 'Tujuan', width: 120, key: 'tujuan' },
                { header: 'Perihal', width: 150, key: 'perihal' },
                { header: 'Status', width: 70, key: 'status' },
            ]);

            this.addFooter(doc);
            doc.end();

            stream.on('finish', () => {
                resolve({
                    filename: filename,
                    path: `reports/${filename}`,
                    url: `/storage/reports/${filename}`,
                });
            });

            stream.on('error', reject);
        });
    }

    /**
     * Generate disposisi report PDF
     */
    async generateDisposisiReport(data, options = {}) {
        const doc = this.createDocument({ ...options, orientation: 'landscape' });
        const filename = `Laporan_Disposisi_${Date.now()}.pdf`;
        const filePath = path.join(config.storage.disks.local.root, 'reports', filename);

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

        return new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            this.addHeader(doc, 'LAPORAN DISPOSISI');
            this.addPeriodInfo(doc, options);

            this.addSuratTable(doc, data.items, [
                { header: 'No. Disposisi', width: 80, key: 'nomor_disposisi' },
                { header: 'Surat', width: 100, key: 'surat_perihal' },
                { header: 'Dari', width: 100, key: 'dari_nama' },
                { header: 'Kepada', width: 100, key: 'kepada_nama' },
                { header: 'Status', width: 70, key: 'status' },
                { header: 'Batas Waktu', width: 80, key: 'batas_waktu' },
            ]);

            this.addFooter(doc);
            doc.end();

            stream.on('finish', () => {
                resolve({
                    filename: filename,
                    path: `reports/${filename}`,
                    url: `/storage/reports/${filename}`,
                });
            });

            stream.on('error', reject);
        });
    }

    /**
     * Generate surat detail PDF
     */
    async generateSuratDetail(surat, lampiran = []) {
        const doc = this.createDocument();
        const filename = `Surat_${surat.nomor_agenda.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        const filePath = path.join(config.storage.disks.local.root, 'exports', filename);

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

        return new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Title
            doc.fontSize(18).font('Helvetica-Bold')
               .text('DETAIL SURAT MASUK', { align: 'center' });
            doc.moveDown(2);

            // QR Code placeholder
            doc.rect(doc.page.width - 150, 50, 100, 100).stroke();
            doc.fontSize(8).text('QR Code', doc.page.width - 150, 105, {
                width: 100,
                align: 'center',
            });
            doc.moveDown();

            // Surat details
            const details = [
                ['Nomor Agenda', surat.nomor_agenda],
                ['Nomor Surat', surat.nomor_surat],
                ['Tanggal Surat', surat.tanggal_surat],
                ['Tanggal Terima', surat.tanggal_terima],
                ['Pengirim', surat.pengirim],
                ['Perihal', surat.perihal],
                ['Kategori', surat.kategori],
                ['Sifat', surat.sifat_surat],
                ['Status', surat.status],
            ];

            this.addDetailTable(doc, details);
            doc.moveDown(2);

            // Ringkasan
            if (surat.ringkasan) {
                doc.fontSize(12).font('Helvetica-Bold').text('Ringkasan:');
                doc.fontSize(10).font('Helvetica').text(surat.ringkasan);
                doc.moveDown(2);
            }

            // Catatan
            if (surat.catatan) {
                doc.fontSize(12).font('Helvetica-Bold').text('Catatan:');
                doc.fontSize(10).font('Helvetica').text(surat.catatan);
            }

            this.addFooter(doc);
            doc.end();

            stream.on('finish', () => {
                resolve({
                    filename: filename,
                    path: `exports/${filename}`,
                    url: `/storage/exports/${filename}`,
                });
            });

            stream.on('error', reject);
        });
    }

    /**
     * Create PDF document
     */
    createDocument(options = {}) {
        const doc = new PDFDocument({
            size: options.size || this.pageSize,
            margin: options.margin || this.margin,
            layout: options.orientation || 'portrait',
            info: {
                Title: options.title || 'Arsip Surat Digital',
                Author: config.app.name,
                Subject: 'Laporan Arsip Surat',
                Creator: config.app.name,
                Producer: config.app.name,
            },
        });

        return doc;
    }

    /**
     * Add header to document
     */
    addHeader(doc, title) {
        // Logo placeholder
        doc.rect(50, 40, 50, 50).fill('#1a56db');
        doc.fontSize(10).font('Helvetica-Bold')
           .fillColor('white').text('LOGO', 55, 55, { width: 40, align: 'center' });

        // Title
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#1f2937')
           .text(title, 110, 45, { align: 'left' });

        // App name
        doc.fontSize(10).font('Helvetica').fillColor('#64748b')
           .text(config.app.name, 110, 65);

        // Horizontal line
        doc.moveDown(2);
        doc.moveTo(50, 105).lineTo(doc.page.width - 50, 105)
           .strokeColor('#e5e7eb').stroke();
        doc.moveDown();
    }

    /**
     * Add period info
     */
    addPeriodInfo(doc, options) {
        if (options.startDate || options.endDate) {
            doc.fontSize(10).font('Helvetica').fillColor('#64748b');
            
            let periodText = 'Periode: ';
            if (options.startDate) periodText += options.startDate;
            if (options.endDate) periodText += ` s/d ${options.endDate}`;
            
            doc.text(periodText, { align: 'left' });
            doc.moveDown();
        }
    }

    /**
     * Add statistics summary
     */
    addStatisticsSummary(doc, stats) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1f2937')
           .text('Ringkasan Statistik');
        doc.moveDown(0.5);

        const statsData = [
            ['Total Surat', stats.total || 0],
            ['Baru', stats.baru || 0],
            ['Proses', stats.proses || 0],
            ['Selesai', stats.selesai || 0],
        ];

        this.addDetailTable(doc, statsData);
        doc.moveDown(2);
    }

    /**
     * Add table for surat data
     */
    addSuratTable(doc, items, columns) {
        if (!items || items.length === 0) {
            doc.fontSize(10).text('Tidak ada data', { align: 'center' });
            return;
        }

        const tableTop = doc.y;
        const colWidths = columns.map(col => col.width);
        const rowHeight = 25;

        // Table header
        this.drawTableRow(doc, tableTop, colWidths, 
            columns.map(col => col.header), 
            true
        );

        // Table rows
        let y = tableTop + rowHeight;
        
        items.forEach((item, index) => {
            // Check page break
            if (y > doc.page.height - 100) {
                doc.addPage();
                y = 50;
                
                // Redraw header on new page
                this.drawTableRow(doc, y, colWidths, 
                    columns.map(col => col.header), 
                    true
                );
                y += rowHeight;
            }

            const rowData = columns.map(col => {
                const value = item[col.key];
                return value !== null && value !== undefined ? String(value) : '-';
            });

            this.drawTableRow(doc, y, colWidths, rowData, false, 
                index % 2 === 0 ? '#ffffff' : '#f9fafb'
            );
            
            y += rowHeight;
        });

        doc.moveDown(2);
    }

    /**
     * Draw table row
     */
    drawTableRow(doc, y, colWidths, texts, isHeader = false, fillColor = null) {
        let x = doc.page.margins.left;
        const rowHeight = 25;

        // Background
        if (fillColor) {
            doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
               .fill(fillColor);
        }

        texts.forEach((text, i) => {
            const width = colWidths[i];
            
            // Cell border
            doc.rect(x, y, width, rowHeight)
               .strokeColor('#e5e7eb')
               .lineWidth(0.5)
               .stroke();

            // Text
            doc.fontSize(isHeader ? 9 : 8)
               .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
               .fillColor(isHeader ? '#1f2937' : '#374151')
               .text(text || '', x + 5, y + 5, {
                   width: width - 10,
                   height: rowHeight - 10,
                   ellipsis: true,
               });

            x += width;
        });
    }

    /**
     * Add detail table
     */
    addDetailTable(doc, details) {
        details.forEach(([label, value]) => {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151')
               .text(label + ':', { continued: true, width: 150 });
            doc.font('Helvetica').fillColor('#1f2937')
               .text(' ' + (value || '-'));
            doc.moveDown(0.3);
        });
    }

    /**
     * Add footer
     */
    addFooter(doc) {
        const bottom = doc.page.height - 50;

        doc.moveTo(50, bottom).lineTo(doc.page.width - 50, bottom)
           .strokeColor('#e5e7eb').stroke();

        doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
           .text(
               `Dicetak pada: ${new Date().toLocaleString('id-ID')} | ${config.app.name} v${config.app.version}`,
               50, bottom + 10, { align: 'center' }
           );

        // Page number
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).text(
                `Halaman ${i + 1} dari ${range.count}`,
                50, bottom + 20, { align: 'center' }
            );
        }
    }
}

module.exports = new PdfService();
