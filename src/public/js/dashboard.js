/**
 * DASHBOARD.JS - Dashboard Scripts
 * Arsip Surat Digital Enterprise v2.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

async function initDashboard() {
    await loadUserInfo();
    await loadDashboardStats();
    await loadRecentSurat();
    initCharts();
    setupSidebar();
}

// ==================== USER INFO ====================
async function loadUserInfo() {
    try {
        const response = await apiRequest('/auth/profile');
        if (response.ok) {
            const data = await response.json();
            const user = data.data;
            
            // Update UI
            const userNameEl = document.getElementById('userName');
            const userRoleEl = document.getElementById('userRole');
            const greetingEl = document.getElementById('greetingName');
            
            if (userNameEl) userNameEl.textContent = user.nama_lengkap;
            if (userRoleEl) userRoleEl.textContent = user.role?.nama || 'User';
            if (greetingEl) greetingEl.textContent = user.nama_lengkap;
            
            // Update user avatar initial
            const avatarEl = document.querySelector('.user-avatar');
            if (avatarEl && user.nama_lengkap) {
                avatarEl.textContent = user.nama_lengkap.charAt(0).toUpperCase();
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// ==================== DASHBOARD STATS ====================
async function loadDashboardStats() {
    try {
        const response = await apiRequest('/laporan/statistik?tahun=' + new Date().getFullYear());
        if (response.ok) {
            const data = await response.json();
            updateStatsUI(data.data);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStatsUI(stats) {
    // Update stat cards
    const elements = {
        totalSuratMasuk: stats?.total_surat_masuk?.[0]?.['count(*)'] || 0,
        totalSuratKeluar: stats?.total_surat_keluar?.[0]?.['count(*)'] || 0,
        totalDisposisi: stats?.total_disposisi || 0,
        totalArsip: stats?.total_arsip || 0
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            animateNumber(el, 0, value, 1500);
        }
    });
    
    // Update notification badges
    document.getElementById('suratMasukCount')?.textContent = elements.totalSuratMasuk;
    document.getElementById('disposisiPending')?.textContent = elements.totalDisposisi;
    document.getElementById('notifCount')?.textContent = elements.totalDisposisi;
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(start + (end - start) * progress);
        
        element.textContent = current.toLocaleString('id-ID');
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ==================== CHARTS ====================
function initCharts() {
    initSuratBulananChart();
    initKategoriChart();
}

function initSuratBulananChart() {
    const canvas = document.getElementById('chartSuratBulanan');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
            datasets: [
                {
                    label: 'Surat Masuk',
                    data: [15, 20, 18, 25, 22, 30, 28, 35, 32, 28, 25, 30],
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Surat Keluar',
                    data: [10, 15, 12, 18, 16, 20, 22, 25, 20, 18, 15, 20],
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5
                    }
                }
            }
        }
    });
}

function initKategoriChart() {
    const canvas = document.getElementById('chartKategori');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Surat Keputusan', 'Surat Edaran', 'Surat Tugas', 'Nota Dinas', 'Lainnya'],
            datasets: [{
                data: [35, 25, 20, 15, 5],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(107, 114, 128, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ==================== RECENT SURAT ====================
async function loadRecentSurat() {
    try {
        const response = await apiRequest('/surat-masuk?limit=5');
        if (response.ok) {
            const data = await response.json();
            renderRecentSurat(data.data);
        }
    } catch (error) {
        console.error('Error loading recent surat:', error);
    }
}

function renderRecentSurat(data) {
    const tbody = document.getElementById('recentSuratTable');
    if (!tbody) return;
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada surat</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(surat => `
        <tr>
            <td>${surat.nomor_surat}</td>
            <td>${formatDate(surat.tanggal_surat)}</td>
            <td>${truncateText(surat.perihal, 40)}</td>
            <td><span class="badge ${surat.jenis_surat === 'masuk' ? 'badge-primary' : 'badge-success'}">${surat.jenis_surat}</span></td>
            <td><span class="badge badge-${surat.status === 'selesai' ? 'success' : 'warning'}">${surat.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewSurat(${surat.id})" title="Detail">👁️</button>
            </td>
        </tr>
    `).join('');
}

// ==================== SIDEBAR ====================
function setupSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

// ==================== NAVIGATION ====================
function viewSurat(id) {
    window.location.href = `/surat-masuk/${id}`;
}

function navigateTo(url) {
    window.location.href = url;
}
