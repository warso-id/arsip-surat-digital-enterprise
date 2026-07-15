/**
 * STAT CARD - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Statistics card for dashboard
 */

class StatCard {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? 
      document.querySelector(container) : container;
    
    this.options = {
      title: options.title || '',
      value: options.value || 0,
      icon: options.icon || '',
      color: options.color || '#1565C0',
      trend: options.trend || null,    // { value: 10, direction: 'up'|'down' }
      subtitle: options.subtitle || '',
      link: options.link || null,
      onClick: options.onClick || null,
      format: options.format || 'number'  // number | currency | percentage
    };
    
    this.element = null;
    
    if (this.container) {
      this._render();
    }
  }

  _render() {
    this.element = document.createElement('div');
    this.element.className = 'stat-card';
    this.element.style.borderTopColor = this.options.color;
    
    if (this.options.link || this.options.onClick) {
      this.element.classList.add('stat-card--clickable');
      this.element.addEventListener('click', () => {
        if (this.options.onClick) {
          this.options.onClick();
        } else if (this.options.link) {
          router.navigate(this.options.link);
        }
      });
    }
    
    this.element.innerHTML = `
      <div class="stat-card__header">
        <span class="stat-card__icon" style="background-color: ${this._hexToRgba(this.options.color, 0.1)}; color: ${this.options.color}">
          <i class="${this.options.icon || 'icon-chart-bar'}"></i>
        </span>
        ${this.options.trend ? this._renderTrend() : ''}
      </div>
      <div class="stat-card__body">
        <h3 class="stat-card__value" style="color: ${this.options.color}">${this._formatValue()}</h3>
        <p class="stat-card__title">${this.options.title}</p>
        ${this.options.subtitle ? `<p class="stat-card__subtitle">${this.options.subtitle}</p>` : ''}
      </div>
    `;
    
    this.container.appendChild(this.element);
  }

  _renderTrend() {
    const trend = this.options.trend;
    const isUp = trend.direction === 'up';
    const color = isUp ? '#4CAF50' : '#F44336';
    const icon = isUp ? 'icon-arrow-up' : 'icon-arrow-down';
    
    return `
      <span class="stat-card__trend" style="color: ${color}">
        <i class="${icon}"></i>
        ${trend.value}%
      </span>
    `;
  }

  _formatValue() {
    const value = this.options.value;
    
    switch (this.options.format) {
      case 'currency':
        return Formatters.currency(value);
      case 'percentage':
        return Formatters.percentage(value);
      default:
        return Formatters.number(value);
    }
  }

  _hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  updateValue(value, trend = null) {
    this.options.value = value;
    if (trend) this.options.trend = trend;
    
    const valueEl = this.element?.querySelector('.stat-card__value');
    if (valueEl) {
      valueEl.textContent = this._formatValue();
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

if (typeof window !== 'undefined') {
  window.StatCard = StatCard;
}
