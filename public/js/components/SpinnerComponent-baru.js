class SpinnerComponent {
    static show(target = 'body') {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'spinner-overlay';
        overlay.innerHTML = `
            <div class="spinner-container">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Mohon tunggu...</p>
            </div>
        `;
        overlay.id = 'spinnerOverlay';

        // Style overlay
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            border-radius: inherit;
        `;

        // Ensure parent has position relative
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(overlay);
    }

    static hide(target = 'body') {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const overlay = element.querySelector('#spinnerOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpinnerComponent;
}
