// SpinnerComponent.js - Reusable Spinner Component
class SpinnerComponent {
    constructor(options = {}) {
        this.options = {
            size: options.size || 'medium', // small, medium, large
            color: options.color || '#1a73e8',
            overlay: options.overlay !== false,
            text: options.text || 'Loading...',
            fullscreen: options.fullscreen || false
        };
        
        this.element = null;
    }

    create() {
        this.element = document.createElement('div');
        this.element.className = 'spinner-component';
        
        const sizes = {
            small: '30px',
            medium: '50px',
            large: '80px'
        };
        
        const size = sizes[this.options.size] || sizes.medium;
        
        this.element.innerHTML = `
            <div class="spinner-wrapper ${this.options.overlay ? 'spinner-overlay' : ''} 
                 ${this.options.fullscreen ? 'spinner-fullscreen' : ''}">
                <div class="spinner-container">
                    <svg class="spinner-circle" width="${size}" height="${size}" viewBox="0 0 50 50">
                        <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" 
                                stroke="${this.options.color}" stroke-width="4"
                                stroke-dasharray="90, 150" stroke-dashoffset="0"
                                stroke-linecap="round">
                            <animateTransform attributeName="transform" type="rotate"
                                              from="0 25 25" to="360 25 25"
                                              dur="1s" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                    ${this.options.text ? `<p class="spinner-text">${this.options.text}</p>` : ''}
                </div>
            </div>
        `;
        
        return this.element;
    }

    show(container = document.body) {
        if (!this.element) {
            this.create();
        }
        container.appendChild(this.element);
    }

    hide() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    updateText(text) {
        if (this.element) {
            const textElement = this.element.querySelector('.spinner-text');
            if (textElement) {
                textElement.textContent = text;
            }
        }
    }

    destroy() {
        this.hide();
        this.element = null;
    }

    // Static methods for global spinner
    static show(container, options = {}) {
        if (!SpinnerComponent.globalSpinner) {
            SpinnerComponent.globalSpinner = new SpinnerComponent(options);
        }
        SpinnerComponent.globalSpinner.show(container);
    }

    static hide() {
        if (SpinnerComponent.globalSpinner) {
            SpinnerComponent.globalSpinner.hide();
        }
    }

    static updateText(text) {
        if (SpinnerComponent.globalSpinner) {
            SpinnerComponent.globalSpinner.updateText(text);
        }
    }
}

// CSS Styles for Spinner
const spinnerStyles = `
    .spinner-component {
        z-index: 10000;
    }
    
    .spinner-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    }
    
    .spinner-overlay {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
    }
    
    .spinner-fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.95);
        z-index: 9999;
    }
    
    .spinner-container {
        text-align: center;
    }
    
    .spinner-circle {
        animation: spinner-rotate 2s linear infinite;
    }
    
    .spinner-path {
        animation: spinner-dash 1.5s ease-in-out infinite;
    }
    
    .spinner-text {
        margin-top: 15px;
        color: #5f6368;
        font-size: 14px;
        font-weight: 500;
    }
    
    @keyframes spinner-rotate {
        100% { transform: rotate(360deg); }
    }
    
    @keyframes spinner-dash {
        0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
        50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
        100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
    }
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.textContent = spinnerStyles;
document.head.appendChild(styleElement);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpinnerComponent;
}
