// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    await loadDashboardStats();
    await loadCharts();
    await loadRecentSurat();
    setupSidebar();
    setupGlobalSearch();
});

// Load user info
async function loadUserInfo() {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('userName').textContent = data.data.nama_lengkap;
            document.getElementById('userRole').textContent = data.data.role?.nama || '-';
            document.getElementById('greetingName').textContent = data.data.nama_lengkap;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/laporan/statistik', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const stats = data.data;
            
            document.getElementById('totalSuratMasuk').textContent = 
                stats.total_surat_masuk?.[0]?.['count(*)'] || 0;
            document.getElementById('totalSuratKeluar').textContent = 
                stats.total_surat_keluar?.[0]?.['count(*)'] || 0;
            document.getElementById('totalDisposisi').textContent = '0'; // Update with API
            document.getElementById('totalArsip').textContent = '0'; // Update with API
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load charts
async function loadCharts() {
    // Surat Bulanan Chart
    const ctxBulanan = document.getElementById('chartSuratBulanan').getContext('2d');
    new Chart(ctxBulanan, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
            datasets: [
                {
                    label: 'Surat Masuk',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                },
                {
                    label: 'Surat Keluar',
                    data: [8, 15, 5, 7, 4, 6],
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // Kategori Chart
    const ctxKategori = document.getElementById('chartKategori').getContext('2d');
    new Chart(ctxKategori, {
        type: 'doughnut',
        data: {
            labels: ['Surat Keputusan', 'Surat Edaran', 'Surat Tugas', 'Nota Dinas', 'Lainnya'],
            datasets: [{
                data: [30, 20, 25, 15, 10],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(107, 114, 128, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Load recent surat
async function loadRecentSurat() {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/surat-masuk?limit=5', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const tbody = document.getElementById('recentSuratTable');
            
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada surat</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.data.map(surat => `
                <tr>
                    <td>${surat.nomor_surat}</td>
                    <td>${formatDate(surat.tanggal_surat)}</td>
                    <td>${surat.perihal.substring(0, 50)}...</td>
                    <td><span class="status-badge status-${surat.jenis_surat}">${surat.jenis_surat}</span></td>
                    <td><span class="status-badge status-${surat.status}">${surat.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="viewSurat(${surat.id})">👁️</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent surat:', error);
    }
}

// Setup sidebar toggle
function setupSidebar() {
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
}

// Setup global search
function setupGlobalSearch() {
    document.getElementById('globalSearch')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                window.location.href = `/surat-masuk?search=${encodeURIComponent(query)}`;
            }
        }
    });
}

// Logout function
async function logout() {
    try {
        const token = localStorage.getItem('accessToken');
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.clear();
        window.location.href = '/login';
    }
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function viewSurat(id) {
    window.location.href = `/surat-masuk/${id}`;
}
