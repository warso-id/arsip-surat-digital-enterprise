/**
 * END-TO-END TESTS - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

describe('Full Flow E2E', () => {
  beforeAll(async () => {
    // Initialize app
    document.body.innerHTML = '<div id="app"></div>';
    
    // Mock all API calls
    global.fetch = jest.fn();
    
    // Setup mock responses
    setupMockResponses();
    
    // Initialize app modules
    await app.init();
  });
  
  function setupMockResponses() {
    global.fetch.mockImplementation((url) => {
      const urlObj = new URL(url);
      const action = urlObj.searchParams.get('action');
      
      const responses = {
        'ping': { status: 'success', message: 'API Running' },
        'login': {
          status: 'success',
          data: {
            token: 'mock-token',
            csrf: 'mock-csrf',
            user: { id: '1', username: 'admin', role: 'admin', namaLengkap: 'Administrator' },
            permissions: { all: ['*'] }
          }
        },
        'dashboard.stats': {
          status: 'success',
          data: {
            suratMasuk: { total: 10, pending: 3 },
            suratKeluar: { total: 8, pending: 2 },
            disposisi: { total: 5, pending: 1 }
          }
        },
        'suratMasuk.list': {
          status: 'success',
          data: {
            items: [
              { id: '1', nomorAgenda: 'AGD-001/2024', nomorSurat: 'SM-001', pengirim: 'Dinas A', perihal: 'Undangan', status: 'diterima', tanggalSurat: '2024-01-15' }
            ],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
          }
        },
        'suratMasuk.create': {
          status: 'success',
          data: { id: 'new-1', nomorAgenda: 'AGD-002/2024' }
        }
      };
      
      const response = responses[action] || { status: 'error', message: 'Unknown action' };
      
      return Promise.resolve({
        ok: response.status === 'success',
        json: () => Promise.resolve(response)
      });
    });
  }
  
  test('Login flow', async () => {
    // Navigate to login
    router.navigate('/login');
    await waitForRender();
    
    // Fill login form
    const usernameInput = document.querySelector('#username');
    const passwordInput = document.querySelector('#password');
    
    if (usernameInput) usernameInput.value = 'admin';
    if (passwordInput) passwordInput.value = 'password';
    
    // Submit login
    const loginBtn = document.querySelector('#btn-login');
    if (loginBtn) loginBtn.click();
    
    await waitForAsync();
    
    // Should be authenticated
    expect(AuthService.isAuthenticated()).toBe(true);
    expect(AuthService.getUser().username).toBe('admin');
  });
  
  test('Dashboard loads after login', async () => {
    router.navigate('/dashboard');
    await waitForRender();
    
    const statsGrid = document.querySelector('#stats-grid');
    expect(statsGrid).toBeTruthy();
  });
  
  test('Navigate to surat masuk', async () => {
    router.navigate('/surat-masuk');
    await waitForRender();
    
    const table = document.querySelector('#surat-masuk-table');
    expect(table).toBeTruthy();
  });
  
  test('Create new surat masuk', async () => {
    router.navigate('/surat-masuk/create');
    await waitForRender();
    
    const form = document.querySelector('.surat-masuk-form');
    expect(form).toBeTruthy();
    
    // Fill form
    const nomorSurat = document.querySelector('[name="nomorSurat"]');
    const pengirim = document.querySelector('[name="pengirim"]');
    const perihal = document.querySelector('[name="perihal"]');
    
    if (nomorSurat) nomorSurat.value = 'SM-002';
    if (pengirim) pengirim.value = 'Dinas B';
    if (perihal) perihal.value = 'Laporan Bulanan';
    
    // Submit
    const submitBtn = document.querySelector('#btn-submit');
    if (submitBtn) submitBtn.click();
    
    await waitForAsync();
    
    // Should show success notification
    const toasts = document.querySelectorAll('.toast--success');
    expect(toasts.length).toBeGreaterThan(0);
  });
  
  test('Logout flow', async () => {
    const logoutBtn = document.querySelector('#btn-logout');
    if (logoutBtn) logoutBtn.click();
    
    await waitForAsync();
    
    expect(AuthService.isAuthenticated()).toBe(false);
    expect(window.location.hash).toContain('login');
  });
  
  // Helper functions
  function waitForRender(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function waitForAsync(ms = 200) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});
