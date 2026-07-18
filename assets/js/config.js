// Enterprise Configuration - Fix v2026.7.18
(function() {
    'use strict';

    // Enterprise Configuration
    window.ENTERPRISE_CONFIG = {
        version: '2026.1.0',
        appName: 'Arsip Surat Digital Enterprise',
        apiBaseUrl: 'https://api.enterprise.local',
        debug: true,
        theme: {
            primaryColor: '#296Fe0',
            secondaryColor: '#17a2b7',
            successColor: '#28a745',
            errorColor: '#dc3545'
        },
        features: {
            enableOffline: true,
            enableNotifications: true,
            enableDarkMode: false
        },
        pagination: {
            defaultPageSize: 10
        }
    };

    // Logging utility
    window.enterpriseLog = function(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}]`;
        
        switch(level) {
            case 'error':
                console.error(prefix, message);
                break;
            case 'warn':
                console.warn(prefix, message);
                break;
            case 'debug':
                if (window.ENTERPRISE_CONFIG.debug) {
                    console.log(prefix, message);
                }
                break;
            default:
                console.log(prefix, message);
        }
    };

    // Load enterprise configuration
    console.log('Enterprise Config loaded - Version: ' + window.ENTERPRISE_CONFIG.version);
    
    // Log API initialized
    window.enterpriseLog('Enterprise API initialized');
})();
