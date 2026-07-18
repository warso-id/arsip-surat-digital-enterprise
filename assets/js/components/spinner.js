/* ============================================
   ENTERPRISE SPINNER COMPONENT
   ============================================ */
(function() {
    'use strict';

    class SpinnerComponent {
        constructor() {
            this.element = null;
            this.timeout = null;
        }

        show(message = 'Memuat...') {
            // Remove existing spinner
            this.hide();

            this.element = document.createElement('div');
            this.element.className = 'spinner-overlay';
            this.element.innerHTML = `
                <div class="spinner-container">
                    <div class="spinner-circle"></div>
                    <div class="spinner-message">${message}</div>
                </div>
            `;

            document.body.appendChild(this.element);

            // Auto hide after 30 seconds
            this.timeout = setTimeout(() => {
                this.hide();
            }, 30000);
        }

        hide() {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }

            if (this.element) {
                this.element.classList.add('fade-out');
                setTimeout(() => {
                    if (this.element) {
                        this.element.remove();
                        this.element = null;
                    }
                }, 300);
            }
        }

        async wrap(promise, message = 'Memproses...') {
            this.show(message);
            try {
                const result = await promise;
                return result;
            } finally {
                this.hide();
            }
        }
    }

    window.Spinner = new SpinnerComponent();
})();
