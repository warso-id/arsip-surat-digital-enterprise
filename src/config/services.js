// services.js - External Services Configuration
const ServicesConfig = {
    // Google Apps Script
    gas: {
        url: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
        timeout: 30000,
        retries: 3,
        encoding: 'base64',
        version: '2026.1'
    },
    
    // Google APIs
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
        apiKey: process.env.GOOGLE_API_KEY || '',
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/gmail.send'
        ]
    },
    
    // Email services
    mailgun: {
        domain: process.env.MAILGUN_DOMAIN || '',
        secret: process.env.MAILGUN_SECRET || '',
        endpoint: process.env.MAILGUN_ENDPOINT || 'api.mailgun.net'
    },
    
    sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY || ''
    },
    
    ses: {
        key: process.env.AWS_SES_KEY || '',
        secret: process.env.AWS_SES_SECRET || '',
        region: process.env.AWS_SES_REGION || 'us-east-1'
    },
    
    // SMS/WhatsApp
    twilio: {
        sid: process.env.TWILIO_SID || '',
        token: process.env.TWILIO_TOKEN || '',
        from: process.env.TWILIO_FROM || ''
    },
    
    // Push notifications
    onesignal: {
        appId: process.env.ONESIGNAL_APP_ID || '',
        apiKey: process.env.ONESIGNAL_API_KEY || ''
    },
    
    firebase: {
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || '',
        measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
    },
    
    // Monitoring & Analytics
    sentry: {
        dsn: process.env.SENTRY_DSN || '',
        environment: process.env.APP_ENV || 'production',
        tracesSampleRate: 1.0
    },
    
    googleAnalytics: {
        trackingId: process.env.GA_TRACKING_ID || ''
    },
    
    // Cache
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        password: process.env.REDIS_PASSWORD || null,
        port: parseInt(process.env.REDIS_PORT) || 6379,
        database: 0,
        prefix: 'arsip_surat:'
    },
    
    // CDN
    cloudflare: {
        zoneId: process.env.CLOUDFLARE_ZONE_ID || '',
        apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
        email: process.env.CLOUDFLARE_EMAIL || ''
    },
    
    // Payment (if needed)
    midtrans: {
        serverKey: process.env.MIDTRANS_SERVER_KEY || '',
        clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
        isProduction: false
    },
    
    // OCR Service
    ocr: {
        apiKey: process.env.OCR_API_KEY || '',
        endpoint: process.env.OCR_ENDPOINT || ''
    },
    
    // Digital Signature
    docusign: {
        integratorKey: process.env.DOCUSIGN_INTEGRATOR_KEY || '',
        userId: process.env.DOCUSIGN_USER_ID || '',
        authServer: process.env.DOCUSIGN_AUTH_SERVER || '',
        baseUrl: process.env.DOCUSIGN_BASE_URL || ''
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServicesConfig;
}
