// ============================================
// KONEKSI BACKEND GOOGLE APPS SCRIPT
// ============================================
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzzmttzSRYsM7KodsEdFqHRdwBs2kY7VTzFPOpsiab3p3v-6CBl-eKIuUI0Vhqd0opYtA/exec';

// API Helper
async function apiCall(action, params = {}, method = 'GET') {
  const token = localStorage.getItem('token');
  let url = API_BASE_URL + '?action=' + action;
  
  if (token) url += '&token=' + token;
  
  if (method === 'GET') {
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== '') {
        url += '&' + k + '=' + encodeURIComponent(params[k]);
      }
    });
    
    try {
      const response = await fetch(url);
      return await response.json();
    } catch(e) {
      console.error('API Error:', e);
      return { status: 'error', message: 'Gagal terhubung ke server' };
    }
  } else {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, token })
      });
      return await response.json();
    } catch(e) {
      console.error('API Error:', e);
      return { status: 'error', message: 'Gagal terhubung ke server' };
    }
  }
}

// ============================================
// UPDATE handleLogin UNTUK KONEKSI BACKEND
// ============================================
async function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const btn = document.getElementById('login-btn');
  
  if (!username || !password) {
    showAlert('❌ Harap isi username dan password', 'error');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = '⏳ Menghubungkan ke server...';
  hideAlert();
  
  try {
    // 🔥 PANGGIL BACKEND API
    const result = await apiCall('login', { username, password }, 'POST');
    
    if (result.status === 'success') {
      APP_STATE.isAuthenticated = true;
      APP_STATE.user = result.data.user;
      APP_STATE.token = result.data.token;
      
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      
      showAlert('✅ Login berhasil! Mengalihkan...', 'success');
      
      setTimeout(() => {
        showDashboard();
        loadDashboardData();
        btn.disabled = false;
        btn.textContent = '🔐 Masuk';
        hideAlert();
      }, 800);
    } else {
      showAlert('❌ ' + (result.message || 'Login gagal'), 'error');
      btn.disabled = false;
      btn.textContent = '🔐 Masuk';
    }
  } catch(e) {
    // 🔥 FALLBACK: Jika backend tidak tersedia, gunakan demo login
    console.warn('Backend tidak tersedia, menggunakan demo login');
    handleDemoLogin(username, password, btn);
  }
}

// Demo Login Fallback
function handleDemoLogin(username, password, btn) {
  setTimeout(() => {
    if (username === 'admin' && password === 'Admin123!') {
      const user = {
        id: '1', username: 'admin', email: 'admin@instansi.id',
        namaLengkap: 'Administrator', nip: '198001012010011001',
        jabatan: 'Administrator Sistem', unitKerja: 'TI',
        role: 'admin', isActive: true
      };
      
      APP_STATE.isAuthenticated = true;
      APP_STATE.user = user;
      APP_STATE.token = 'demo-token-' + Date.now();
      
      localStorage.setItem('token', APP_STATE.token);
      localStorage.setItem('user', JSON.stringify(user));
      
      showAlert('✅ Login berhasil (Demo Mode)!', 'success');
      setTimeout(() => { showDashboard(); btn.disabled = false; btn.textContent = '🔐 Masuk'; hideAlert(); }, 800);
    } else {
      showAlert('❌ Username atau password salah', 'error');
      btn.disabled = false;
      btn.textContent = '🔐 Masuk';
    }
  }, 1000);
}

// ============================================
// LOAD DASHBOARD DATA DARI BACKEND
// ============================================
async function loadDashboardData() {
  try {
    const result = await apiCall('dashboard.stats');
    if (result.status === 'success') {
      updateStatsUI(result.data);
    }
  } catch(e) {
    console.log('Menggunakan data demo');
  }
}

function updateStatsUI(data) {
  // Update stat cards with real data
  const statCards = document.querySelectorAll('.stat-value');
  if (statCards.length >= 4 && data) {
    statCards[0].textContent = data.suratMasuk?.total || 0;
    statCards[1].textContent = data.suratKeluar?.total || 0;
    statCards[2].textContent = data.disposisi?.total || 0;
    statCards[3].textContent = (data.suratKeluar?.pending || 0);
  }
}

// ============================================
// TEST KONEKSI BACKEND
// ============================================
async function testBackendConnection() {
  try {
    const result = await apiCall('ping');
    if (result.status === 'success') {
      console.log('✅ Backend Connected:', result.message);
      return true;
    }
    console.warn('⚠️ Backend response error:', result);
    return false;
  } catch(e) {
    console.warn('⚠️ Backend tidak tersedia, menggunakan Demo Mode');
    return false;
  }
}

// Test connection on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(testBackendConnection, 2000);
});
