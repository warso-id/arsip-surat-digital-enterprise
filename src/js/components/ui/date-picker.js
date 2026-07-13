/**
 * DATE PICKER COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class DatePicker {
  constructor(options = {}) {
    this.options = {
      container: null,
      value: null,
      minDate: null,
      maxDate: null,
      format: 'DD/MM/YYYY',
      placeholder: 'Pilih tanggal',
      locale: 'id-ID',
      firstDayOfWeek: 1,
      onChange: null,
      onOpen: null,
      onClose: null,
      ...options
    };
    
    this.container = null;
    this.input = null;
    this.dropdown = null;
    this.currentYear = null;
    this.currentMonth = null;
    this.selectedDate = null;
    this.isOpen = false;
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
  }
  
  /**
   * Initialize date picker
   */
  init() {
    this.container = this.options.container;
    if (!this.container) {
      console.error('DatePicker: container is required');
      return;
    }
    
    this.selectedDate = this.options.value ? new Date(this.options.value) : null;
    this.currentYear = this.selectedDate ? this.selectedDate.getFullYear() : this.today.getFullYear();
    this.currentMonth = this.selectedDate ? this.selectedDate.getMonth() : this.today.getMonth();
    
    this.render();
    this.bindEvents();
  }
  
  /**
   * Render date picker
   */
  render() {
    this.container.innerHTML = `
      <div class="date-picker">
        <div class="input-with-icon">
          <span class="input-with-icon__icon input-with-icon__icon--left material-icons">calendar_today</span>
          <input type="text" class="form-input" id="date-input" 
                 placeholder="${this.options.placeholder}" 
                 value="${this.selectedDate ? this.formatDate(this.selectedDate) : ''}"
                 readonly>
          <span class="input-with-icon__icon input-with-icon__icon--right material-icons" 
                id="date-clear" style="display:${this.selectedDate ? 'block' : 'none'};cursor:pointer">
            close
          </span>
        </div>
        <div class="date-picker__dropdown" id="date-dropdown" style="display:none">
          <div class="date-picker__header">
            <button class="btn-icon btn-icon-sm" id="date-prev-month">
              <span class="material-icons">chevron_left</span>
            </button>
            <div class="date-picker__month-year">
              <select id="date-month-select">
                ${this.getMonthOptions()}
              </select>
              <select id="date-year-select">
                ${this.getYearOptions()}
              </select>
            </div>
            <button class="btn-icon btn-icon-sm" id="date-next-month">
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
          <div class="date-picker__days-header">
            ${this.getDayHeaders()}
          </div>
          <div class="date-picker__days" id="date-days-grid">
            ${this.renderDays()}
          </div>
          <div class="date-picker__footer">
            <button class="btn btn-ghost btn-sm" id="date-today">Hari Ini</button>
            <button class="btn btn-ghost btn-sm" id="date-clear-btn" style="display:${this.selectedDate ? 'flex' : 'none'}">Hapus</button>
          </div>
        </div>
      </div>
    `;
    
    this.input = this.container.querySelector('#date-input');
    this.dropdown = this.container.querySelector('#date-dropdown');
  }
  
  /**
   * Get month options
   */
  getMonthOptions() {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    return months.map((name, index) => `
      <option value="${index}" ${index === this.currentMonth ? 'selected' : ''}>${name}</option>
    `).join('');
  }
  
  /**
   * Get year options
   */
  getYearOptions() {
    const currentYear = this.today.getFullYear();
    const years = [];
    
    for (let y = currentYear - 10; y <= currentYear + 10; y++) {
      years.push(`
        <option value="${y}" ${y === this.currentYear ? 'selected' : ''}>${y}</option>
      `);
    }
    
    return years.join('');
  }
  
  /**
   * Get day headers
   */
  getDayHeaders() {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = (i + this.options.firstDayOfWeek) % 7;
      const date = new Date(2024, 0, day + 1);
      days.push(`
        <div class="date-picker__day-header">
          ${date.toLocaleDateString(this.options.locale, { weekday: 'narrow' })}
        </div>
      `);
    }
    return days.join('');
  }
  
  /**
   * Render days grid
   */
  renderDays() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = (firstDay.getDay() - this.options.firstDayOfWeek + 7) % 7;
    
    let html = '';
    
    // Previous month days
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      html += `<div class="date-picker__day date-picker__day--other">${prevMonthLastDay - i}</div>`;
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      const classes = [];
      
      if (this.isToday(date)) classes.push('date-picker__day--today');
      if (this.isSelected(date)) classes.push('date-picker__day--selected');
      if (this.isDisabled(date)) classes.push('date-picker__day--disabled');
      if (date.getDay() === 0 || date.getDay() === 6) classes.push('date-picker__day--weekend');
      
      html += `
        <div class="date-picker__day ${classes.join(' ')}" 
             data-date="${date.toISOString()}"
             ${this.isDisabled(date) ? '' : 'role="button" tabindex="0"'}>
          ${day}
        </div>
      `;
    }
    
    // Next month days
    const totalCells = startDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remaining; day++) {
      html += `<div class="date-picker__day date-picker__day--other">${day}</div>`;
    }
    
    return html;
  }
  
  /**
   * Check if date is today
   */
  isToday(date) {
    return date.toDateString() === this.today.toDateString();
  }
  
  /**
   * Check if date is selected
   */
  isSelected(date) {
    return this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
  }
  
  /**
   * Check if date is disabled
   */
  isDisabled(date) {
    if (this.options.minDate && date < new Date(this.options.minDate)) return true;
    if (this.options.maxDate && date > new Date(this.options.maxDate)) return true;
    return false;
  }
  
  /**
   * Select date
   */
  selectDate(date) {
    if (this.isDisabled(date)) return;
    
    this.selectedDate = date;
    this.input.value = this.formatDate(date);
    this.close();
    
    if (this.options.onChange) {
      this.options.onChange(date, this.formatDate(date));
    }
    
    // Update clear button
    const clearBtn = this.container.querySelector('#date-clear');
    const clearBtnFooter = this.container.querySelector('#date-clear-btn');
    if (clearBtn) clearBtn.style.display = 'block';
    if (clearBtnFooter) clearBtnFooter.style.display = 'flex';
  }
  
  /**
   * Clear selection
   */
  clearDate() {
    this.selectedDate = null;
    this.input.value = '';
    
    const clearBtn = this.container.querySelector('#date-clear');
    const clearBtnFooter = this.container.querySelector('#date-clear-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    if (clearBtnFooter) clearBtnFooter.style.display = 'none';
    
    if (this.options.onChange) {
      this.options.onChange(null, '');
    }
  }
  
  /**
   * Format date
   */
  formatDate(date) {
    if (!date) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return this.options.format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year);
  }
  
  /**
   * Open dropdown
   */
  open() {
    this.isOpen = true;
    this.dropdown.style.display = 'block';
    this.refreshCalendar();
    
    if (this.options.onOpen) this.options.onOpen();
  }
  
  /**
   * Close dropdown
   */
  close() {
    this.isOpen = false;
    this.dropdown.style.display = 'none';
    
    if (this.options.onClose) this.options.onClose();
  }
  
  /**
   * Refresh calendar view
   */
  refreshCalendar() {
    const monthSelect = this.container.querySelector('#date-month-select');
    const yearSelect = this.container.querySelector('#date-year-select');
    const daysGrid = this.container.querySelector('#date-days-grid');
    
    if (monthSelect) monthSelect.value = this.currentMonth;
    if (yearSelect) yearSelect.value = this.currentYear;
    if (daysGrid) daysGrid.innerHTML = this.renderDays();
  }
  
  /**
   * Get value
   */
  getValue() {
    return this.selectedDate;
  }
  
  /**
   * Get formatted value
   */
  getFormattedValue() {
    return this.selectedDate ? this.formatDate(this.selectedDate) : '';
  }
  
  /**
   * Set value
   */
  setValue(date) {
    if (date) {
      this.selectedDate = new Date(date);
      this.input.value = this.formatDate(this.selectedDate);
    } else {
      this.clearDate();
    }
  }
  
  /**
   * Bind events
   */
  bindEvents() {
    // Input click
    this.input.addEventListener('click', () => {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    });
    
    // Clear button
    this.container.querySelector('#date-clear')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearDate();
    });
    
    this.container.querySelector('#date-clear-btn')?.addEventListener('click', () => {
      this.clearDate();
      this.close();
    });
    
    // Today button
    this.container.querySelector('#date-today')?.addEventListener('click', () => {
      this.selectDate(new Date());
    });
    
    // Month navigation
    this.container.querySelector('#date-prev-month')?.addEventListener('click', () => {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.refreshCalendar();
    });
    
    this.container.querySelector('#date-next-month')?.addEventListener('click', () => {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.refreshCalendar();
    });
    
    // Month/year select
    this.container.querySelector('#date-month-select')?.addEventListener('change', (e) => {
      this.currentMonth = parseInt(e.target.value);
      this.refreshCalendar();
    });
    
    this.container.querySelector('#date-year-select')?.addEventListener('change', (e) => {
      this.currentYear = parseInt(e.target.value);
      this.refreshCalendar();
    });
    
    // Day selection (event delegation)
    this.container.querySelector('#date-days-grid')?.addEventListener('click', (e) => {
      const dayEl = e.target.closest('.date-picker__day');
      if (!dayEl || dayEl.classList.contains('date-picker__day--disabled')) return;
      
      const dateStr = dayEl.dataset.date;
      if (dateStr) {
        this.selectDate(new Date(dateStr));
      }
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.container.contains(e.target)) {
        this.close();
      }
    });
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DatePicker };
}
