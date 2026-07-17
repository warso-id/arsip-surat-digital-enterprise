// AdminSeeder.js - Seed Default Admin User
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';

const adminUser = {
    nama: 'Administrator',
    email: 'admin@enterprise.com',
    password: 'admin123', // Will be hashed on server
    role_id: 1, // Super Admin
    jabatan: 'System Administrator',
    telepon: '081234567890',
    status: 'aktif'
};

async function seedAdmin() {
    console.log('Seeding admin user...');

    try {
        const payload = btoa(encodeURIComponent(JSON.stringify({
            action: 'seeder_admin',
            data: adminUser,
            timestamp: Date.now()
        })));

        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload })
        });

        const result = await response.json();
        const data = JSON.parse(decodeURIComponent(atob(result.data)));

        if (data.success) {
            console.log('  ✓ Admin user seeded successfully');
            console.log('  Email: admin@enterprise.com');
            console.log('  Password: admin123');
        } else {
            console.log(`  ⚠ Admin user skipped: ${data.message}`);
        }

    } catch (error) {
        console.error(`  ✗ Admin user seeding failed: ${error.message}`);
    }
}

seedAdmin().catch(console.error);
