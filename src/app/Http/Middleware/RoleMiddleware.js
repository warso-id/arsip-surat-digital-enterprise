// RoleMiddleware.js - Role-Based Access Control Middleware
class RoleMiddleware {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        
        this.permissions = {
            'superadmin': ['*'],
            'admin': [
                'dashboard.*',
                'surat.*',
                'disposisi.*',
                'laporan.*',
                'pengguna.*',
                'kategori.*',
                'instansi.*',
                'pengaturan.*'
            ],
            'operator': [
                'dashboard.view',
                'surat.view',
                'surat.create',
                'surat.edit',
                'disposisi.view',
                'disposisi.create',
                'laporan.view'
            ],
            'viewer': [
                'dashboard.view',
                'surat.view',
                'disposisi.view',
                'laporan.view'
            ]
        };
    }

    async handle(requiredPermission) {
        const user = this.getCurrentUser();
        
        if (!user) {
            window.location.href = '/login';
            return false;
        }

        const role = user.role || 'viewer';
        const userPermissions = this.permissions[role] || [];

        // Superadmin has all permissions
        if (userPermissions.includes('*')) {
            return true;
        }

        // Check if user has the required permission
        const hasPermission = userPermissions.some(permission => {
            if (permission.endsWith('.*')) {
                const resource = permission.replace('.*', '');
                return requiredPermission.startsWith(resource);
            }
            return permission === requiredPermission;
        });

        if (!hasPermission) {
            this.showAccessDenied();
            return false;
        }

        return true;
    }

    async checkPermission(permission) {
        try {
            const token = localStorage.getItem('auth_token');
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'check_permission',
                permission: permission,
                token: token,
                timestamp: Date.now()
            })));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));
            
            return data.allowed === true;

        } catch (error) {
            console.error('Permission check error:', error);
            return false;
        }
    }

    getCurrentUser() {
        try {
            const userData = localStorage.getItem('user_data');
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }

    showAccessDenied() {
        const deniedHtml = `
            <div class="access-denied">
                <div class="denied-icon">🚫</div>
                <h2>Akses Ditolak</h2>
                <p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
                <button onclick="window.history.back()" class="btn btn-primary">Kembali</button>
            </div>
        `;
        
        document.getElementById('main-content').innerHTML = deniedHtml;
    }

    getRoleName(roleId) {
        const roles = {
            1: 'Super Admin',
            2: 'Administrator',
            3: 'Operator',
            4: 'Viewer'
        };
        return roles[roleId] || 'Unknown';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoleMiddleware;
}
