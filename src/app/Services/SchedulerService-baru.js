const cron = require('node-cron');
const BackupService = require('./BackupService');
const Notifikasi = require('../Models/Notifikasi');
const Disposisi = require('../Models/Disposisi');
const Pengguna = require('../Models/Pengguna');
const EmailService = require('./EmailService');
const { Op } = require('sequelize');

class SchedulerService {
    constructor() {
        this.tasks = [];
    }

    /**
     * Start all scheduled tasks
     */
    start() {
        console.log('Starting scheduler service...');
        
        // Daily backup at 2 AM
        this.scheduleDailyBackup();
        
        // Check overdue disposisi every hour
        this.scheduleDisposisiReminder();
        
        // Clean old notifications daily at 3 AM
        this.scheduleCleanNotifications();
        
        // Clean temp files daily at 4 AM
        this.scheduleCleanTempFiles();
        
        // Send daily report every Monday at 8 AM
        this.scheduleWeeklyReport();
        
        console.log(`Scheduler started with ${this.tasks.length} tasks`);
    }

    /**
     * Stop all scheduled tasks
     */
    stop() {
        this.tasks.forEach(task => task.stop());
        console.log('Scheduler stopped');
    }

    /**
     * Schedule daily backup
     */
    scheduleDailyBackup() {
        const task = cron.schedule('0 2 * * *', async () => {
            console.log('Running daily backup...');
            try {
                await BackupService.createFullBackup();
                await BackupService.cleanOldBackups();
                console.log('Daily backup completed');
            } catch (error) {
                console.error('Daily backup failed:', error);
            }
        });
        
        this.tasks.push(task);
    }

    /**
     * Schedule disposisi reminder
     */
    scheduleDisposisiReminder() {
        const task = cron.schedule('0 * * * *', async () => {
            console.log('Checking overdue disposisi...');
            try {
                const overdueDisposisi = await Disposisi.findAll({
                    where: {
                        batas_waktu: {
                            [Op.lt]: new Date()
                        },
                        status: {
                            [Op.notIn]: ['selesai']
                        }
                    },
                    include: [
                        { association: 'kepada_user' },
                        { association: 'surat_masuk' }
                    ]
                });

                for (const disposisi of overdueDisposisi) {
                    // Create notification
                    await Notifikasi.create({
                        user_id: disposisi.kepada_user_id,
                        judul: 'Disposisi Terlambat',
                        pesan: `Disposisi untuk surat "${disposisi.surat_masuk.perihal}" telah melewati batas waktu`,
                        tipe: 'disposisi',
                        referensi_id: disposisi.id
                    });

                    // Send email
                    try {
                        await EmailService.sendReminderDisposisi(
                            disposisi,
                            disposisi.kepada_user,
                            disposisi.surat_masuk
                        );
                    } catch (emailError) {
                        console.error('Error sending reminder email:', emailError);
                    }
                }

                console.log(`Found ${overdueDisposisi.length} overdue disposisi`);
            } catch (error) {
                console.error('Disposisi reminder check failed:', error);
            }
        });

        this.tasks.push(task);
    }

    /**
     * Schedule clean old notifications
     */
    scheduleCleanNotifications() {
        const task = cron.schedule('0 3 * * *', async () => {
            console.log('Cleaning old notifications...');
            try {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const deleted = await Notifikasi.destroy({
                    where: {
                        created_at: {
                            [Op.lt]: thirtyDaysAgo
                        },
                        is_read: true
                    }
                });

                console.log(`Cleaned ${deleted} old notifications`);
            } catch (error) {
                console.error('Clean notifications failed:', error);
            }
        });

        this.tasks.push(task);
    }

    /**
     * Schedule clean temp files
     */
    scheduleCleanTempFiles() {
        const task = cron.schedule('0 4 * * *', async () => {
            console.log('Cleaning temp files...');
            try {
                const FileService = require('./FileService');
                const cleaned = await FileService.cleanTempFiles();
                console.log(`Cleaned ${cleaned} temp files`);
            } catch (error) {
                console.error('Clean temp files failed:', error);
            }
        });

        this.tasks.push(task);
    }

    /**
     * Schedule weekly report
     */
    scheduleWeeklyReport() {
        const task = cron.schedule('0 8 * * 1', async () => {
            console.log('Generating weekly report...');
            try {
                const admins = await Pengguna.findAll({
                    where: {
                        role_id: [1, 2], // superadmin and admin
                        status: 'aktif'
                    }
                });

                // Get weekly statistics
                const SuratService = require('./SuratService');
                const stats = await SuratService.getStatistics();

                for (const admin of admins) {
                    await EmailService.sendEmail(
                        admin.email,
                        'Laporan Mingguan - Arsip Surat Digital',
                        this.generateWeeklyReportHTML(stats)
                    );
                }

                console.log('Weekly report sent');
            } catch (error) {
                console.error('Weekly report failed:', error);
            }
        });

        this.tasks.push(task);
    }

    /**
     * Generate weekly report HTML
     */
    generateWeeklyReportHTML(stats) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; }
                    .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                    .stat-box { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px; }
                    .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Laporan Mingguan</h2>
                        <p>Arsip Surat Digital</p>
                    </div>
                    <div class="content">
                        <h3>Statistik Minggu Ini</h3>
                        <div class="stats">
                            <div class="stat-box">
                                <div class="stat-number">${stats.surat_masuk.total}</div>
                                <div>Surat Masuk</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-number">${stats.surat_keluar.total}</div>
                                <div>Surat Keluar</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-number">${stats.disposisi.total}</div>
                                <div>Disposisi</div>
                            </div>
                        </div>
                        <p>Login ke sistem untuk melihat detail lengkap.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

// Start scheduler if running directly
if (require.main === module) {
    const scheduler = new SchedulerService();
    scheduler.start();
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received. Stopping scheduler...');
        scheduler.stop();
        process.exit(0);
    });
}

module.exports = SchedulerService;
