// api.js - Enterprise API Routes
const ApiRoutes = {
    // Base URL
    baseUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
    
    // Authentication Routes
    auth: {
        login: { method: 'POST', action: 'auth_login' },
        register: { method: 'POST', action: 'auth_register' },
        logout: { method: 'POST', action: 'auth_logout' },
        forgotPassword: { method: 'POST', action: 'auth_forgot_password' },
        resetPassword: { method: 'POST', action: 'auth_reset_password' },
        refreshToken: { method: 'POST', action: 'auth_refresh_token' },
        verifyToken: { method: 'POST', action: 'auth_verify_token' }
    },
    
    // Dashboard Routes
    dashboard: {
        getData: { method: 'POST', action: 'dashboard_get_data' },
        getChart: { method: 'POST', action: 'dashboard_get_chart' },
        getActivities: { method: 'POST', action: 'dashboard_recent_activities' },
        getNotifications: { method: 'POST', action: 'dashboard_notifications' }
    },
    
    // Surat Masuk Routes
    suratMasuk: {
        index: { method: 'POST', action: 'surat_masuk_index' },
        store: { method: 'POST', action: 'surat_masuk_store' },
        show: { method: 'POST', action: 'surat_masuk_show' },
        update: { method: 'POST', action: 'surat_masuk_update' },
        destroy: { method: 'POST', action: 'surat_masuk_destroy' },
        search: { method: 'POST', action: 'surat_masuk_search' },
        updateStatus: { method: 'POST', action: 'surat_masuk_update_status' },
        statistics: { method: 'POST', action: 'surat_masuk_statistics' },
        export: { method: 'POST', action: 'surat_masuk_export' },
        import: { method: 'POST', action: 'surat_masuk_import' }
    },
    
    // Surat Keluar Routes
    suratKeluar: {
        index: { method: 'POST', action: 'surat_keluar_index' },
        store: { method: 'POST', action: 'surat_keluar_store' },
        show: { method: 'POST', action: 'surat_keluar_show' },
        update: { method: 'POST', action: 'surat_keluar_update' },
        destroy: { method: 'POST', action: 'surat_keluar_destroy' },
        search: { method: 'POST', action: 'surat_keluar_search' },
        statistics: { method: 'POST', action: 'surat_keluar_statistics' }
    },
    
    // Disposisi Routes
    disposisi: {
        index: { method: 'POST', action: 'disposisi_index' },
        store: { method: 'POST', action: 'disposisi_store' },
        show: { method: 'POST', action: 'disposisi_show' },
        update: { method: 'POST', action: 'disposisi_update' },
        updateStatus: { method: 'POST', action: 'disposisi_update_status' },
        tracking: { method: 'POST', action: 'disposisi_tracking' },
        statistics: { method: 'POST', action: 'disposisi_statistics' }
    },
    
    // Kategori Routes
    kategori: {
        index: { method: 'POST', action: 'kategori_index' },
        store: { method: 'POST', action: 'kategori_store' },
        update: { method: 'POST', action: 'kategori_update' },
        destroy: { method: 'POST', action: 'kategori_destroy' }
    },
    
    // Instansi Routes
    instansi: {
        index: { method: 'POST', action: 'instansi_index' },
        store: { method: 'POST', action: 'instansi_store' },
        update: { method: 'POST', action: 'instansi_update' },
        destroy: { method: 'POST', action: 'instansi_destroy' }
    },
    
    // Pengguna Routes
    pengguna: {
        index: { method: 'POST', action: 'pengguna_index' },
        store: { method: 'POST', action: 'pengguna_store' },
        show: { method: 'POST', action: 'pengguna_show' },
        update: { method: 'POST', action: 'pengguna_update' },
        destroy: { method: 'POST', action: 'pengguna_destroy' },
        updateProfile: { method: 'POST', action: 'pengguna_update_profile' },
        changePassword: { method: 'POST', action: 'pengguna_change_password' }
    },
    
    // Laporan Routes
    laporan: {
        generate: { method: 'POST', action: 'laporan_generate' },
        exportPDF: { method: 'POST', action: 'laporan_export_pdf' },
        exportExcel: { method: 'POST', action: 'laporan_export_excel' }
    },
    
    // Pengaturan Routes
    pengaturan: {
        get: { method: 'POST', action: 'pengaturan_get' },
        update: { method: 'POST', action: 'pengaturan_update' }
    },
    
    // File Routes
    file: {
        upload: { method: 'POST', action: 'file_upload' },
        download: { method: 'POST', action: 'file_download' },
        delete: { method: 'POST', action: 'file_delete' }
    },
    
    // Backup Routes
    backup: {
        create: { method: 'POST', action: 'backup_create' },
        restore: { method: 'POST', action: 'backup_restore' },
        list: { method: 'POST', action: 'backup_list' }
    }
};

// Route helper functions
class RouteHelper {
    static async call(route, params = {}) {
        const token = localStorage.getItem('auth_token');
        
        const payload = btoa(encodeURIComponent(JSON.stringify({
            ...route,
            ...params,
            token: token,
            timestamp: Date.now()
        })));

        try {
            const response = await fetch(ApiRoutes.baseUrl, {
                method: route.method || 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            
            if (result.data) {
                return JSON.parse(decodeURIComponent(atob(result.data)));
            }
            
            return result;

        } catch (error) {
            console.error('Route call error:', error);
            return { success: false, message: 'Network error' };
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiRoutes, RouteHelper };
}
