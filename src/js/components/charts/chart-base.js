/**
 * CHART BASE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: src/js/components/charts/chart-base.js
 * Base chart component for Google Sheets data visualization
 */

class ChartBase {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? 
      document.querySelector(container) : container;
    
    this.options = {
      type: 'bar',              // bar | line | pie | doughnut | stat
      width: options.width || '100%',
      height: options.height || 300,
      data: options.data || null,
      labels: options.labels || [],
      colors: options.colors || ['#1565C0', '#0D47A1', '#1976D2', '#42A5F5', '#90CAF9'],
      title: options.title || '',
      subtitle: options.subtitle || '',
      showLegend: options.showLegend !== false,
      showGrid: options.showGrid !== false,
      animation: options.animation !== false,
      responsive: options.responsive !== false,
      emptyMessage: options.emptyMessage || 'Tidak ada data',
      loadingMessage: options.loadingMessage || 'Memuat data...',
      errorMessage: options.errorMessage || 'Gagal memuat data',
      onReady: options.onReady || null,
      onClick: options.onClick || null
    };
    
    this.state = {
      loading: true,
      error: null,
      data: null
    };
    
    this.canvas = null;
    this.ctx = null;
    this.animFrame = null;
    
    if (this.container) {
      this._init();
    }
  }

  /**
   * Initialize chart
   */
  _init() {
    this._createCanvas();
    
    if (this.options.data) {
      this.setData(this.options.data);
    }
  }

  /**
   * Create canvas element
   */
  _createCanvas() {
    this.container.innerHTML = '';
    this.container.classList.add('chart-container');
    
    // Title
    if (this.options.title) {
      const title = document.createElement('h3');
      title.className = 'chart-title';
      title.textContent = this.options.title;
      this.container.appendChild(title);
    }
    
    // Subtitle
    if (this.options.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'chart-subtitle';
      subtitle.textContent = this.options.subtitle;
      this.container.appendChild(subtitle);
    }
    
    // Canvas wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-canvas-wrapper';
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width === '100%' ? 
      this.container.clientWidth : parseInt(this.options.width);
    this.canvas.height = parseInt(this.options.height);
    
    this.ctx = this.canvas.getContext('2d');
    
    wrapper.appendChild(this.canvas);
    this.container.appendChild(wrapper);
    
    // Legend
    if (this.options.showLegend) {
      this.legendContainer = document.createElement('div');
      this.legendContainer.className = 'chart-legend';
      this.container.appendChild(this.legendContainer);
    }
  }

  /**
   * Set chart data
   */
  setData(data) {
    this.state.data = data;
    this.state.loading = false;
    this._render();
  }

  /**
   * Load data from Google Sheets
   */
  async loadFromSheets(action, params = {}) {
    this.showLoading();
    
    try {
      const response = await api.request(action, params, {
        cache: true,
        cacheTTL: 300
      });
      
      if (response.success) {
        this.setData(response.data);
      } else {
        this.showError(response.message);
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.state.loading = true;
    this._renderEmptyState('loading');
  }

  /**
   * Show error state
   */
  showError(message) {
    this.state.error = message;
    this.state.loading = false;
    this._renderEmptyState('error', message);
  }

  /**
   * Render empty state
   */
  _renderEmptyState(type, message = '') {
    const ctx = this.ctx;
    if (!ctx) return;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = '#9E9E9E';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (type === 'loading') {
      ctx.fillText(this.options.loadingMessage, width / 2, height / 2);
    } else if (type === 'error') {
      ctx.fillStyle = '#F44336';
      ctx.fillText(message || this.options.errorMessage, width / 2, height / 2);
    } else {
      ctx.fillText(this.options.emptyMessage, width / 2, height / 2);
    }
  }

  /**
   * Render chart (override in subclass)
   */
  _render() {
    // Override in subclasses
  }

  /**
   * Draw grid
   */
  _drawGrid(maxValue, steps = 5) {
    if (!this.options.showGrid || !this.ctx) return;
    
    const ctx = this.ctx;
    const width = this.canvas.width - 60;
    const height = this.canvas.height - 40;
    const startX = 40;
    const startY = 20;
    
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= steps; i++) {
      const y = startY + (height / steps) * i;
      
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + width, y);
      ctx.stroke();
      
      // Labels
      ctx.fillStyle = '#757575';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxValue - (maxValue / steps) * i), startX - 5, y + 3);
    }
  }

  /**
   * Draw legend
   */
  _drawLegend(items) {
    if (!this.legendContainer || !items) return;
    
    this.legendContainer.innerHTML = '';
    
    items.forEach((item, index) => {
      const legendItem = document.createElement('div');
      legendItem.className = 'chart-legend-item';
      
      const colorBox = document.createElement('span');
      colorBox.className = 'chart-legend-color';
      colorBox.style.backgroundColor = this.options.colors[index % this.options.colors.length];
      
      const label = document.createElement('span');
      label.className = 'chart-legend-label';
      label.textContent = item.label || item;
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(label);
      this.legendContainer.appendChild(legendItem);
    });
  }

  /**
   * Handle canvas click
   */
  _handleClick(event) {
    if (!this.options.onClick) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.options.onClick({ x, y }, this.state.data);
  }

  /**
   * Resize chart
   */
  resize() {
    if (this.options.responsive && this.container) {
      this.canvas.width = this.container.clientWidth;
      this._render();
    }
  }

  /**
   * Destroy chart
   */
  destroy() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.canvas = null;
    this.ctx = null;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChartBase };
}
