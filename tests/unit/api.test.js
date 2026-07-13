/**
 * API SERVICE TESTS - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

describe('ApiService', () => {
  let api;
  
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();
    api = new ApiService();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('buildUrl', () => {
    it('should build URL with action parameter', () => {
      const url = api.buildUrl('test.action');
      expect(url).toContain('action=test.action');
    });
    
    it('should build URL with additional params', () => {
      const url = api.buildUrl('test.action', { page: 1, limit: 10 });
      expect(url).toContain('action=test.action');
      expect(url).toContain('page=1');
      expect(url).toContain('limit=10');
    });
    
    it('should exclude undefined params', () => {
      const url = api.buildUrl('test.action', { page: 1, search: undefined });
      expect(url).toContain('page=1');
      expect(url).not.toContain('search');
    });
  });
  
  describe('request', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = { status: 'success', data: { test: true } };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await api.get('test.action');
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad Request' })
      });
      
      await expect(api.get('test.action')).rejects.toThrow('Bad Request');
    });
    
    it('should retry on server error', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'success' })
        });
      
      const result = await api.get('test.action');
      
      expect(result.status).toBe('success');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('auth endpoints', () => {
    it('should call login endpoint', async () => {
      const mockResponse = {
        status: 'success',
        data: { token: 'test-token', user: { id: '1', username: 'admin' } }
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      
      const result = await api.login('admin', 'password');
      
      expect(result).toEqual(mockResponse);
    });
  });
});
