/**
 * ============================================
 * CALENDAR COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL INTERACTIVE CALENDAR - SIAP PRODUKSI
 * Mendukung: Event Display, Date Selection, 
 * Range Selection, Multiple Views, API Integration
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class Calendar {
  constructor(options = {}) {
    this.options = {
      container: null,
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
      selectedDate: null,
      selectedRange: null, // { start: Date, end: Date }
      minDate: null,
      maxDate: null,
      events: [],
      onSelect: null,
      onRangeSelect: null,
      onMonthChange: null,
      onEventClick: null,
      onEventAdd: null,
      onDateDoubleClick: null,
      locale: 'id-ID',
      firstDayOfWeek: 1, // 0 = Sunday, 1 = Monday
      showWeekNumbers: false,
      showAdjacentMonths: true,
      enableRangeSelection: false,
      enableMultipleSelection: false,
      view: 'month', // 'month', 'week', 'day'
      eventSources: [], // Array of API endpoints for events
      eventColors: {
        disposisi: { bg: '#D1E4FF', text: '#001D36', border: '#1976D2' },
        deadline: { bg: '#FFDAD6', text: '#410002', border: '#BA1A1A' },
        reminder: { bg: '#FFDDB4', text: '#2B1700', border: '#ED6C02' },
        meeting: { bg: '#C8E6C9', text: '#002204', border: '#2E7D32' },
        default: { bg: '#F3F0F4', text: '#1A1C1E', border: '#74777F' }
      },
      ...options
    };

    this.container = null;
    this.currentYear = this.options.year;
    this.currentMonth = this.options.month;
    this.selectedDate = this.options.selectedDate;
    this.selectedRange = this.options.selectedRange;
    this.selectedDates = new Set(); // Untuk multiple selection
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
    this.monthNames = [];
    this.dayNames = [];
    this.dayNamesFull = [];
    this.isRendered = false;
    this.weekViewStart = null;
    this.calendarId = 'cal-' + Math.random().toString(36).substr(2, 9);
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

    // Set container ID
    this.container.setAttribute('data-calendar-id', this.calendarId);

    // Initialize locale
    this.initLocale();

    // Load events from sources
    this.loadEventsFromSources();

    // Render calendar
    this.render();

    // Bind events
    this.bindEvents();

    this.isRendered = true;
    console.log('✅ Calendar initialized');
  }

  /**
   * Initialize locale
   */
  initLocale() {
    const locale = this.options.locale;

    // Month names
    this.monthNames = Array.from({ length: 12 }, (_, i) => {
      return new Date(2024, i, 1).toLocaleDateString(locale, { month: 'long' });
    });

    // Day names (short)
    this.dayNames = Array.from({ length: 7 }, (_, i) => {
      const day = (i + this.options.firstDayOfWeek) % 7;
      return new Date(2024, 0, day + 1).toLocaleDateString(locale, { weekday: 'short' });
    });

    // Day names (full)
    this.dayNamesFull = Array.from({ length: 7 }, (_, i) => {
      const day = (i + this.options.firstDayOfWeek) % 7;
      return new Date(2024, 0, day + 1).toLocaleDateString(locale, { weekday: 'long' });
    });
  }

  /**
   * Load events from API sources
   */
  async loadEventsFromSources() {
    if (!this.options.eventSources || this.options.eventSources.length === 0) return;

    for (const source of this.options.eventSources) {
      try {
        let events = [];

        if (typeof source === 'string') {
          // API endpoint
          const response = await this.fetchEvents(source);
          events = response.data || response || [];
        } else if (typeof source === 'function') {
          // Callback function
          events = await source(this.currentYear, this.currentMonth);
        } else if (Array.isArray(source)) {
          // Static array
          events = source;
        }

        // Normalize events
        const normalizedEvents = events.map(event => this.normalizeEvent(event));
        this.options.events = [...this.options.events, ...normalizedEvents];
      } catch (error) {
        console.warn(`Failed to load events from source:`, error);
      }
    }

    // Re-render if already rendered
    if (this.isRendered) {
      this.renderCalendar();
    }
  }

  /**
   * Fetch events from API
   */
  async fetchEvents(endpoint) {
    try {
      if (typeof API !== 'undefined') {
        return await API.get(endpoint, {
          year: this.currentYear,
          month: this.currentMonth + 1
        });
      }
      // Fallback fetch
      const response = await fetch(endpoint);
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch events:', error);
      return [];
    }
  }

  /**
   * Normalize event object
   */
  normalizeEvent(event) {
    return {
      id: event.id || ('evt-' + Math.random().toString(36).substr(2, 9)),
      title: event.title || event.instruksi || event.perihal || 'Event',
      date: event.date || event.batasWaktu || event.tanggal || event.createdAt,
      startDate: event.startDate || event.date,
      endDate: event.endDate || event.date,
      type: event.type || 'default',
      status: event.status || 'active',
      color: event.color || null,
      description: event.description || event.catatan || '',
      url: event.url || event.linkUrl || '',
      data: event.data || event,
      allDay: event.allDay || false
    };
  }

  /**
   * Render calendar
   */
  render() {
    if (!this.container) return;

    const view = this.options.view;

    switch (view) {
      case 'month':
        this.renderMonthView();
        break;
      case 'week':
        this.renderWeekView();
        break;
      case 'day':
        this.renderDayView();
        break;
      default:
        this.renderMonthView();
    }
  }

  /**
   * Render month view
   */
  renderMonthView() {
    this.container.innerHTML = `
      <div class="calendar" id="${this.calendarId}">
        <!-- Calendar Header -->
        <div class="calendar__header">
          <div class="calendar__nav">
            <button class="btn-icon btn-icon-sm cal-nav-btn" data-action="prev-year" title="Tahun Sebelumnya">
              <span class="material-icons">first_page</span>
            </button>
            <button class="btn-icon btn-icon-sm cal-nav-btn" data-action="prev-month" title="Bulan Sebelumnya">
              <span class="material-icons">chevron_left</span>
            </button>
          </div>
          
          <div class="calendar__title">
            <span class="calendar__month">${this.monthNames[this.currentMonth]}</span>
            <span class="calendar__year">${this.currentYear}</span>
          </div>
          
          <div class="calendar__nav">
            <button class="btn-icon btn-icon-sm cal-nav-btn" data-action="next-month" title="Bulan Berikutnya">
              <span class="material-icons">chevron_right</span>
            </button>
            <button class="btn-icon btn-icon-sm cal-nav-btn" data-action="next-year" title="Tahun Berikutnya">
              <span class="material-icons">last_page</span>
            </button>
          </div>
        </div>

        <!-- View Switcher -->
        <div class="calendar__view-switcher">
          <button class="btn btn-sm btn-ghost cal-view-btn ${this.options.view === 'month' ? 'active' : ''}" data-view="month">Bulan</button>
          <button class="btn btn-sm btn-ghost cal-view-btn ${this.options.view === 'week' ? 'active' : ''}" data-view="week">Minggu</button>
          <button class="btn btn-sm btn-ghost cal-view-btn ${this.options.view === 'day' ? 'active' : ''}" data-view="day">Hari</button>
          <button class="btn btn-sm btn-primary cal-today-btn" style="margin-left:auto">Hari Ini</button>
        </div>

        <!-- Calendar Body -->
        <div class="calendar__body">
          <!-- Day Names Header -->
          <div class="calendar__day-names">
            ${this.options.showWeekNumbers ? '<div class="calendar__week-number-header">#</div>' : ''}
            ${this.dayNames.map((name, index) => `
              <div class="calendar__day-name ${this.isWeekend(index) ? 'calendar__day-name--weekend' : ''}">
                <span class="calendar__day-name-short">${name}</span>
                <span class="calendar__day-name-full">${this.dayNamesFull[index]}</span>
              </div>
            `).join('')}
          </div>

          <!-- Days Grid -->
          <div class="calendar__days" id="cal-days-${this.calendarId}">
            ${this.renderMonthDays()}
          </div>
        </div>

        <!-- Calendar Footer -->
        <div class="calendar__footer">
          <div class="calendar__legend">
            ${this.renderLegend()}
          </div>
          <div class="calendar__actions">
            <button class="btn btn-ghost btn-sm cal-clear-btn" ${!this.selectedDate && !this.selectedRange ? 'disabled' : ''}>
              <span class="material-icons">clear</span> Hapus Pilihan
            </button>
            <span class="calendar__selected-info" id="cal-selected-info-${this.calendarId}">
              ${this.getSelectedInfoText()}
            </span>
          </div>
        </div>

        <!-- Event Detail Popup (hidden by default) -->
        <div class="calendar__event-popup" id="cal-popup-${this.calendarId}" style="display:none">
          <div class="calendar__event-popup-content">
            <button class="btn-icon btn-icon-sm cal-popup-close">
              <span class="material-icons">close</span>
            </button>
            <div class="calendar__event-popup-body" id="cal-popup-body-${this.calendarId}"></div>
          </div>
        </div>
      </div>
    `;

    this.bindDayEvents();
  }

  /**
   * Render month days grid
   */
  renderMonthDays() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() - this.options.firstDayOfWeek + 7) % 7;

    let html = '';

    // Previous month days
    if (this.options.showAdjacentMonths) {
      const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(this.currentYear, this.currentMonth - 1, day);
        html += this.renderDayCell(day, date, 'other-month');
      }
    } else {
      for (let i = 0; i < startDayOfWeek; i++) {
        html += '<div class="calendar__day calendar__day--empty"></div>';
      }
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      html += this.renderDayCell(day, date, '');
    }

    // Next month days
    if (this.options.showAdjacentMonths) {
      const totalCells = startDayOfWeek + daysInMonth;
      const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
      for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(this.currentYear, this.currentMonth + 1, day);
        html += this.renderDayCell(day, date, 'other-month');
      }
    }

    return html;
  }

  /**
   * Render single day cell
   */
  renderDayCell(day, date, extraClass) {
    const classes = ['calendar__day'];
    if (extraClass) classes.push('calendar__day--' + extraClass);

    // Today
    if (this.isSameDay(date, this.today)) {
      classes.push('calendar__day--today');
    }

    // Selected date
    if (this.selectedDate && this.isSameDay(date, this.selectedDate)) {
      classes.push('calendar__day--selected');
    }

    // Selected dates (multiple)
    if (this.options.enableMultipleSelection && this.selectedDates.has(date.toISOString().split('T')[0])) {
      classes.push('calendar__day--selected');
    }

    // Range selection
    if (this.selectedRange) {
      const start = this.selectedRange.start ? new Date(this.selectedRange.start) : null;
      const end = this.selectedRange.end ? new Date(this.selectedRange.end) : null;
      
      if (start && this.isSameDay(date, start)) {
        classes.push('calendar__day--range-start');
      } else if (end && this.isSameDay(date, end)) {
        classes.push('calendar__day--range-end');
      } else if (start && end && date > start && date < end) {
        classes.push('calendar__day--range-middle');
      }
    }

    // Weekend
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      classes.push('calendar__day--weekend');
    }

    // Disabled
    if (this.isDisabled(date)) {
      classes.push('calendar__day--disabled');
    }

    // Events
    const events = this.getEventsForDate(date);
    if (events.length > 0) {
      classes.push('calendar__day--has-events');
    }

    const dateISO = date.toISOString();
    const isClickable = !classes.includes('calendar__day--disabled') && !extraClass.includes('empty');

    return `
      <div class="${classes.join(' ')}" 
           data-date="${dateISO}"
           data-day="${day}"
           ${isClickable ? 'role="button" tabindex="0" aria-label="' + day + ' ' + this.monthNames[this.currentMonth] + ' ' + this.currentYear + '"' : ''}>
        ${this.options.showWeekNumbers && dayOfWeek === this.options.firstDayOfWeek ? 
          `<span class="calendar__week-number">${this.getWeekNumber(date)}</span>` : ''}
        <span class="calendar__day-number">${day}</span>
        ${events.length > 0 ? `
          <div class="calendar__day-events">
            ${events.slice(0, 3).map(event => this.renderEventDot(event)).join('')}
            ${events.length > 3 ? `<span class="calendar__event-more">+${events.length - 3}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render event dot/indicator
   */
  renderEventDot(event) {
    const colors = this.getEventColors(event);
    return `
      <div class="calendar__event calendar__event--${event.type || 'default'}" 
           data-event-id="${event.id}"
           title="${event.title}"
           style="background-color:${colors.bg};color:${colors.text};border-left:3px solid ${colors.border}">
        <span class="calendar__event-title">${event.title}</span>
      </div>
    `;
  }

  /**
   * Render week view
   */
  renderWeekView() {
    // Calculate week start
    const today = new Date();
    this.weekViewStart = this.getWeekStart(today);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(this.weekViewStart);
      date.setDate(date.getDate() + i);
      return date;
    });

    this.container.innerHTML = `
      <div class="calendar calendar--week" id="${this.calendarId}">
        <div class="calendar__header">
          <div class="calendar__nav">
            <button class="btn-icon btn-icon-sm cal-nav-btn" data-action="prev-week" title="Minggu Sebelumnya">
              <span class="material-icons">chevron_left</span>
            </button>
          </div>
          <div class="calendar__title">
            <span>${this.formatDate(days[0], 'd MMM')} - ${this.formatDate(days[6], 'd MMM yyyy')}</span>
          </div>
          <div class="calendar__nav">
            <button class="btn-icon btn-icon-sm cal-nav-btn" data-action="next-week" title="Minggu Berikutnya">
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
        </div>
        <div class="calendar__view-switcher">
          <button class="btn btn-sm btn-ghost cal-view-btn" data-view="month">Bulan</button>
          <button class="btn btn-sm btn-ghost cal-view-btn active" data-view="week">Minggu</button>
          <button class="btn btn-sm btn-ghost cal-view-btn" data-view="day">Hari</button>
          <button class="btn btn-sm btn-primary cal-today-btn" style="margin-left:auto">Hari Ini</button>
        </div>
        <div class="calendar__week-view">
          <div class="calendar__week-header">
            <div class="calendar__week-time-header"></div>
            ${days.map(day => `
              <div class="calendar__week-day-header ${this.isSameDay(day, this.today) ? 'calendar__week-day-header--today' : ''}">
                <span>${this.dayNamesFull[day.getDay()]}</span>
                <span class="calendar__week-day-date">${day.getDate()}</span>
              </div>
            `).join('')}
          </div>
          <div class="calendar__week-body">
            ${hours.map(hour => `
              <div class="calendar__week-row">
                <div class="calendar__week-time">${String(hour).padStart(2, '0')}:00</div>
                ${days.map(day => `
                  <div class="calendar__week-cell" 
                       data-date="${day.toISOString()}" 
                       data-hour="${hour}">
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.renderWeekEvents(days, hours);
    this.bindDayEvents();
  }

  /**
   * Render week events
   */
  renderWeekEvents(days, hours) {
    const allEvents = [];
    days.forEach(day => {
      const dayEvents = this.getEventsForDate(day);
      dayEvents.forEach(event => {
        allEvents.push({ ...event, _date: day });
      });
    });

    // Render events on the week view
    allEvents.forEach(event => {
      const eventDate = new Date(event._date);
      const dayIndex = days.findIndex(d => this.isSameDay(d, eventDate));
      if (dayIndex === -1) return;

      const colors = this.getEventColors(event);
      const cell = this.container.querySelector(
        `.calendar__week-cell[data-date="${eventDate.toISOString()}"]`
      );
      
      if (cell) {
        const eventEl = document.createElement('div');
        eventEl.className = 'calendar__week-event';
        eventEl.style.cssText = `
          background-color: ${colors.bg};
          color: ${colors.text};
          border-left: 3px solid ${colors.border};
          font-size: 11px;
          padding: 2px 4px;
          margin: 1px 2px;
          border-radius: 3px;
          cursor: pointer;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        `;
        eventEl.textContent = event.title;
        eventEl.title = event.title;
        eventEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showEventDetail(event, eventEl);
        });
        cell.appendChild(eventEl);
      }
    });
  }

  /**
   * Render day view
   */
  renderDayView() {
    const today = new Date();
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const events = this.getEventsForDate(this.selectedDate || today);

    this.container.innerHTML = `
      <div class="calendar calendar--day" id="${this.calendarId}">
        <div class="calendar__header">
          <div class="calendar__nav">
            <button class="btn-icon btn-icon-sm cal-nav-btn" data-action="prev-day" title="Hari Sebelumnya">
              <span class="material-icons">chevron_left</span>
            </button>
          </div>
          <div class="calendar__title">
            <span>${this.formatDate(this.selectedDate || today, 'EEEE, d MMMM yyyy')}</span>
          </div>
          <div class="calendar__nav">
            <button class="btn-icon btn-icon-sm cal-nav-btn" data-action="next-day" title="Hari Berikutnya">
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
        </div>
        <div class="calendar__view-switcher">
          <button class="btn btn-sm btn-ghost cal-view-btn" data-view="month">Bulan</button>
          <button class="btn btn-sm btn-ghost cal-view-btn" data-view="week">Minggu</button>
          <button class="btn btn-sm btn-ghost cal-view-btn active" data-view="day">Hari</button>
          <button class="btn btn-sm btn-primary cal-today-btn" style="margin-left:auto">Hari Ini</button>
        </div>
        <div class="calendar__day-view">
          ${hours.map(hour => `
            <div class="calendar__day-row">
              <div class="calendar__day-time">${String(hour).padStart(2, '0')}:00</div>
              <div class="calendar__day-content" data-hour="${hour}">
                ${events.filter(e => {
                  const eventHour = new Date(e.date || e.startDate).getHours();
                  return eventHour === hour;
                }).map(event => {
                  const colors = this.getEventColors(event);
                  return `
                    <div class="calendar__day-event" 
                         style="background-color:${colors.bg};color:${colors.text};border-left:3px solid ${colors.border}"
                         data-event-id="${event.id}">
                      <strong>${event.title}</strong>
                      ${event.description ? `<p>${event.description}</p>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.bindDayEvents();
  }

  /**
   * Render legend
   */
  renderLegend() {
    const legendItems = [];
    const types = new Set(this.options.events.map(e => e.type));

    types.forEach(type => {
      const colors = this.getEventColors({ type });
      legendItems.push(`
        <span class="calendar__legend-item">
          <span class="calendar__legend-dot" style="background-color:${colors.border}"></span>
          <span>${this.getTypeLabel(type)}</span>
        </span>
      `);
    });

    return legendItems.length > 0 ? legendItems.join('') : '';
  }

  /**
   * Get event colors
   */
  getEventColors(event) {
    const colors = this.options.eventColors;
    if (event.color) {
      return { bg: event.color + '33', text: event.color, border: event.color };
    }
    return colors[event.type] || colors.default;
  }

  /**
   * Get type label
   */
  getTypeLabel(type) {
    const labels = {
      'disposisi': 'Disposisi',
      'deadline': 'Tenggat',
      'reminder': 'Pengingat',
      'meeting': 'Rapat',
      'default': 'Lainnya'
    };
    return labels[type] || type;
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
   * Show event detail popup
   */
  showEventDetail(event, targetElement) {
    const popup = this.container.querySelector(`#cal-popup-${this.calendarId}`);
    const body = this.container.querySelector(`#cal-popup-body-${this.calendarId}`);
    if (!popup || !body) return;

    const colors = this.getEventColors(event);

    body.innerHTML = `
      <div class="calendar__event-detail" style="border-left:4px solid ${colors.border}">
        <h4 style="color:${colors.text}">${event.title}</h4>
        <p class="calendar__event-date">
          <span class="material-icons">event</span>
          ${this.formatDate(event.date || event.startDate, 'dd MMMM yyyy')}
          ${event.endDate ? ' - ' + this.formatDate(event.endDate, 'dd MMMM yyyy') : ''}
        </p>
        ${event.description ? `<p class="calendar__event-desc">${event.description}</p>` : ''}
        <p class="calendar__event-type">
          <span class="badge" style="background-color:${colors.bg};color:${colors.text}">${this.getTypeLabel(event.type)}</span>
          ${event.status ? `<span class="badge">${event.status}</span>` : ''}
        </p>
        ${event.url ? `
          <a href="${event.url}" class="btn btn-sm btn-primary" style="margin-top:8px">
            <span class="material-icons">open_in_new</span> Buka
          </a>
        ` : ''}
        ${this.options.onEventClick ? `
          <button class="btn btn-sm btn-secondary view-event-btn" style="margin-top:8px;margin-left:8px">
            <span class="material-icons">visibility</span> Detail
          </button>
        ` : ''}
      </div>
    `;

    // Position popup near target
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      popup.style.top = (rect.top - containerRect.top + rect.height + 8) + 'px';
      popup.style.left = Math.min(rect.left - containerRect.left, containerRect.width - 320) + 'px';
    }

    popup.style.display = 'block';

    // Close button
    const closeBtn = body.querySelector('.cal-popup-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        popup.style.display = 'none';
      });
    }

    // View event button
    const viewBtn = body.querySelector('.view-event-btn');
    if (viewBtn && this.options.onEventClick) {
      viewBtn.addEventListener('click', () => {
        this.options.onEventClick(event);
        popup.style.display = 'none';
      });
    }

    // Close on outside click
    const closePopup = (e) => {
      if (!popup.contains(e.target) && !targetElement?.contains(e.target)) {
        popup.style.display = 'none';
        document.removeEventListener('click', closePopup);
      }
    };
    setTimeout(() => document.addEventListener('click', closePopup), 100);
  }

  /**
   * Get selected info text
   */
  getSelectedInfoText() {
    if (this.selectedDate) {
      return `Dipilih: ${this.formatDate(this.selectedDate, 'd MMMM yyyy')}`;
    }
    if (this.selectedRange?.start && this.selectedRange?.end) {
      return `${this.formatDate(this.selectedRange.start, 'd MMM')} - ${this.formatDate(this.selectedRange.end, 'd MMM yyyy')}`;
    }
    return '';
  }

  /**
   * Check if same day
   */
  isSameDay(date1, date2) {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * Check if weekend
   */
  isWeekend(dayIndex) {
    const day = (dayIndex + this.options.firstDayOfWeek) % 7;
    return day === 0 || day === 6;
  }

  /**
   * Check if date is disabled
   */
  isDisabled(date) {
    if (this.options.minDate && new Date(date) < new Date(this.options.minDate)) return true;
    if (this.options.maxDate && new Date(date) > new Date(this.options.maxDate)) return true;
    return false;
  }

  /**
   * Get week number
   */
  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  /**
   * Get week start date
   */
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : this.options.firstDayOfWeek);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Format date
   */
  formatDate(date, format) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const locale = this.options.locale;
    const options = {};

    if (format.includes('EEEE')) options.weekday = 'long';
    if (format.includes('d')) options.day = 'numeric';
    if (format.includes('MMMM')) options.month = 'long';
    if (format.includes('MMM')) options.month = 'short';
    if (format.includes('yyyy')) options.year = 'numeric';

    return d.toLocaleDateString(locale, options);
  }

  /**
   * Navigate months
   */
  navigate(action) {
    switch (action) {
      case 'prev-month':
        if (this.currentMonth === 0) {
          this.currentMonth = 11;
          this.currentYear--;
        } else {
          this.currentMonth--;
        }
        break;
      case 'next-month':
        if (this.currentMonth === 11) {
          this.currentMonth = 0;
          this.currentYear++;
        } else {
          this.currentMonth++;
        }
        break;
      case 'prev-year':
        this.currentYear--;
        break;
      case 'next-year':
        this.currentYear++;
        break;
      case 'prev-week':
        this.weekViewStart.setDate(this.weekViewStart.getDate() - 7);
        break;
      case 'next-week':
        this.weekViewStart.setDate(this.weekViewStart.getDate() + 7);
        break;
      case 'prev-day':
        if (this.selectedDate) {
          this.selectedDate.setDate(this.selectedDate.getDate() - 1);
        }
        break;
      case 'next-day':
        if (this.selectedDate) {
          this.selectedDate.setDate(this.selectedDate.getDate() + 1);
        }
        break;
    }

    this.render();

    // Emit month change event
    if (this.options.onMonthChange) {
      this.options.onMonthChange(this.currentYear, this.currentMonth);
    }

    // Reload events for new month
    this.loadEventsFromSources();
  }

  /**
   * Switch view
   */
  switchView(view) {
    this.options.view = view;
    this.render();
  }

  /**
   * Go to today
   */
  goToToday() {
    this.currentYear = this.today.getFullYear();
    this.currentMonth = this.today.getMonth();
    this.weekViewStart = this.getWeekStart(this.today);
    this.selectDate(new Date(this.today));
  }

  /**
   * Select date
   */
  selectDate(date) {
    if (this.isDisabled(date)) return;

    if (this.options.enableRangeSelection) {
      this.handleRangeSelection(date);
    } else if (this.options.enableMultipleSelection) {
      this.handleMultipleSelection(date);
    } else {
      this.selectedDate = date;
    }

    this.render();

    if (this.options.onSelect) {
      this.options.onSelect(date);
    }
  }

  /**
   * Handle range selection
   */
  handleRangeSelection(date) {
    if (!this.selectedRange?.start || (this.selectedRange?.start && this.selectedRange?.end)) {
      // Start new range
      this.selectedRange = { start: date, end: null };
    } else {
      // Complete range
      const start = this.selectedRange.start;
      this.selectedRange = {
        start: start < date ? start : date,
        end: start < date ? date : start
      };
      if (this.options.onRangeSelect) {
        this.options.onRangeSelect(this.selectedRange);
      }
    }
  }

  /**
   * Handle multiple selection
   */
  handleMultipleSelection(date) {
    const dateKey = date.toISOString().split('T')[0];
    if (this.selectedDates.has(dateKey)) {
      this.selectedDates.delete(dateKey);
    } else {
      this.selectedDates.add(dateKey);
    }
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedDate = null;
    this.selectedRange = null;
    this.selectedDates.clear();
    this.render();

    if (this.options.onSelect) {
      this.options.onSelect(null);
    }
  }

  /**
   * Set events
   */
  setEvents(events) {
    this.options.events = (events || []).map(e => this.normalizeEvent(e));
    this.render();
  }

  /**
   * Add single event
   */
  addEvent(event) {
    this.options.events.push(this.normalizeEvent(event));
    if (this.isRendered) {
      this.render();
    }
    if (this.options.onEventAdd) {
      this.options.onEventAdd(event);
    }
  }

  /**
   * Get selected date
   */
  getSelectedDate() {
    return this.selectedDate;
  }

  /**
   * Get selected range
   */
  getSelectedRange() {
    return this.selectedRange;
  }

  /**
   * Get selected dates
   */
  getSelectedDates() {
    return Array.from(this.selectedDates).map(d => new Date(d));
  }

  /**
   * Set year and month
   */
  setYearMonth(year, month) {
    this.currentYear = year;
    this.currentMonth = month;
    if (this.isRendered) this.render();
  }

  /**
   * Bind all events
   */
  bindEvents() {
    if (!this.container) return;

    // Navigation buttons
    this.container.querySelectorAll('.cal-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigate(btn.dataset.action);
      });
    });

    // View switcher buttons
    this.container.querySelectorAll('.cal-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchView(btn.dataset.view);
      });
    });

    // Today button
    const todayBtn = this.container.querySelector('.cal-today-btn');
    if (todayBtn) {
      todayBtn.addEventListener('click', () => this.goToToday());
    }

    // Clear button
    const clearBtn = this.container.querySelector('.cal-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearSelection());
    }

    // Bind day cell events
    this.bindDayEvents();

    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.navigate('prev-day');
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.navigate('next-day');
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navigate('prev-week');
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.navigate('next-week');
          break;
        case 't':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.goToToday();
          }
          break;
      }
    });

    // Close popup on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const popup = this.container.querySelector(`#cal-popup-${this.calendarId}`);
        if (popup && popup.style.display !== 'none') {
          popup.style.display = 'none';
        }
      }
    });
  }

  /**
   * Bind day cell events
   */
  bindDayEvents() {
    if (!this.container) return;

    const dayCells = this.container.querySelectorAll('.calendar__day:not(.calendar__day--disabled):not(.calendar__day--empty)');

    dayCells.forEach(day => {
      // Click handler
      day.addEventListener('click', () => {
        const dateStr = day.dataset.date;
        if (dateStr) {
          this.selectDate(new Date(dateStr));
        }
      });

      // Double click handler
      day.addEventListener('dblclick', () => {
        const dateStr = day.dataset.date;
        if (dateStr && this.options.onDateDoubleClick) {
          this.options.onDateDoubleClick(new Date(dateStr));
        }
      });

      // Event click handler (delegation)
      day.querySelectorAll('.calendar__event').forEach(eventEl => {
        eventEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const eventId = eventEl.dataset.eventId;
          const event = this.options.events.find(evt => evt.id === eventId);
          if (event) {
            this.showEventDetail(event, eventEl);
          }
        });
      });
    });
  }

  /**
   * Refresh calendar
   */
  refresh() {
    this.options.events = [];
    this.loadEventsFromSources();
    this.render();
  }

  /**
   * Destroy calendar
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
      this.container.removeAttribute('data-calendar-id');
    }
    this.isRendered = false;
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Calendar };
}
