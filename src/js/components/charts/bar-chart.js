/**
 * BAR CHART - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Bar chart for Google Sheets data
 */

class BarChart extends ChartBase {
  constructor(container, options = {}) {
    super(container, { ...options, type: 'bar' });
  }

  _render() {
    if (!this.ctx || !this.state.data) return;
    
    const ctx = this.ctx;
    const data = this.state.data;
    const width = this.canvas.width - 60;
    const height = this.canvas.height - 40;
    const startX = 40;
    const startY = 20;
    
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (!data.labels || data.labels.length === 0) {
      this._renderEmptyState('empty');
      return;
    }
    
    const values = data.datasets ? data.datasets[0].data : data.values || [];
    const maxValue = Math.max(...values, 1);
    const barWidth = (width / values.length) * 0.7;
    const barGap = (width / values.length) * 0.3;
    
    // Draw grid
    this._drawGrid(maxValue);
    
    // Draw bars
    values.forEach((value, index) => {
      const barHeight = (value / maxValue) * height;
      const x = startX + (width / values.length) * index + barGap / 2;
      const y = startY + height - barHeight;
      
      // Bar with gradient
      const gradient = ctx.createLinearGradient(x, y, x, startY + height);
      gradient.addColorStop(0, this.options.colors[index % this.options.colors.length]);
      gradient.addColorStop(1, this._lightenColor(this.options.colors[index % this.options.colors.length], 0.3));
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Border radius top
      ctx.fillStyle = this.options.colors[index % this.options.colors.length];
      const radius = Math.min(barWidth / 2, 8);
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
      ctx.lineTo(x + barWidth, y + 8);
      ctx.lineTo(x, y + 8);
      ctx.fill();
      
      // Value label
      ctx.fillStyle = '#212121';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(value, x + barWidth / 2, y - 8);
      
      // X-axis label
      ctx.fillStyle = '#757575';
      ctx.font = '10px Arial';
      ctx.fillText(
        data.labels[index] || '',
        x + barWidth / 2,
        startY + height + 15
      );
    });
    
    // Legend
    if (data.datasets && data.datasets.length > 1) {
      this._drawLegend(data.datasets.map(ds => ds.label));
    }
  }

  _lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
  }
}

if (typeof window !== 'undefined') {
  window.BarChart = BarChart;
}
