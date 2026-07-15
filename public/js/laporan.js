// Laporan JavaScript

// Generate report
async function generateReport(type, format) {
    try {
        const token = localStorage.getItem('accessToken');
        let url = `/api/laporan/${type}?format=${format}`;
        
        // Add filters based on report type
        if (type === 'surat-masuk') {
            const periode = document.getElementById('periodeMasuk')?.value;
            if (periode === 'custom') {
                const mulai = document.getElementById('tglMulaiMasuk')?.value;
                const akhir = document.getElementById('tglAkhirMasuk')?.value;
                if (mulai) url += `&tanggal_mulai=${mulai}`;
                if (akhir) url += `&tanggal_akhir=${akhir}`;
            }
        } else if (type === 'surat-keluar') {
            const periode = document.getElementById('periodeKeluar')?.value;
            if (periode === 'custom') {
                // Similar to surat masuk
            }
        } else if (type === 'disposisi') {
            const status = document.getElementById('statusDisposisi')?.value;
            if (status) url += `&status=${status}`;
        } else if (type === 'statistik') {
            const tahun = document.getElementById('tahunStatistik')?.value;
            if (tahun) url += `&tahun=${tahun}`;
        }
        
        if (format === 'pdf' || format === 'excel') {
            // Download file
            window.open(url, '_blank');
        } else {
            // View in preview
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                showPreview(data.data, type);
            }
        }
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Gagal generate laporan');
    }
}

// Show preview
function showPreview(data, type) {
    const preview = document.getElementById('reportPreview');
    const table = document.getElementById('reportTable');
    const total = document.getElementById('reportTotal');
    
    preview.style.display = 'block';
    
    // Build table headers based on type
    let headers = [];
    if (type === 'surat-masuk') {
        headers = ['No', 'No. Surat', 'Tanggal', 'Pengirim', 'Perihal', 'Status'];
    } else if (type === 'surat-keluar') {
        headers = ['No', 'No. Surat', 'Tanggal', 'Penerima', 'Perihal', 'Status'];
    } else if (type === 'disposisi') {
        headers = ['No', 'Surat', 'Dari', 'Tujuan', 'Instruksi', 'Status'];
    }
    
    table.querySelector('thead').innerHTML = `
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    `;
    
    if (data && data.length > 0) {
        table.querySelector('tbody').innerHTML = data.map((item, i) => {
            if (type === 'surat-masuk') {
                return `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${item.nomor_surat}</td>
                        <td>${formatDate(item.tanggal_surat)}</td>
                        <td>${item.pengirim}</td>
                        <td>${item.perihal?.substring(0, 50)}</td>
                        <td>${item.status}</td>
                    </tr>
                `;
            }
            // Add other types...
            return '';
        }).join('');
        
        total.textContent = `Total: ${data.length} data`;
    } else {
        table.querySelector('tbody').innerHTML = 
            '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>';
        total.textContent = 'Total: 0 data';
    }
    
    preview.scrollIntoView({ behavior: 'smooth' });
}

// Close preview
function closePreview() {
    document.getElementById('reportPreview').style.display = 'none';
}

// Toggle custom date
document.getElementById('periodeMasuk')?.addEventListener('change', function() {
    const customDate = document.querySelector('.custom-date');
    if (this.value === 'custom') {
        customDate.style.display = 'flex';
    } else {
        customDate.style.display = 'none';
    }
});

// Format date helper
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}
