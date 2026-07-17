// auth.js - Authentication Configuration
const AuthConfig = {
    // Token Configuration
    token: {
        key: 'auth_token',
        type: 'Bearer',
        expiry: 86400, // 24 hours in seconds
        refreshBefore: 3600, // Refresh 1 hour before expiry
        issuer: 'arsip-surat-enterprise',
        algorithm: 'HS256'
    },

    // Session Configuration
    session: {
        driver: 'localstorage',
        key: 'user_data',
        lifetime: 86400, // 24 hours
        secure: true,
        httpOnly: true
    },

    // Password Configuration
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        hashAlgorithm: 'sha256',
        salt: 'enterprise_salt_2026'
    },

    // Login Configuration
    login: {
        maxAttempts: 5,
        lockoutDuration: 900, // 15 minutes in seconds
        throttleEnabled: true,
        rememberMeDays: 30
    },

    // Registration Configuration
    registration: {
        enabled: true,
        requireEmailVerification: false,
        defaultRole: 'viewer',
        autoLoginAfterRegister: false
    },

    // Password Reset Configuration
    passwordReset: {
        tokenExpiry: 3600, // 1 hour
        throttleEnabled: true,
        maxRequestsPerHour: 3
    },

    // OAuth Configuration (if needed)
    oauth: {
        enabled: false,
        providers: {
            google: {
                clientId: '',
                clientSecret: '',
                redirectUri: ''
            }
        }
    },

    // Role-Based Access Control
    roles: {
        superadmin: {
            id: 1,
            name: 'Super Admin',
            permissions: ['*']
        },
        admin: {
            id: 2,
            name: 'Administrator',
            permissions: [
                'dashboard.*',
                'surat.*',
                'disposisi.*',
                'laporan.*',
                'pengguna.*',
                'kategori.*',
                'instansi.*',
                'pengaturan.*'
            ]
        },
        operator: {
            id: 3,
            name: 'Operator',
            permissions: [
                'dashboard.view',
                'surat.view',
                'surat.create',
                'surat.edit',
                'disposisi.view',
                'disposisi.create',
                'laporan.view'
            ]
        },
        viewer: {
            id: 4,
            name: 'Viewer',
            permissions: [
                'dashboard.view',
                'surat.view',
                'disposisi.view',
                'laporan.view'
            ]
        }
    },

    // Middleware Configuration
    middleware: {
        auth: {
            enabled: true,
            except: [
                '/login',
                '/register',
                '/forgot-password',
                '/reset-password'
            ]
       
