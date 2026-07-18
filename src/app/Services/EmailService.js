const nodemailer = require('nodemailer');
const mailConfig = require('../../config/mail');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: mailConfig.host,
            port: mailConfig.port,
            secure: mailConfig.secure,
            auth: {
                user: mailConfig.auth.user,
                pass: mailConfig.auth.pass
            }
        });
    }

    /**
     * Send email
     */
    async sendEmail(to, subject, html, attachments = []) {
        try {
            const mailOptions = {
                from: `"${mailConfig.from.name}" <${mailConfig.from.address}>`,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject: subject,
                html: html,
                attachments: attachments
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(user) {
        const subject = 'Selamat Datang di Arsip Surat Digital';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Selamat Datang!</h1>
                    </div>
                    <div class="content">
                        <p>Halo <strong>${user.nama_lengkap}</strong>,</p>
                        <p>Akun Anda telah berhasil dibuat di Sistem Arsip Surat Digital. Berikut adalah detail akun Anda:</p>
                        <ul>
                            <li><strong>Email:</strong> ${user.email}</li>
                            <li><strong>Nama:</strong> ${user.nama_lengkap}</li>
                            ${user.nip ? `<li><strong>NIP:</strong> ${user.nip}</li>` : ''}
                            ${user.jabatan ? `<li><strong>Jabatan:</strong> ${user.jabatan}</li>` : ''}
                        </ul>
                        <p>Silakan login menggunakan email dan password yang telah diberikan.</p>
                        <p>Untuk keamanan, segera ganti password Anda setelah login pertama.</p>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.APP_URL}/login" 
                               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                Login Sekarang
                            </a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Arsip Surat Digital. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(user, token) {
        const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
        const subject = 'Reset Password - Arsip Surat Digital';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Reset Password</h1>
                    </div>
                    <div class="content">
                        <p>Halo <strong>${user.nama_lengkap}</strong>,</p>
                        <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="${resetUrl}" 
                               style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                Reset Password
                            </a>
                        </p>
                        <p>Atau copy link berikut ke browser Anda:</p>
                        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
                        <div class="warning">
                            <strong>Peringatan:</strong> Link ini hanya berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Arsip Surat Digital. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(user.email, subject, html);
    }

    /**
     * Send disposisi notification
     */
    async sendDisposisiNotification(disposisi, userTujuan, suratMasuk) {
        const subject = 'Disposisi Baru - Arsip Surat Digital';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .info-box { background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Disposisi Baru</h1>
                    </div>
                    <div class="content">
                        <p>Halo <strong>${userTujuan.nama_lengkap}</strong>,</p>
                        <p>Anda menerima disposisi baru dengan detail:</p>
                        
                        <div class="info-box">
                            <p><strong>Nomor Surat:</strong> ${suratMasuk.nomor_surat}</p>
                            <p><strong>Pengirim:</strong> ${suratMasuk.pengirim}</p>
                            <p><strong>Perihal:</strong> ${suratMasuk.perihal}</p>
                            <p><strong>Instruksi:</strong> ${disposisi.instruksi}</p>
                            ${disposisi.batas_waktu ? `<p><strong>Batas Waktu:</strong> ${disposisi.batas_waktu}</p>` : ''}
                            ${disposisi.sifat ? `<p><strong>Sifat:</strong> ${disposisi.sifat.toUpperCase()}</p>` : ''}
                        </div>

                        <p style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.APP_URL}/disposisi/${disposisi.id}" 
                               style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                Lihat Disposisi
                            </a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Arsip Surat Digital. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(userTujuan.email, subject, html);
    }

    /**
     * Send notifikasi surat baru
     */
    async sendSuratBaruNotification(surat, tipe, recipients) {
        const subject = `Surat ${tipe === 'masuk' ? 'Masuk' : 'Keluar'} Baru - Arsip Surat Digital`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .info-box { background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Surat ${tipe === 'masuk' ? 'Masuk' : 'Keluar'} Baru</h1>
                    </div>
                    <div class="content">
                        <p>Surat ${tipe} baru telah ditambahkan dengan detail:</p>
                        
                        <div class="info-box">
                            <p><strong>Nomor Surat:</strong> ${surat.nomor_surat}</p>
                            ${tipe === 'masuk' 
                                ? `<p><strong>Pengirim:</strong> ${surat.pengirim}</p>`
                                : `<p><strong>Tujuan:</strong> ${surat.tujuan}</p>`
                            }
                            <p><strong>Tanggal Surat:</strong> ${surat.tanggal_surat}</p>
                            <p><strong>Perihal:</strong> ${surat.perihal}</p>
                            ${surat.isi_ringkas ? `<p><strong>Isi Ringkas:</strong> ${surat.isi_ringkas}</p>` : ''}
                        </div>

                        <p style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.APP_URL}/surat-${tipe}/${surat.id}" 
                               style="background: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                Lihat Surat
                            </a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Arsip Surat Digital. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(recipients, subject, html);
    }

    /**
     * Send notifikasi reminder disposisi
     */
    async sendReminderDisposisi(disposisi, userTujuan, suratMasuk) {
        const subject = 'Pengingat Disposisi - Arsip Surat Digital';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Pengingat Disposisi</h1>
                    </div>
                    <div class="content">
                        <p>Halo <strong>${userTujuan.nama_lengkap}</strong>,</p>
                        <p>Ini adalah pengingat untuk disposisi yang belum diproses:</p>
                        
                        <div class="warning">
                            <p><strong>Perihal Surat:</strong> ${suratMasuk.perihal}</p>
                            <p><strong>Instruksi:</strong> ${disposisi.instruksi}</p>
                            <p><strong>Batas Waktu:</strong> ${disposisi.batas_waktu}</p>
                            <p><strong>Sisa Waktu:</strong> ${this.calculateRemainingDays(disposisi.batas_waktu)} hari</p>
                        </div>

                        <p>Mohon segera diproses sebelum batas waktu berakhir.</p>

                        <p style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.APP_URL}/disposisi/${disposisi.id}" 
                               style="background: #ffc107; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                Proses Disposisi
                            </a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Arsip Surat Digital. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await this.sendEmail(userTujuan.email, subject, html);
    }

    /**
     * Calculate remaining days
     */
    calculateRemainingDays(batasWaktu) {
        const now = new Date();
        const deadline = new Date(batasWaktu);
        const diffTime = deadline - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }
}

module.exports = new EmailService();
