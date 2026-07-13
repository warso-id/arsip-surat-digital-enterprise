/**
 * LOGIN INTEGRATION TESTS - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

describe('Login Flow', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="app"></div>';
    
    // Mock API
    global.fetch = jest.fn();
  });
  
  it('should render login form', () => {
    const loginPage = new LoginPage();
    const container = document.getElementById('app');
    
    loginPage.render(container);
    
    expect(container.querySelector('#username')).toBeTruthy();
    expect(container.querySelector('#password')).toBeTruthy();
    expect(container.querySelector('#btn-login')).toBeTruthy();
  });
  
  it('should validate required fields', async () => {
    const loginPage = new LoginPage();
    const container = document.getElementById('app');
    
    loginPage.render(container);
    
    // Click login without filling form
    container.querySelector('#btn-login').click();
    
    // Should show validation errors
    expect(container.querySelector('.form-helper--error')).toBeTruthy();
  });
  
  it('should handle successful login', async () => {
    const mockResponse = {
      status: 'success',
      data: {
        token: 'test-token',
        csrf: 'test-csrf',
        user: { id: '1', username: 'admin', role: 'admin' },
        permissions: { all: ['*'] }
      }
    };
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });
    
    const loginPage = new LoginPage();
    const container = document.getElementById('app');
    
    loginPage.render(container);
    
    container.querySelector('#username').value = 'admin';
    container.querySelector('#password').value = 'password';
    container.querySelector('#btn-login').click();
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(AuthService.getToken()).toBe('test-token');
    expect(AuthService.getUser().username).toBe('admin');
  });
  
  it('should handle login failure', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid credentials' })
    });
    
    const loginPage = new LoginPage();
    const container = document.getElementById('app');
    
    loginPage.render(container);
    
    container.querySelector('#username').value = 'admin';
    container.querySelector('#password').value = 'wrong';
    container.querySelector('#btn-login').click();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should not be authenticated
    expect(AuthService.isAuthenticated()).toBe(false);
    
    // Should show error message
    expect(container.querySelector('.form-helper--error')).toBeTruthy();
  });
});
