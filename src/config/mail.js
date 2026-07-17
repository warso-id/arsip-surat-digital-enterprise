// mail.js - Email Configuration
const MailConfig = {
    // Default mail driver
    driver: 'smtp', // smtp, sendgrid, mailgun, ses
    
    // SMTP Configuration
    smtp: {
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.MAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.MAIL_USERNAME || '',
            pass: process.env.MAIL_PASSWORD || ''
        },
        tls: {
            rejectUnauthorized: false
        }
    },
    
    // SendGrid Configuration
    sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY || '',
        from: {
            email: process.env.MAIL_FROM_ADDRESS || 'noreply@arsip-surat.example.com',
            name: process.env.MAIL_FROM_NAME || 'Arsip Surat Digital Enterprise'
        }
    },
    
    // Default sender
    from: {
        address: process.env.MAIL_FROM_ADDRESS || 'noreply@arsip-surat.example.com',
        name: process.env.MAIL_FROM_NAME || 'Arsip Surat Digital Enterprise'
    },
    
    // Reply to
    replyTo: {
        address: process.env.MAIL_REPLY_TO || 'support@arsip-surat.example.com',
        name: 'Support Arsip Surat'
    },
    
    // Email templates
    templates: {
        welcome: {
            subject: 'Selamat Datang di Arsip Surat Digital Enterprise',
            template: 'welcome'
        },
        resetPassword: {
            subject: 'Reset Password - Arsip Surat Digital Enterprise',
            template: 'reset-password'
        },
        disposisiNotification: {
            subject: 'Notifikasi Disposisi Baru',
            template: 'notifikasi-disposisi'
        },
        statusUpdate: {
            subject: 'Update Status Disposisi',
            template: 'status-update'
        },
        reminder: {
            subject: 'Pengingat Disposisi',
            template: 'reminder'
        },
        report: {
            subject: 'Laporan Periodik',
            template: 'report'
        }
    },
    
    // Queue configuration
    queue: {
        enabled: true,
        driver: 'sync', // sync, database, redis
        retryAfter: 60, // seconds
        maxAttempts: 3
    },
    
    // Rate limiting
    rateLimit: {
        enabled: true,
        maxPerHour: 50
    },
    
    // Logging
    log: {
        enabled: true,
        channel: 'email'
    },
    
    // Test mode
    testMode: false,
    testEmail: 'test@arsip-surat.example.com'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MailConfig;
}
