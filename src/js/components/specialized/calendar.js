/**
 * CALENDAR COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Interactive calendar for date selection and event display
 */

class Calendar {
  constructor(options = {}) {
    this.options = {
      container: null,
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
      selectedDate: null,
      minDate: null,
      maxDate: null,
      events: [],
      onSelect: null,
      onMonthChange: null,
      locale: 'id-ID',
      firstDayOfWeek: 1, // Monday
      showWeekNumbers: false,
      ...options
    };
    
    this.container = null;
    this.currentYear = this.options.year;
    this.currentMonth = this.options.month;
    this.selectedDate = this.options.selectedDate;
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
    this.monthNames = [];
    this.dayNames = [];
  }
  
  /**
   * Initialize calendar
   */
  init() {
    this.container = this.options.container;
    if (!this.container) {
      console.error('Calendar: container is required');
      return;
    }
    
    this.initLocale();
    this.render();
    this.bindEvents();
  }
  
  /**
   * Initialize locale
   */
  initLocale() {
    const locale = this.options.locale;
    
    this.monthNames = Array.from({ length: 12 }, (_, i) => {
      return new Date(2024, i, 1).toLocaleDateString(locale, { month: 'long' });
    });
    
    this.dayNames = Array.from({ length: 7 }, (_, i) => {
      const day = (i + this.options.firstDayOfWeek) % 7;
      return new Date(2024, 0, day + 1).toLocaleDateString(locale, { weekday: 'short' });
    });
  }
  
  /**
   * Render calendar
   */
  render() {
    this.container.innerHTML = `
      <div class="calendar">
        <div class="calendar__header">
          <button class="btn-icon btn-icon-sm" id="cal-prev-month" title="Bulan Sebelumnya">
            <span class="material-icons">chevron_left</span>
          </button>
          <div class="calendar__title">
            <span class="calendar__month">${this.monthNames[this.currentMonth]}</span>
            <span class="calendar__year">${this.currentYear}</span>
          </div>
          <button class="btn-icon btn-icon-sm" id="cal-next-month" title="Bulan Berikutnya">
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
        
        <div class="calendar__body">
          <div class="calendar__day-names">
            ${this.dayNames.map(name => `
              <div class="calendar__day-name">${name}</div>
            `).join('')}
          </div>
          <div class="calendar__days" id="cal-days">
            ${this.renderDays()}
          </div>
        </div>
        
        <div class="calendar__footer">
          <button class="btn btn-ghost btn-sm" id="cal-today">Hari Ini</button>
          ${this.selectedDate ? `
            <button class="btn btn-ghost btn-sm" id="cal-clear">Hapus</button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  /**
   * Render days grid
   */
  renderDays() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() - this.options.firstDayOfWeek + 7) % 7;
    
    let html = '';
    
    // Previous month days
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      html += this.renderDay(day, 'other-month');
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      const classes = [];
      
      // Today
      if (this.isSameDay(date, this.today)) {
        classes.push('today');
      }
      
      // Selected
      if (this.selectedDate && this.isSameDay(date, this.selectedDate)) {
        classes.push('selected');
      }
      
      // Weekend
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        classes.push('weekend');
      }
      
      // Disabled
      if (this.isDisabled(date)) {
        classes.push('disabled');
      }
      
      // Has events
      const hasEvents = this.getEventsForDate(date).length > 0;
      if (hasEvents) {
        classes.push('has-events');
      }
      
      html += this.renderDay(day, classes.join(' '), date.toISOString());
    }
    
    // Next month days
    const totalCells = startDayOfWeek + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
      html += this.renderDay(day, 'other-month');
    }
    
    return html;
  }
  
  /**
   * Render single day
   */
  renderDay(day, classes = '', dateAttr = '') {
    const events = dateAttr ? this.getEventsForDate(new Date(dateAttr)) : [];
    
    return `
      <div class="calendar__day ${classes}" 
           data-date="${dateAttr}"
           ${!classes.includes('disabled') ? 'role="button" tabindex="0"' : ''}>
        <span class="calendar__day-number">${day}</span>
        ${events.length > 0 ? `
          <div class="calendar__day-events">
            ${events.slice(0, 3).map(event => `
              <div class="calendar__event calendar__event--${event.type || 'default'}" 
                   title="${event.title}">
                ${event.title}
              </div>
            `).join('')}
            ${events.length > 3 ? `<div class="calendar__event-more">+${events.length - 3}</div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * Get events for date
   */
  getEventsForDate(date) {
    return (this.options.events || []).filter(event => {
      const eventDate = new Date(event.date || event.startDate);
      return this.isSameDay(eventDate, date);
    });
  }
  
  /**
   * Check if same day
   */
  isSameDay(date1, date2) {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
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
   * Navigate to previous month
   */
  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.render();
    this.bindDayEvents();
    
    if (this.options.onMonthChange) {
      this.options.onMonthChange(this.currentYear, this.currentMonth);
    }
  }
  
  /**
   * Navigate to next month
   */
  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.render();
    this.bindDayEvents();
    
    if (this.options.onMonthChange) {
      this.options.onMonthChange(this.currentYear, this.currentMonth);
    }
  }
  
  /**
   * Select date
   */
  selectDate(date) {
    if (this.isDisabled(date)) return;
    
    this.selectedDate = date;
    this.render();
    this.bindDayEvents();
    
    if (this.options.onSelect) {
      this.options.onSelect(date);
    }
  }
  
  /**
   * Go to today
   */
  goToToday() {
    this.currentYear = this.today.getFullYear();
    this.currentMonth = this.today.getMonth();
    this.selectDate(this.today);
  }
  
  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedDate = null;
    this.render();
    this.bindDayEvents();
    
    if (this.options.onSelect) {
      this.options.onSelect(null);
    }
  }
  
  /**
   * Set events
   */
  setEvents(events) {
    this.options.events = events || [];
    this.render();
    this.bindDayEvents();
  }
  
  /**
   * Add event
   */
  addEvent(event) {
    this.options.events.push(event);
    this.render();
    this.bindDayEvents();
  }
  
  /**
   * Get selected date
   */
  getSelectedDate() {
    return this.selectedDate;
  }
  
  /**
   * Set year and month
   */
  setYearMonth(year, month) {
    this.currentYear = year;
    this.currentMonth = month;
    this.render();
    this.bindDayEvents();
  }
  
  /**
   * Bind events
   */
  bindEvents() {
    this.container.querySelector('#cal-prev-month')?.addEventListener('click', () => this.prevMonth());
    this.container.querySelector('#cal-next-month')?.addEventListener('click', () => this.nextMonth());
    this.container.querySelector('#cal-today')?.addEventListener('click', () => this.goToToday());
    this.container.querySelector('#cal-clear')?.addEventListener('click', () => this.clearSelection());
    
    this.bindDayEvents();
  }
  
  /**
   * Bind day click events
   */
  bindDayEvents() {
    this.container.querySelectorAll('.calendar__day:not(.disabled):not(.other-month)').forEach(day => {
      day.addEventListener('click', () => {
        const dateStr = day.dataset.date;
        if (dateStr) {
          this.selectDate(new Date(dateStr));
        }
      });
    });
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Calendar };
}
