// Spinner Component
class SpinnerComponent {
    static show(containerId = 'mainContent') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="spinner-container">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Loading...</span>
                    </div>
                    <p class="mt-2">Memuat data...</p>
                </div>
            `;
        }
    }

    static hide() {
        // This is handled by page rendering
    }

    static showOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'spinner-overlay';
        overlay.id = 'spinnerOverlay';
        overlay.innerHTML = `
            <div class="spinner-content">
                <i class="fas fa-spinner fa-spin fa-3x"></i>
                <p>Mohon tunggu...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    static hideOverlay() {
        const overlay = document.getElementById('spinnerOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}
