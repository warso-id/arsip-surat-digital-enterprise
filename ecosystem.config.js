// ==================== PM2 ECOSYSTEM CONFIGURATION ====================
// Arsip Surat Digital Enterprise
// Production process manager

module.exports = {
    apps: [{
        name: 'arsip-surat-digital',
        script: 'src/app.js',
        instances: 'max',
        exec_mode: 'cluster',
        watch: false,
        max_memory_restart: '512M',
        env: {
            NODE_ENV: 'production',
            APP_PORT: 3000,
        },
        env_development: {
            NODE_ENV: 'development',
            APP_DEBUG: 'true',
            APP_PORT: 3000,
        },
        env_staging: {
            NODE_ENV: 'staging',
            APP_DEBUG: 'true',
            APP_PORT: 3001,
        },
        error_file: 'src/storage/logs/pm2-error.log',
        out_file: 'src/storage/logs/pm2-out.log',
        log_file: 'src/storage/logs/pm2-combined.log',
        time: true,
        kill_timeout: 5000,
        listen_timeout: 10000,
        shutdown_with_message: true,
        merge_logs: true,
        max_restarts: 10,
        restart_delay: 4000,
        autorestart: true,
        cron_restart: '0 3 * * *',
        instance_var: 'INSTANCE_ID',
    }],
    deploy: {
        production: {
            user: 'deploy',
            host: 'production-server',
            ref: 'origin/main',
            repo: 'https://github.com/warso-id/arsip-surat-digital-enterprise.git',
            path: '/var/www/arsip-surat',
            'post-deploy': 'npm install && npm run migrate && pm2 reload ecosystem.config.js --env production',
            'pre-setup': 'mkdir -p /var/www/arsip-surat/src/storage/logs',
        },
        staging: {
            user: 'deploy',
            host: 'staging-server',
            ref: 'origin/develop',
            repo: 'https://github.com/warso-id/arsip-surat-digital-enterprise.git',
            path: '/var/www/arsip-surat-staging',
            'post-deploy': 'npm install && npm run migrate && pm2 reload ecosystem.config.js --env staging',
        },
    },
};
