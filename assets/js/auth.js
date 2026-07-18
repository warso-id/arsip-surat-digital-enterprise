// Enterprise Auth - Fix v2026.7.18
class EnterpriseAuth {
    constructor() {
        this.user = null;
        this.token = null;
        this.isInitialized = false;
        this.authKey = 'enterprise_auth';
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Restore session
            await this.restoreSession();
            this.isInitialized = true;
            console.log('['+new Date().toISOString()+'] Enterprise Auth initialized');
        } catch (error) {
            console.warn('Auth initialization failed:', error);
        }
    }

    async restoreSession() {
        try {
            const sessionData = localStorage.getItem(this.authKey);
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                this.user = parsed.user;
                this.token = parsed.token;
                console.log('['+new Date().toISOString()+'] Session restored');
            }
        } catch (error) {
            console.warn('Session restoration failed:', error);
        }
    }

    async login(credentials) {
        // Simulate login - in production, this would make an API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (credentials.email && credentials.password) {
                    this.user = {
                        id: crypto.randomUUID(),
                        email: credentials.email,
                        name: credentials.email.split('@')[0],
                        role: 'user'
                    };
                    this.token = crypto.randomUUID();
                    
                    // Save session
                    this.saveSession();
                    resolve(this.user);
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 500);
        });
    }

    async logout() {
        this.user = null;
        this.token = null;
        localStorage.removeItem(this.authKey);
        console.log('User logged out');
    }

    saveSession() {
        if (this.user && this.token) {
            localStorage.setItem(this.authKey, JSON.stringify({
                user: this.user,
                token: this.token,
                timestamp: new Date().toISOString()
            }));
        }
    }

    isAuthenticated() {
        return !!this.user && !!this.token;
    }

    getUser() {
        return this.user;
    }

    getToken() {
        return this.token;
    }
}

// Expose to window
window.enterpriseAuth = new EnterpriseAuth();
