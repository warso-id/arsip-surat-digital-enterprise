// Surat Masuk JavaScript
let currentPage = 1;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', async () => {
    await loadKategori();
    await loadSuratMasuk();
    setupForm();
});

// Load surat masuk data
async function loadSuratMasuk(page = 1) {
    try {
        const token = localStorage.getItem('accessToken');
        const filters = {
            page,
            limit: 10,
            tanggal_mulai: document.getElementById('filterTanggalMulai')?.value,
            tanggal_akhir: document.getElementById('filterTanggalAkhir')?.value,
            kategori_id: document.getElementById('filterKategori')?.value,
            status: document.getElementById('filterStatus')?.value,
            search: document.getElementById('filterSearch')?.value
        };

        const params = new URLSearchParams(
            Object.entries(filters).filter(([_, v]) => v != null && v !== '')
        );

        const response = await fetch(`/api/surat-masuk?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            currentPage = data.pagination.page;
            totalPages = data.pagination.totalPages;
            
            renderTable(data.data);
            updatePagination();
        }
    } catch (error) {
        console.error('Error loading surat masuk:', error);
        alert('Gagal memuat data surat masuk');
    }
}

// Render table
function renderTable(data) {
    const tbody = document.getElementById('suratMasukTable');
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data surat masuk</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(surat => `
        <tr>
            <td>${surat.nomor_agenda || '-'}</td>
            <td>${surat.nomor_surat}</td>
            <td>${formatDate(surat.tanggal_surat)}</td>
            <td>${surat.tanggal_terima ? formatDate(surat.tanggal_terima) : '-'}</td>
            <td>${surat.pengirim}</td>
            <td>${surat.perihal.substring(0, 50)}${surat.perihal.length > 50 ? '...' : ''}</td>
            <td>${surat.kategori?.nama || '-'}</td>
            <td><span class="status-badge status-${surat.status}">${surat.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="showDetail(${surat.id})" title="Detail">👁️</button>
                <button class="btn btn-sm btn-outline" onclick="editSurat(${surat.id})" title="Edit">✏️</button>
                <button class="btn btn-sm btn-outline" onclick="deleteSurat(${surat.id})" title="Hapus">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Load kategori for filter
async function loadKategori() {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/kategori', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('filterKategori');
            const formSelect = document.getElementById('kategori');
            
            data.data.forEach(kat => {
                const option = `<option value="${kat.id}">${kat.nama}</option>`;
                select.innerHTML += option;
                if (formSelect) formSelect.innerHTML += option;
            });
        }
    } catch (error) {
        console.error('Error loading kategori:', error);
    }
}

// Show detail modal
async function showDetail(id) {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/surat/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const surat = data.data;
            
            document.getElementById('detailContent').innerHTML = `
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Nomor Agenda</label>
                        <p>${surat.nomor_agenda || '-'}</p>
                    </div>
                    <div class="detail-item">
                        <label>Nomor Surat</label>
                        <p>${surat.nomor_surat}</p>
                    </div>
                    <div class="detail-item">
                        <label>Tanggal Surat</label>
                        <p>${formatDate(surat.tanggal_surat)}</p>
                    </div>
                    <div class="detail-item">
                        <label>Tanggal Terima</label>
                        <p>${surat.tanggal_terima ? formatDate(surat.tanggal_terima) : '-'}</p>
                    </div>
                    <div class="detail-item">
                        <label>Pengirim</label>
                        <p>${surat.pengirim}</p>
                    </div>
                    <div class="detail-item">
                        <label>Perihal</label>
                        <p>${surat.perihal}</p>
                    </div>
                    <div class="detail-item">
                        <label>Kategori</label>
                        <p>${surat.kategori?.nama || '-'}</p>
                    </div>
                    <div class="detail-item">
                        <label>Sifat Surat</label>
                        <p><span class="badge">${surat.sifat_surat}</span></p>
                    </div>
                    <div class="detail-item">
                        <label>Status</label>
                        <p><span class="status-badge status-${surat.status}">${surat.status}</span></p>
                    </div>
                    <div class="detail-item full-width">
                        <label>Isi Ringkasan</label>
                        <p>${surat.isi_ringkasan || 'Tidak ada ringkasan'}</p>
                    </div>
                    ${surat.file_path ? `
                    <div class="detail-item full-width">
                        <label>File Surat</label>
                        <a href="/${surat.file_path}" target="_blank" class="btn btn-sm btn-primary">
                            📄 Download File
                        </a>
                    </div>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('detailModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading detail:', error);
        alert('Gagal memuat detail surat');
    }
}

// Show create modal
function showCreateModal() {
    document.getElementById('formTitle').textContent = 'Tambah Surat Masuk';
    document.getElementById('suratId').value = '';
    document.getElementById('suratForm').reset();
    document.getElementById('formModal').classList.add('show');
}

// Edit surat
async function editSurat(id) {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/surat/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const surat = data.data;
            
            document.getElementById('formTitle').textContent = 'Edit Surat Masuk';
            document.getElementById('suratId').value = surat.id;
            document.getElementById('nomorSurat').value = surat.nomor_surat;
            document.getElementById('tanggalSurat').value = surat.tanggal_surat;
            document.getElementById('tanggalTerima').value = surat.tanggal_terima || '';
            document.getElementById('kategori').value = surat.kategori_id || '';
            document.getElementById('pengirim').value = surat.pengirim;
            document.getElementById('perihal').value = surat.perihal;
            document.getElementById('isiRingkasan').value = surat.isi_ringkasan || '';
            document.getElementById('sifatSurat').value = surat.sifat_surat;
            
            document.getElementById('formModal').classList.add('show');
        }
    } catch (error) {
        console.error('Error loading surat for edit:', error);
        alert('Gagal memuat data surat');
    }
}

// Delete surat
async function deleteSurat(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) return;
    
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/surat/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Surat berhasil dihapus');
            loadSuratMasuk(currentPage);
        } else {
            const data = await response.json();
            alert(data.message || 'Gagal menghapus surat');
        }
    } catch (error) {
        console.error('Error deleting surat:', error);
        alert('Gagal menghapus surat');
    }
}

// Setup form submission
function setupForm() {
    document.getElementById('suratForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('suratId').value;
        const isEdit = !!id;
        
        const formData = new FormData();
        formData.append('nomor_surat', document.getElementById('nomorSurat').value);
        formData.append('tanggal_surat', document.getElementById('tanggalSurat').value);
        formData.append('tanggal_terima', document.getElementById('tanggalTerima').value);
        formData.append('kategori_id', document.getElementById('kategori').value);
        formData.append('pengirim', document.getElementById('pengirim').value);
        formData.append('perihal', document.getElementById('perihal').value);
        formData.append('isi_ringkasan', document.getElementById('isiRingkasan').value);
        formData.append('sifat_surat', document.getElementById('sifatSurat').value);
        formData.append('jenis_surat', 'masuk');
        
        const fileInput = document.getElementById('fileSurat');
        if (fileInput.files[0]) {
            formData.append('file_surat', fileInput.files[0]);
        }
        
        try {
            const token = localStorage.getItem('accessToken');
            const url = isEdit ? `/api/surat/${id}` : '/api/surat';
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            if (response.ok) {
                alert(isEdit ? 'Surat berhasil diupdate' : 'Surat berhasil dibuat');
                closeFormModal();
                loadSuratMasuk(currentPage);
            } else {
                const data = await response.json();
                alert(data.message || 'Gagal menyimpan surat');
            }
        } catch (error) {
            console.error('Error saving surat:', error);
            alert('Gagal menyimpan surat');
        }
    });
}

// Close modals
function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('show');
}

function closeFormModal() {
    document.getElementById('formModal').classList.remove('show');
    document.getElementById('suratForm').reset();
}

// Pagination
function prevPage() {
    if (currentPage > 1) {
        loadSuratMasuk(currentPage - 1);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        loadSuratMasuk(currentPage + 1);
    }
}

function updatePagination() {
    document.getElementById('pageInfo').textContent = 
        `Halaman ${currentPage} dari ${totalPages}`;
    
    document.getElementById('btnPrev').disabled = currentPage === 1;
    document.getElementById('btnNext').disabled = currentPage === totalPages;
}

// Filter functions
function applyFilters() {
    loadSuratMasuk(1);
}

function resetFilters() {
    document.querySelectorAll('.filters-bar input, .filters-bar select').forEach(el => {
        el.value = '';
    });
    loadSuratMasuk(1);
}

// Format date helper
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}
