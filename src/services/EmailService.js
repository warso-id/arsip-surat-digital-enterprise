// ==================== EMAIL SERVICE ====================
// Arsip Surat Digital Enterprise
// Email notification service

const nodemailer = require('nodemailer');
const config = require('../config/app');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
    }

    /**
     * Initialize email transporter
     */
    async initialize() {
        try {
            if (config.mail.driver === 'smtp') {
                this.transporter = nodemailer.createTransport({
                    host: config.mail.smtp.host,
                    port: config.mail.smtp.port,
                    secure: config.mail.smtp.secure,
                    auth: {
                        user: config.mail.smtp.auth.user,
                        pass: config.mail.smtp.auth.pass,
                    },
                });
                
                // Verify connection
                await this.transporter.verify();
                this.initialized = true;
                console.log('Email service initialized');
            }
        } catch (error) {
            console.error('Email service initialization failed:', error.message);
        }
    }

    /**
     * Send email
     */
    async send(options) {
        if (!this.initialized) {
            console.log('Email not sent - service not initialized');
            return false;
        }

        try {
            const mailOptions = {
                from: `"${config.mail.from.name}" <${config.mail.from.address}>`,
                to: options.to,
                subject: options.subject,
                html: options.html || options.text,
                attachments: options.attachments || [],
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return true;
        } catch (error) {
            console.error('Email send error:', error.message);
            return false;
        }
    }

    /**
     * Send welcome email
     */
    async sendWelcome(user) {
        return this.send({
            to: user.email,
            subject: `Selamat Datang di ${config.app.name}`,
            html: this.getTemplate('welcome', {
                name: user.fullname,
                username: user.username,
                loginUrl: `${config.app.url}/login`,
            }),
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(user, resetToken) {
        const resetUrl = `${config.app.url}/auth/reset-password?token=${resetToken}`;
        
        return this.send({
            to: user.email,
            subject: 'Reset Password - ' + config.app.name,
            html: this.getTemplate('reset-password', {
                name: user.fullname,
                resetUrl: resetUrl,
                expiresIn: '1 jam',
            }),
        });
    }

    /**
     * Send disposisi notification
     */
    async sendDisposisiNotification(user, disposisi) {
        return this.send({
            to: user.email,
            subject: `Disposisi Baru - ${disposisi.surat_perihal}`,
            html: this.getTemplate('disposisi', {
                name: user.fullname,
                dari: disposisi.dari_nama,
                perihal: disposisi.surat_perihal,
                isi: disposisi.isi_disposisi,
                batasWaktu: disposisi.batas_waktu || 'Tidak ada',
                detailUrl: `${config.app.url}/disposisi/${disposisi.id}`,
            }),
        });
    }

    /**
     * Send surat masuk notification
     */
    async sendSuratMasukNotification(recipients, surat) {
        for (const user of recipients) {
            await this.send({
                to: user.email,
                subject: `Surat Masuk Baru - ${surat.nomor_agenda}`,
                html: this.getTemplate('surat-masuk', {
                    name: user.fullname,
                    nomorAgenda: surat.nomor_agenda,
                    pengirim: surat.pengirim,
                    perihal: surat.perihal,
                    detailUrl: `${config.app.url}/surat-masuk/${surat.id}`,
                }),
            });
        }
    }

    /**
     * Send report email
     */
    async sendReport(user, reportUrl, reportType) {
        return this.send({
            to: user.email,
            subject: `Laporan ${reportType} - ${config.app.name}`,
            html: this.getTemplate('report', {
                name: user.fullname,
                reportType: reportType,
                reportUrl: reportUrl,
                generatedAt: new Date().toLocaleString('id-ID'),
            }),
        });
    }

    /**
     * Get email template
     */
    getTemplate(templateName, data) {
        const templates = {
            'welcome': `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1a56db; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">${config.app.name}</h1>
                    </div>
                    <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
                        <h2>Selamat Datang, ${data.name}!</h2>
                        <p>Akun Anda telah berhasil dibuat. Berikut adalah informasi login Anda:</p>
                        <p><strong>Username:</strong> ${data.username}</p>
                        <p>Silakan login di: <a href="${data.loginUrl}">${data.loginUrl}</a></p>
                        <p>Jangan lupa untuk mengubah password Anda setelah login pertama.</p>
                    </div>
                </div>
            `,
            'reset-password': `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2>Reset Password</h2>
                    <p>Halo ${data.name},</p>
                    <p>Anda telah meminta reset password. Klik link berikut untuk melanjutkan:</p>
                    <p><a href="${data.resetUrl}">Reset Password</a></p>
                    <p>Link ini berlaku selama ${data.expiresIn}.</p>
                    <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
                </div>
            `,
            'disposisi': `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2>Disposisi Baru</h2>
                    <p>Halo ${data.name},</p>
                    <p>Anda menerima disposisi baru:</p>
                    <p><strong>Dari:</strong> ${data.dari}</p>
                    <p><strong>Perihal:</strong> ${data.perihal}</p>
                    <p><strong>Isi:</strong> ${data.isi}</p>
                    <p><strong>Batas Waktu:</strong> ${data.batasWaktu}</p>
                    <p><a href="${data.detailUrl}">Lihat Detail</a></p>
                </div>
            `,
            'surat-masuk': `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2>Surat Masuk Baru</h2>
                    <p>Halo ${data.name},</p>
                    <p>Surat masuk baru telah diterima:</p>
                    <p><strong>No. Agenda:</strong> ${data.nomorAgenda}</p>
                    <p><strong>Pengirim:</strong> ${data.pengirim}</p>
                    <p><strong>Perihal:</strong> ${data.perihal}</p>
                    <p><a href="${data.detailUrl}">Lihat Detail</a></p>
                </div>
            `,
            'report': `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2>Laporan ${data.reportType}</h2>
                    <p>Halo ${data.name},</p>
                    <p>Laporan ${data.reportType} telah selesai dibuat.</p>
                    <p>Tanggal: ${data.generatedAt}</p>
                    <p><a href="${data.reportUrl}">Download Laporan</a></p>
                </div>
            `,
        };

        return templates[templateName] || '';
    }
}

module.exports = new EmailService();
