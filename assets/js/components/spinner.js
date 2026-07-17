// spinner.js - Spinner Component
class SpinnerComponent {
    static show(containerId = 'main-content') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <div class="spinner-enterprise"></div>
                    <p class="spinner-text">Memuat data...</p>
                </div>
            `;
        }
    }

    static showOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'spinner-overlay';
        overlay.innerHTML = `
            <div style="text-align: center;">
                <div class="spinner-enterprise"></div>
                <p class="spinner-text">Mohon tunggu...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    static hideOverlay() {
        const overlay = document.querySelector('.spinner-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}
