const Surat = require('../models/Surat');
const Disposisi = require('../models/Disposisi');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');

class LaporanController {
  // GET /laporan/surat-masuk
  static async laporanSuratMasuk(req, res) {
    try {
      const { tanggal_mulai, tanggal_akhir, kategori_id, format } = req.query;
      
      const filters = { tanggal_mulai, tanggal_akhir, kategori_id };
      const suratMasuk = await Surat.getSuratMasuk(1, 1000, filters);

      if (format === 'pdf') {
        return LaporanController.generatePDF('Surat Masuk', suratMasuk.results, res);
      } else if (format === 'excel') {
        return LaporanController.generateExcel('Surat Masuk', suratMasuk.results, res);
      }

      return res.json({
        success: true,
        data: suratMasuk.results,
        total: suratMasuk.total
      });
    } catch (error) {
      console.error('Error in laporanSuratMasuk:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal generate laporan surat masuk'
      });
    }
  }

  // GET /laporan/surat-keluar
  static async laporanSuratKeluar(req, res) {
    try {
      const { tanggal_mulai, tanggal_akhir, kategori_id, format } = req.query;
      
      const filters = { tanggal_mulai, tanggal_akhir, kategori_id };
      const suratKeluar = await Surat.getSuratKeluar(1, 1000, filters);

      if (format === 'pdf') {
        return LaporanController.generatePDF('Surat Keluar', suratKeluar.results, res);
      } else if (format === 'excel') {
        return LaporanController.generateExcel('Surat Keluar', suratKeluar.results, res);
      }

      return res.json({
        success: true,
        data: suratKeluar.results,
        total: suratKeluar.total
      });
    } catch (error) {
      console.error('Error in laporanSuratKeluar:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal generate laporan surat keluar'
      });
    }
  }

  // GET /laporan/disposisi
  static async laporanDisposisi(req, res) {
    try {
      const { tanggal_mulai, tanggal_akhir, status } = req.query;
      
      const query = Disposisi.query()
        .withGraphFetched('[surat, dari_user, tujuan_user]')
        .orderBy('created_at', 'desc');

      if (tanggal_mulai) {
        query.where('tanggal_disposisi', '>=', tanggal_mulai);
      }
      if (tanggal_akhir) {
        query.where('tanggal_disposisi', '<=', tanggal_akhir);
      }
      if (status) {
        query.where('status', status);
      }

      const disposisi = await query;

      return res.json({
        success: true,
        data: disposisi,
        total: disposisi.length
      });
    } catch (error) {
      console.error('Error in laporanDisposisi:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal generate laporan disposisi'
      });
    }
  }

  // GET /laporan/statistik
  static async laporanStatistik(req, res) {
    try {
      const tahun = req.query.tahun || new Date().getFullYear();
      const statistik = await Surat.getStatistik(tahun);

      return res.json({
        success: true,
        data: statistik
      });
    } catch (error) {
      console.error('Error in laporanStatistik:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal generate laporan statistik'
      });
    }
  }

  // PDF Generator
  static async generatePDF(title, data, res) {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=laporan-${title.toLowerCase().replace(' ', '-')}.pdf`);
      
      doc.pipe(res);

      // Header
      doc.fontSize(16).text(`LAPORAN ${title.toUpperCase()}`, { align: 'center' });
      doc.fontSize(10).text(`Tanggal Cetak: ${moment().format('DD MMMM YYYY HH:mm')}`, { align: 'center' });
      doc.moveDown();

      // Table Header
      const tableTop = doc.y;
      const headers = ['No', 'No. Surat', 'Tanggal', 'Perihal', 'Pengirim/Penerima', 'Status'];
      const columnWidths = [30, 100, 70, 150, 120, 80];
      
      let xPosition = 30;
      doc.fontSize(8).font('Helvetica-Bold');
      headers.forEach((header, i) => {
        doc.text(header, xPosition, tableTop, { width: columnWidths[i], align: 'left' });
        xPosition += columnWidths[i];
      });

      // Table Content
      doc.font('Helvetica');
      let yPosition = tableTop + 20;

      data.forEach((item, index) => {
        if (yPosition > 750) {
          doc.addPage();
          yPosition = 30;
        }

        xPosition = 30;
        const row = [
          (index + 1).toString(),
          item.nomor_surat,
          moment(item.tanggal_surat).format('DD/MM/YYYY'),
          item.perihal.substring(0, 50),
          item.pengirim || item.penerima || '-',
          item.status
        ];

        row.forEach((cell, i) => {
          doc.text(cell, xPosition, yPosition, { width: columnWidths[i], align: 'left' });
          xPosition += columnWidths[i];
        });

        yPosition += 20;
      });

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).text(`Total: ${data.length} surat`, { align: 'right' });

      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  // Excel Generator
  static async generateExcel(title, data, res) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(title);

      // Headers
      worksheet.columns = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'No. Surat', key: 'nomor_surat', width: 25 },
        { header: 'No. Agenda', key: 'nomor_agenda', width: 20 },
        { header: 'Tanggal Surat', key: 'tanggal_surat', width: 15 },
        { header: 'Perihal', key: 'perihal', width: 40 },
        { header: 'Pengirim/Penerima', key: 'pihak', width: 30 },
        { header: 'Kategori', key: 'kategori', width: 20 },
        { header: 'Status', key: 'status', width: 15 }
      ];

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A56DB' }
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };

      // Data
      data.forEach((item, index) => {
        worksheet.addRow({
          no: index + 1,
          nomor_surat: item.nomor_surat,
          nomor_agenda: item.nomor_agenda || '-',
          tanggal_surat: moment(item.tanggal_surat).format('DD/MM/YYYY'),
          perihal: item.perihal,
          pihak: item.pengirim || item.penerima || '-',
          kategori: item.kategori?.nama || '-',
          status: item.status
        });
      });

      // Auto filter
      worksheet.autoFilter = {
        from: 'A1',
        to: `H${data.length + 1}`
      };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=laporan-${title.toLowerCase().replace(' ', '-')}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw error;
    }
  }
}

module.exports = LaporanController;
