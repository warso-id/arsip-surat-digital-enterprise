const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const DateHelper = require('../Helpers/DateHelper');

class PdfService {
    /**
     * Generate PDF untuk surat
     */
    static async generateSuratPDF(surat, tipe) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    info: {
                        Title: `Surat ${tipe === 'masuk' ? 'Masuk' : 'Keluar'} - ${surat.nomor_surat}`,
                        Author: 'Arsip Surat Digital'
                    }
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                // Header
                this.addHeader(doc);

                // Title
                doc.fontSize(16)
                   .font('Helvetica-Bold')
                   .text(`SURAT ${tipe.toUpperCase()}`, { align: 'center' });
                
                doc.moveDown(0.5);
                
                // Line
                doc.moveTo(50, doc.y)
                   .lineTo(545, doc.y)
                   .stroke();
                
                doc.moveDown();

                // Informasi Surat
                this.addSuratInfo(doc, surat, tipe);

                // Footer
                this.addFooter(doc, surat);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate PDF untuk laporan
     */
    static async generateLaporanPDF(data, filters) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    layout: 'landscape',
                    info: {
                        Title: 'Laporan Surat',
                        Author: 'Arsip Surat Digital'
                    }
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                // Header
                this.addHeader(doc);

                // Title
                doc.fontSize(16)
                   .font('Helvetica-Bold')
                   .text('LAPORAN SURAT', { align: 'center' });
                
                // Filter info
                doc.fontSize(10)
                   .font('Helvetica')
                   .text(`Periode: ${filters.tanggal_mulai || 'Semua'} - ${filters.tanggal_selesai || 'Semua'}`, { align: 'center' });
                
                doc.moveDown();

                // Table
                this.addLaporanTable(doc, data);

                // Footer
                doc.moveDown();
                doc.fontSize(8)
                   .font('Helvetica')
                   .text(`Dicetak pada: ${DateHelper.formatDateTimeIndonesia(new Date())}`, { align: 'right' });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate PDF untuk disposisi
     */
    static async generateDisposisiPDF(disposisi) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    info: {
                        Title: 'Lembar Disposisi',
                        Author: 'Arsip Surat Digital'
                    }
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));

                // Header
                this.addHeader(doc);

                // Title
                doc.fontSize(16)
                   .font('Helvetica-Bold')
                   .text('LEMBAR DISPOSISI', { align: 'center' });
                
                doc.moveDown();

                // Informasi Surat
                doc.fontSize(11)
                   .font('Helvetica-Bold')
                   .text('Informasi Surat:');
                
                doc.moveDown(0.3);
                
                const suratInfo = [
                    ['Nomor Surat', ': ' + disposisi.surat_masuk.nomor_surat],
                    ['Tanggal Surat', ': ' + DateHelper.formatTanggalIndonesia(disposisi.surat_masuk.tanggal_surat)],
                    ['Pengirim', ': ' + disposisi.surat_masuk.pengirim],
                    ['Perihal', ': ' + disposisi.surat_masuk.perihal]
                ];

                this.addInfoTable(doc, suratInfo);

                doc.moveDown();

                // Informasi Disposisi
                doc.fontSize(11)
                   .font('Helvetica-Bold')
                   .text('Instruksi Disposisi:');
                
                doc.moveDown(0.3);
                
                const disposisiInfo = [
                    ['Dari', ': ' + disposisi.dari_user.nama_lengkap],
                    ['Kepada', ': ' + disposisi.kepada_user.nama_lengkap],
                    ['Instruksi', ': ' + disposisi.instruksi],
                    ['Batas Waktu', ': ' + (disposisi.batas_waktu ? DateHelper.formatTanggalIndonesia(disposisi.batas_waktu) : '-')],
                    ['Sifat', ': ' + disposisi.sifat.toUpperCase()]
                ];

                this.addInfoTable(doc, disposisiInfo);

                // Footer
                doc.moveDown(2);
                
                // Tanda tangan
                doc.fontSize(10)
                   .font('Helvetica')
                   .text('Mengetahui,', { align: 'right' });
                
                doc.moveDown(3);
                
                doc.text(disposisi.dari_user.nama_lengkap, { align: 'right' });
                doc.text(disposisi.dari_user.jabatan || '', { align: 'right' });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Add header to document
     */
    static addHeader(doc) {
        // Add logo if exists
        const logoPath = path.join(__dirname, '../../public/images/logo.svg');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 50 });
        }

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('ARSIP SURAT DIGITAL', { align: 'center' });
        
        doc.fontSize(9)
           .font('Helvetica')
           .text('Sistem Manajemen Arsip Surat', { align: 'center' });
        
        doc.moveDown();
    }

    /**
     * Add surat info
     */
    static addSuratInfo(doc, surat, tipe) {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('Informasi Surat:');
        
        doc.moveDown(0.3);
        
        const info = [
            ['Nomor Surat', ': ' + surat.nomor_surat],
            ['Tanggal Surat', ': ' + DateHelper.formatTanggalIndonesia(surat.tanggal_surat)],
            [tipe === 'masuk' ? 'Pengirim' : 'Tujuan', ': ' + (tipe === 'masuk' ? surat.pengirim : surat.tujuan)],
            ['Perihal', ': ' + surat.perihal],
            ['Sifat', ': ' + surat.sifat.toUpperCase()],
            ['Status', ': ' + surat.status.toUpperCase()]
        ];

        if (surat.instansi) {
            info.push(['Instansi', ': ' + surat.instansi.nama_instansi]);
        }

        this.addInfoTable(doc, info);

        if (surat.isi_ringkas) {
            doc.moveDown();
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .text('Isi Ringkas:');
            
            doc.moveDown(0.3);
            doc.fontSize(10)
               .font('Helvetica')
               .text(surat.isi_ringkas);
        }
    }

    /**
     * Add info table
     */
    static addInfoTable(doc, data) {
        const startX = 50;
        let startY = doc.y;
        const labelWidth = 120;
        const lineHeight = 20;

        doc.fontSize(10).font('Helvetica');

        data.forEach(([label, value]) => {
            doc.text(label, startX, startY, { width: labelWidth, continued: false });
            doc.text(value, startX + labelWidth, startY);
            startY += lineHeight;
        });

        doc.moveDown();
    }

    /**
     * Add laporan table
     */
    static addLaporanTable(doc, data) {
        const tableTop = doc.y;
        const tableHeaders = ['No', 'No. Surat', 'Tanggal', 'Pengirim/Tujuan', 'Perihal', 'Status', 'Tipe'];
        const columnWidths = [30, 100, 70, 120, 150, 80, 60];
        const rowHeight = 25;

        // Draw headers
        doc.fontSize(9).font('Helvetica-Bold');
        let xPos = 50;
        
        // Header background
        doc.fillColor('#f0f0f0')
           .rect(50, tableTop, 560, rowHeight)
           .fill();
        
        doc.fillColor('#000000');
        
        tableHeaders.forEach((header, i) => {
            doc.text(header, xPos, tableTop + 5, {
                width: columnWidths[i],
                align: 'center'
            });
            xPos += columnWidths[i];
        });

        // Draw rows
        doc.font('Helvetica');
        let yPos = tableTop + rowHeight;

        data.forEach((item, index) => {
            // Alternate row background
            if (index % 2 === 0) {
                doc.fillColor('#ffffff')
                   .rect(50, yPos, 560, rowHeight)
                   .fill();
            }

            doc.fillColor('#000000');
            xPos = 50;

            const row = [
                (index + 1).toString(),
                item.nomor_surat || '',
                DateHelper.formatTanggalIndonesia(item.tanggal_surat || item.tanggal_terima),
                item.pengirim || item.tujuan || '',
                item.perihal || '',
                (item.status || '').toUpperCase(),
                (item.tipe_surat || '').toUpperCase()
            ];

            row.forEach((text, i) => {
                doc.text(text, xPos + 2, yPos + 5, {
                    width: columnWidths[i] - 4,
                    align: i === 0 ? 'center' : 'left'
                });
                xPos += columnWidths[i];
            });

            yPos += rowHeight;

            // Check if new page needed
            if (yPos > 750) {
                doc.addPage();
                yPos = 50;
                // Redraw headers on new page
                this.addTableHeaders(doc, tableHeaders, columnWidths, yPos);
                yPos += rowHeight;
            }
        });
    }

    /**
     * Add table headers
     */
    static addTableHeaders(doc, headers, widths, y) {
        doc.fontSize(9).font('Helvetica-Bold');
        let x = 50;

        doc.fillColor('#f0f0f0')
           .rect(50, y, 560, 25)
           .fill();
        
        doc.fillColor('#000000');

        headers.forEach((header, i) => {
            doc.text(header, x, y + 5, {
                width: widths[i],
                align: 'center'
            });
            x += widths[i];
        });
    }

    /**
     * Add footer to document
     */
    static addFooter(doc, surat) {
        const footerTop = 700;
        
        doc.moveDown(2);
        
        // Tanda tangan
        doc.fontSize(10)
           .font('Helvetica')
           .text('Mengetahui,', { align: 'right' });
        
        doc.moveDown(3);
        
        if (surat.creator) {
            doc.text(surat.creator.nama_lengkap, { align: 'right' });
            doc.text(surat.creator.jabatan || '', { align: 'right' });
        }

        // Page number
        doc.fontSize(8)
           .font('Helvetica')
           .text(
               `Dicetak pada: ${DateHelper.formatDateTimeIndonesia(new Date())}`,
               50,
               footerTop,
               { align: 'center' }
           );
    }
}

module.exports = PdfService;
