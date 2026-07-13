/**
 * AUTH SERVICE TESTS - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

describe('AuthService', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    sessionStorage.clear();
  });
  
  describe('token management', () => {
    it('should store and retrieve token', () => {
      AuthService.setToken('test-token');
      expect(AuthService.getToken()).toBe('test-token');
    });
    
    it('should return null when no token', () => {
      expect(AuthService.getToken()).toBeNull();
    });
    
    it('should clear token', () => {
      AuthService.setToken('test-token');
      AuthService.setToken(null);
      expect(AuthService.getToken()).toBeNull();
    });
  });
  
  describe('user management', () => {
    it('should store and retrieve user', () => {
      const user = { id: '1', username: 'admin', role: 'admin' };
      AuthService.setUser(user);
      
      const retrieved = AuthService.getUser();
      expect(retrieved).toEqual(user);
    });
    
    it('should check authentication status', () => {
      expect(AuthService.isAuthenticated()).toBe(false);
      
      AuthService.setToken('test-token');
      AuthService.setUser({ id: '1' });
      
      expect(AuthService.isAuthenticated()).toBe(true);
    });
  });
  
  describe('permissions', () => {
    it('should check admin permissions', () => {
      AuthService.setPermissions({ all: ['*'] });
      
      expect(AuthService.hasPermission('users', 'create')).toBe(true);
      expect(AuthService.hasPermission('settings', 'delete')).toBe(true);
    });
    
    it('should check specific permissions', () => {
      AuthService.setPermissions({
        'surat-masuk': ['create', 'read'],
        'surat-keluar': ['read']
      });
      
      expect(AuthService.hasPermission('surat-masuk', 'create')).toBe(true);
      expect(AuthService.hasPermission('surat-masuk', 'delete')).toBe(false);
      expect(AuthService.hasPermission('surat-keluar', 'read')).toBe(true);
    });
  });
  
  describe('login attempts', () => {
    it('should track failed login attempts', () => {
      AuthService.recordLoginAttempt();
      expect(AuthService.getLoginAttempts()).toBe(1);
      
      AuthService.recordLoginAttempt();
      expect(AuthService.getLoginAttempts()).toBe(2);
    });
    
    it('should clear login attempts', () => {
      AuthService.recordLoginAttempt();
      AuthService.recordLoginAttempt();
      AuthService.clearLoginAttempts();
      
      expect(AuthService.getLoginAttempts()).toBe(0);
    });
    
    it('should lock after max attempts', () => {
      for (let i = 0; i < APP_CONFIG.AUTH.MAX_LOGIN_ATTEMPTS; i++) {
        AuthService.recordLoginAttempt();
      }
      
      expect(AuthService.getLoginAttempts()).toBe(APP_CONFIG.AUTH.MAX_LOGIN_ATTEMPTS);
    });
  });
});
