module.exports = {
    apps: [
        {
            name: 'arsip-surat',
            script: './src/app.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'development',
                APP_PORT: 3000
            },
            env_production: {
                NODE_ENV: 'production',
                APP_PORT: 3000
            },
            watch: false,
            max_memory_restart: '500M',
            error_file: './storage/logs/err.log',
            out_file: './storage/logs/out.log',
            log_file: './storage/logs/combined.log',
            time: true,
            kill_timeout: 5000,
            restart_delay: 4000,
            max_restarts: 10,
            min_uptime: '10s'
        },
        {
            name: 'arsip-surat-queue',
            script: './src/app/Services/QueueService.js',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './storage/logs/queue-err.log',
            out_file: './storage/logs/queue-out.log',
            time: true
        },
        {
            name: 'arsip-surat-scheduler',
            script: './src/app/Services/SchedulerService.js',
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production'
            },
            error_file: './storage/logs/scheduler-err.log',
            out_file: './storage/logs/scheduler-out.log',
            time: true
        }
    ]
};
