/**
 * APP.JS - Main Application Scripts
 * Arsip Surat Digital Enterprise v2.0.0
 */

// ==================== GLOBAL VARIABLES ====================
const APP = {
    name: 'Arsip Surat Digital Enterprise',
    version: '2.0.0',
    apiBaseUrl: '/api',
    token: null,
    user: null
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initLoadingScreen();
    initNavigation();
    initBackToTop();
    initTooltips();
    initDropdowns();
    checkAuth();
});

function initApp() {
    console.log(`🚀 ${APP.name} v${APP.version}`);
    
    // Load token from localStorage
    APP.token = localStorage.getItem('accessToken');
    APP.user = JSON.parse(localStorage.getItem('user') || 'null');
}

// ==================== LOADING SCREEN ====================
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);
    });
}

// ==================== NAVIGATION ====================
function initNavigation() {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        
        // Close sidebar on overlay click
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
    
    // Active nav item
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-item, .sidebar-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

// ==================== BACK TO TOP ====================
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    
    window.addEventListener('scroll', () => {
        btn.style.opacity = window.scrollY > 500 ? '1' : '0';
        btn.style.visibility = window.scrollY > 500 ? 'visible' : 'hidden';
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ==================== TOOLTIPS ====================
function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = el.getAttribute('data-tooltip');
            document.body.appendChild(tooltip);
            
            const rect = el.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
            
            el.addEventListener('mouseleave', () => tooltip.remove(), { once: true });
        });
    });
}

// ==================== DROPDOWNS ====================
function initDropdowns() {
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = toggle.nextElementSibling;
            dropdown.classList.toggle('show');
        });
    });
    
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    });
}

// ==================== AUTH CHECK ====================
function checkAuth() {
    const authPages = ['/login', '/register'];
    const currentPath = window.location.pathname;
    
    if (!APP.token && !authPages.includes(currentPath) && currentPath !== '/') {
        // Redirect to login if not authenticated
        if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/surat')) {
            window.location.href = '/login';
        }
    }
}

// ==================== API HELPERS ====================
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(APP.token && { 'Authorization': `Bearer ${APP.token}` })
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(APP.apiBaseUrl + url, mergedOptions);
        
        if (response.status === 401) {
            // Token expired, try refresh
            const refreshed = await refreshToken();
            if (refreshed) {
                // Retry with new token
                mergedOptions.headers['Authorization'] = `Bearer ${APP.token}`;
                return fetch(APP.apiBaseUrl + url, mergedOptions);
            } else {
                // Redirect to login
                localStorage.clear();
                window.location.href = '/login';
                return;
            }
        }
        
        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

async function refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    
    try {
        const response = await fetch(APP.apiBaseUrl + '/auth/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.data.accessToken);
            localStorage.setItem('refreshToken', data.data.refreshToken);
            APP.token = data.data.accessToken;
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

// ==================== NOTIFICATION ====================
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">✕</button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    document.body.appendChild(container);
    return container;
}

function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// ==================== MODAL HELPERS ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay.show').forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
        document.body.style.overflow = '';
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});

// ==================== FORMAT HELPERS ====================
function formatDate(dateString, format = 'full') {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    
    const formats = {
        full: { day: 'numeric', month: 'long', year: 'numeric' },
        short: { day: 'numeric', month: 'short', year: 'numeric' },
        date: { day: '2-digit', month: '2-digit', year: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' },
        datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    };
    
    return date.toLocaleDateString('id-ID', formats[format] || formats.full);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ==================== CONFIRMATION DIALOG ====================
async function confirmDialog(message, title = 'Konfirmasi') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        overlay.innerHTML = `
            <div class="modal modal-sm">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="confirm-cancel">Batal</button>
                    <button class="btn btn-danger" id="confirm-ok">Ya, Lanjutkan</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });
        
        overlay.querySelector('#confirm-ok').addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });
    });
}

// ==================== LOGOUT ====================
async function logout() {
    const confirmed = await confirmDialog('Apakah Anda yakin ingin keluar?', 'Logout');
    if (!confirmed) return;
    
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.clear();
        window.location.href = '/login';
    }
}

// ==================== EXPORT HELPERS ====================
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showNotification('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
}

// ==================== DEBOUNCE ====================
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== EVENT LISTENERS ====================
// Handle AJAX form submissions
document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.classList.contains('ajax-form')) {
        e.preventDefault();
        handleAjaxForm(form);
    }
});

async function handleAjaxForm(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner spinner-sm"></span> Memproses...';
    }
    
    try {
        const url = form.getAttribute('action') || window.location.pathname;
        const method = form.getAttribute('method') || 'POST';
        
        const response = await apiRequest(url, {
            method,
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(data.message || 'Berhasil!', 'success');
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } else {
            showNotification(data.message || 'Gagal!', 'error');
        }
    } catch (error) {
        showNotification('Terjadi kesalahan. Silakan coba lagi.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || 'Simpan';
        }
    }
}
