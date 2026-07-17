// dashboard.js - Dashboard Scripts
console.log('Dashboard module loaded');

// Dashboard specific functions
function refreshDashboardData() {
    if (window.app) {
        window.app.refreshDashboard();
    }
}
