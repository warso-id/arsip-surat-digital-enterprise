const API = {
    // ========== CONFIGURATION ==========
    // 🔥 Gunakan CORS proxy service
    corsProxy: 'https://api.allorigins.win/raw?url=',
    baseUrl: 'https://script.google.com/macros/s/AKfycbyV2a5DBBJWCNKYE_AXbu_rM_8inZv9L1d2uLRi8_dVZQfDtAt9ldBPge2FOs0dyGS5TA/exec',
    
    // ========== REQUEST VIA PROXY ==========
    async request(action, method = 'GET', data = null, token = null, csrf = null) {
        try {
            const url = new URL(this.baseUrl);
            url.searchParams.set('action', action);
            
            if (token) url.searchParams.set('token', token);
            if (csrf && method !== 'GET') url.searchParams.set('csrf', csrf);
            
            // 🔥 Lewati CORS proxy
            const proxyUrl = this.corsProxy + encodeURIComponent(url.toString());
            
            console.log(`📡 ${method} Request via proxy:`, proxyUrl);
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                const bodyData = { ...data };
                delete bodyData.id;
                options.body = JSON.stringify(bodyData);
            }
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            options.signal = controller.signal;
            
            const response = await fetch(proxyUrl, options);
            clearTimeout(timeoutId);
            
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('❌ Invalid JSON:', text);
                throw new Error('Response tidak valid');
            }
            
            console.log('📥 Response:', result);
            return result;
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    },
    
    // ========== GET REQUEST ==========
    async get(action, params = {}) {
        const { token = App.token, ...rest } = params;
        return await this.request(action, 'GET', null, token, null);
    },
    
    // ========== POST REQUEST ==========
    async post(action, data = {}, token = null) {
        return await this.request(action, 'POST', data, token || App.token, App.csrf);
    },
    
    // ========== TEST CONNECTION ==========
    async testConnection() {
        try {
            console.log('🔗 Testing connection via CORS proxy...');
            const result = await this.get('ping', { token: null });
            console.log('✅ Connection test:', result);
            return result;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return { status: 'error', message: error.message };
        }
    }
};

// ========== AUTO INIT ==========
API.init('https://script.google.com/macros/s/AKfycbyV2a5DBBJWCNKYE_AXbu_rM_8inZv9L1d2uLRi8_dVZQfDtAt9ldBPge2FOs0dyGS5TA/exec');

console.log('✅ API Module Loaded (CORS Proxy Mode)');
