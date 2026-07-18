const { sequelize } = require('../../config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    try {
        console.log('Starting database migrations...');
        
        // Get all migration files
        const migrationsDir = path.join(__dirname);
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.match(/^\d+_/))
            .sort();

        console.log(`Found ${files.length} migration files`);

        // Create migrations table if not exists
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                migration VARCHAR(255) NOT NULL,
                batch INT NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Get executed migrations
        const [executed] = await sequelize.query('SELECT migration FROM migrations');
        const executedMigrations = executed.map(row => row.migration);

        let batch = 1;
        const [lastBatch] = await sequelize.query('SELECT MAX(batch) as max_batch FROM migrations');
        if (lastBatch[0].max_batch) {
            batch = lastBatch[0].max_batch + 1;
        }

        // Run pending migrations
        for (const file of files) {
            if (!executedMigrations.includes(file)) {
                console.log(`Running migration: ${file}`);
                
                const migration = require(path.join(migrationsDir, file));
                
                try {
                    await migration.up(sequelize);
                    await sequelize.query('INSERT INTO migrations (migration, batch) VALUES (?, ?)', {
                        replacements: [file, batch]
                    });
                    console.log(`✓ Migration ${file} completed`);
                } catch (error) {
                    console.error(`✗ Migration ${file} failed:`, error.message);
                    throw error;
                }
            }
        }

        console.log('All migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run migrations
runMigrations();
