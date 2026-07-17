/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * End-to-End Tests - Login Flow
 * ============================================================
 * Requires: npx cypress open
 * ============================================================
 */

describe('E2E - Login Flow', () => {
    const baseUrl = 'http://localhost:3000';
    const testUser = {
        email: 'admin@arsipsurat.id',
        password: 'password123',
    };

    beforeEach(() => {
        // Clear all storage before each test
        cy.clearLocalStorage();
        cy.clearCookies();
        cy.window().then((win) => {
            win.sessionStorage.clear();
            win.indexedDB.deleteDatabase('ArsipSuratEnterprise');
        });
    });

    // ==================== PAGE LOADING ====================
    describe('Page Loading', () => {
        it('should load landing page successfully', () => {
            cy.visit(baseUrl);
            cy.get('.hero-section').should('be.visible');
            cy.get('.hero-title').should('contain.text', 'Kelola Arsip Surat');
            cy.get('#loading-screen').should('not.exist');
        });

        it('should load login page successfully', () => {
            cy.visit(`${baseUrl}/login.html`);
            cy.get('#loginForm').should('be.visible');
            cy.get('#email').should('be.visible');
            cy.get('#password').should('be.visible');
        });

        it('should show loading screen then hide it', () => {
            cy.visit(baseUrl);
            cy.get('#loading-screen', { timeout: 1000 }).should('exist');
            cy.get('#loading-screen', { timeout: 5000 }).should('not.exist');
        });
    });

    // ==================== LOGIN FORM ====================
    describe('Login Form Validation', () => {
        beforeEach(() => {
            cy.visit(`${baseUrl}/login.html`);
        });

        it('should show error for empty email', () => {
            cy.get('#password').type('test');
            cy.get('#loginForm').submit();
            cy.get('.alert-error').should('be.visible');
        });

        it('should show error for empty password', () => {
            cy.get('#email').type('test@test.com');
            cy.get('#loginForm').submit();
            cy.get('.alert-error').should('be.visible');
        });

        it('should show error for invalid credentials', () => {
            cy.get('#email').type('wrong@email.com');
            cy.get('#password').type('wrongpassword');
            cy.get('#loginForm').submit();
            cy.get('.alert-error', { timeout: 5000 }).should('be.visible');
        });

        it('should toggle password visibility', () => {
            cy.get('#password').type('test');
            cy.get('#password').should('have.attr', 'type', 'password');
            cy.get('.toggle-password').click();
            cy.get('#password').should('have.attr', 'type', 'text');
            cy.get('.toggle-password').click();
            cy.get('#password').should('have.attr', 'type', 'password');
        });

        it('should remember email when checkbox is checked', () => {
            cy.get('#email').type(testUser.email);
            cy.get('#remember').check();
            cy.get('#loginForm').submit();
            cy.wait(2000);
            cy.reload();
            cy.get('#email').should('have.value', testUser.email);
        });
    });

    // ==================== SUCCESSFUL LOGIN ====================
    describe('Successful Login', () => {
        it('should login successfully with demo credentials', () => {
            cy.visit(`${baseUrl}/login.html`);
            cy.get('#email').type(testUser.email);
            cy.get('#password').type(testUser.password);
            cy.get('#loginForm').submit();

            // Should show success message
            cy.get('.alert-success', { timeout: 5000 }).should('be.visible');

            // Should redirect to dashboard
            cy.url({ timeout: 5000 }).should('include', 'dashboard');

            // Dashboard should be visible
            cy.get('.page-content').should('be.visible');
            cy.get('.page-title').should('contain.text', 'Dashboard');
        });

        it('should display user info after login', () => {
            cy.login(testUser.email, testUser.password);
            cy.visit(`${baseUrl}/dashboard.html`);
            cy.get('#userName').should('contain.text', 'Administrator');
            cy.get('#userAvatar').should('be.visible');
        });
    });

    // ==================== SESSION MANAGEMENT ====================
    describe('Session Management', () => {
        it('should persist login across page reloads', () => {
            cy.login(testUser.email, testUser.password);
            cy.visit(`${baseUrl}/dashboard.html`);
            cy.reload();
            cy.get('.page-content').should('be.visible');
            cy.get('#userName').should('contain.text', 'Administrator');
        });

        it('should redirect to login when accessing protected page without auth', () => {
            cy.clearLocalStorage();
            cy.visit(`${baseUrl}/dashboard.html`);
            cy.url().should('include', 'login');
        });

        it('should logout successfully', () => {
            cy.login(testUser.email, testUser.password);
            cy.visit(`${baseUrl}/dashboard.html`);

            // Click logout button
            cy.get('[data-action="logout"]').click();
            // Or find logout in profile
            cy.get('.user-menu').click();
            cy.url().should('include', 'profile');

            // Should redirect to login
            cy.get('#logoutBtn').click({ force: true });
            cy.url({ timeout: 5000 }).should('include', 'login');
        });
    });

    // ==================== NAVIGATION ====================
    describe('Navigation', () => {
        beforeEach(() => {
            cy.login(testUser.email, testUser.password);
        });

        it('should navigate between pages using sidebar', () => {
            cy.visit(`${baseUrl}/dashboard.html`);

            // Navigate to Surat Masuk
            cy.contains('Surat Masuk').click();
            cy.url().should('include', 'surat-masuk');
            cy.get('.page-title').should('contain.text', 'Surat Masuk');

            // Navigate to Surat Keluar
            cy.contains('Surat Keluar').click();
            cy.url().should('include', 'surat-keluar');
            cy.get('.page-title').should('contain.text', 'Surat Keluar');

            // Navigate to Disposisi
            cy.contains('Disposisi').click();
            cy.url().should('include', 'disposisi');

            // Navigate to Laporan
            cy.contains('Laporan').click();
            cy.url().should('include', 'laporan');

            // Back to Dashboard
            cy.contains('Dashboard').click();
            cy.url().should('include', 'dashboard');
        });

        it('should toggle mobile sidebar', () => {
            cy.viewport('iphone-6');
            cy.visit(`${baseUrl}/dashboard.html`);

            // Sidebar should be hidden
            cy.get('.sidebar').should('not.be.visible');

            // Click menu toggle
            cy.get('.menu-toggle').click();

            // Sidebar should be visible
            cy.get('.sidebar').should('be.visible');

            // Close sidebar
            cy.get('.menu-toggle').click();
            cy.get('.sidebar').should('not.be.visible');
        });
    });

    // ==================== ERROR HANDLING ====================
    describe('Error Handling', () => {
        it('should show 404 page for invalid routes', () => {
            cy.visit(`${baseUrl}/nonexistent-page.html`, { failOnStatusCode: false });
            cy.get('.error-code').should('contain.text', '404');
            cy.get('.error-title').should('contain.text', 'Halaman Tidak Ditemukan');
        });

        it('should have working back to home button on 404 page', () => {
            cy.visit(`${baseUrl}/nonexistent-page.html`, { failOnStatusCode: false });
            cy.contains('Kembali ke Dashboard').click();
            cy.url().should('include', 'dashboard');
        });

        it('should handle offline mode', () => {
            cy.visit(baseUrl);
            // Simulate offline
            cy.window().then((win) => {
                win.dispatchEvent(new Event('offline'));
            });
            // Should show offline notification
            cy.get('#error-boundary-overlay, .toast, .alert-warning').should('exist');
        });
    });

    // ==================== GOOGLE APPS SCRIPT CONNECTION ====================
    describe('Google Apps Script Connection', () => {
        it('should test GAS connection on startup', () => {
            cy.visit(baseUrl);
            cy.window().then((win) => {
                expect(win.__GAS).to.exist;
                expect(win.ENTERPRISE_CONFIG.gas.url).to.include('script.google.com');
            });
        });

        it('should have Base64 encoding available', () => {
            cy.visit(baseUrl);
            cy.window().then((win) => {
                expect(win.__BASE64).to.exist;
                const test = win.__BASE64.encodeObject({ test: 'hello' });
                expect(test).to.be.a('string');
                const decoded = win.__BASE64.decodeObject(test);
                expect(decoded).to.deep.equal({ test: 'hello' });
            });
        });

        it('should have startup script loaded', () => {
            cy.visit(baseUrl);
            cy.window().then((win) => {
                expect(win.startup).to.exist;
                expect(win.startup.config.version).to.equal('3.0.0');
            });
        });
    });
});

// ==================== CUSTOM COMMANDS ====================
Cypress.Commands.add('login', (email, password) => {
    cy.visit('http://localhost:3000/login.html');
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('#loginForm').submit();
    cy.url({ timeout: 5000 }).should('include', 'dashboard');
});
