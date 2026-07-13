/**
 * SURAT MASUK INTEGRATION TESTS - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

describe('Surat Masuk Integration', () => {
  let page;
  let container;
  
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    container = document.getElementById('app');
    
    // Mock API responses
    global.fetch = jest.fn();
    
    // Setup auth
    AuthService.setToken('test-token');
    AuthService.setUser({ id: '1', username: 'admin', role: 'admin' });
  });
  
  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });
  
  describe('Surat Masuk List', () => {
    it('should load and display surat masuk list', async () => {
      const mockData = {
        status: 'success',
        data: {
          items: [
            { id: '1', nomorAgenda: 'AGD-001/2024', nomorSurat: 'SM-001', pengirim: 'Dinas A', perihal: 'Undangan Rapat', status: 'diterima', tanggalSurat: '2024-01-15' },
            { id: '2', nomorAgenda: 'AGD-002/2024', nomorSurat: 'SM-002', pengirim: 'Dinas B', perihal: 'Laporan', status: 'diproses', tanggalSurat: '2024-01-20' }
          ],
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
        }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });
      
      const listPage = new SuratMasukListPage();
      await listPage.render(container);
      
      expect(container.querySelector('#surat-masuk-table')).toBeTruthy();
      expect(container.querySelectorAll('.data-table__row').length).toBe(2);
    });
    
    it('should filter by search', async () => {
      const mockData = {
        status: 'success',
        data: { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
      });
      
      const listPage = new SuratMasukListPage();
      await listPage.render(container);
      
      const searchInput = container.querySelector('#filter-search');
      searchInput.value = 'Undangan';
      searchInput.dispatchEvent(new Event('input'));
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('Surat Masuk Create', () => {
    it('should validate required fields', async () => {
      const createPage = new SuratMasukCreatePage();
      await createPage.render(container);
      
      const submitBtn = container.querySelector('#btn-submit');
      submitBtn.click();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const errors = container.querySelectorAll('.form-helper--error');
      expect(errors.length).toBeGreaterThan(0);
    });
    
    it('should submit valid form', async () => {
      const mockResponse = {
        status: 'success',
        data: { id: 'new-id', nomorAgenda: 'AGD-003/2024' }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const createPage = new SuratMasukCreatePage();
      await createPage.render(container);
      
      container.querySelector('#nomor-surat').value = 'SM-003';
      container.querySelector('#pengirim').value = 'Dinas C';
      container.querySelector('#perihal').value = 'Pemberitahuan';
      container.querySelector('#tanggal-surat').value = '2024-02-01';
      
      container.querySelector('#btn-submit').click();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
