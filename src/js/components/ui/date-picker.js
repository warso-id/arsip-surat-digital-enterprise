/**
 * ============================================
 * DATE PICKER COMPONENT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL DATE PICKER WITH RANGE & TIME - SIAP PRODUKSI
 * Mendukung: Single Date, Range, Time, Format,
 * Min/Max, Disabled Dates, API Integration
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class DatePicker {
  constructor(options = {}) {
    this.options = {
      container: null,
      value: null,
      valueEnd: null,
      minDate: null,
      maxDate: null,
      format: 'DD/MM/YYYY',
      displayFormat: null,
      placeholder: 'Pilih tanggal',
      placeholderEnd: 'Tanggal akhir',
      locale: 'id-ID',
      firstDayOfWeek: 1,
      mode: 'single',
      showTime: false,
      timeFormat: '24h',
      timeInterval: 30,
      disabledDates: [],
      disabledDays: [],
      highlightedDates: [],
      showWeekNumbers: false,
      showMonthPicker: true,
      showYearPicker: true,
      showClearButton: true,
      showTodayButton: true,
      autoClose: true,
      autoApply: false,
      closeOnSelect: true,
      position: 'bottom-left',
      zIndex: 1100,
      onChange: null,
      onOpen: null,
      onClose: null,
      onMonthChange: null,
      ...options
    };

    this.container = null;
    this.input = null;
    this.inputEnd = null;
    this.dropdown = null;
    this.currentYear = null;
    this.currentMonth = null;
    this.selectedDate = null;
    this.selectedDateEnd = null;
    this.isOpen = false;
    this.isRangeSelecting = false;
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);
    this.pickerId = 'datepick-' + Math.random().toString(36).substr(2, 9);
    this.selectedTime = null;
    this.selectedTimeEnd = null;
    this.monthNames = [];
    this.dayNamesShort = [];
    this.dayNamesMin = [];
  }

  init() {
    this.container = this.options.container;
    if (!this.container) {
      console.error('DatePicker: container is required');
      return;
    }

    this.container.setAttribute('data-picker-id', this.pickerId);
    this.initLocale();
    
    if (this.options.value) {
      this.selectedDate = new Date(this.options.value);
      this.selectedDate.setHours(0, 0, 0, 0);
      if (this.options.showTime && this.options.value) {
        const d = new Date(this.options.value);
        this.selectedTime = { hours: d.getHours(), minutes: d.getMinutes() };
      }
    }
    if (this.options.valueEnd) {
      this.selectedDateEnd = new Date(this.options.valueEnd);
      this.selectedDateEnd.setHours(0, 0, 0, 0);
    }

    this.currentYear = this.selectedDate ? this.selectedDate.getFullYear() : this.today.getFullYear();
    this.currentMonth = this.selectedDate ? this.selectedDate.getMonth() : this.today.getMonth();

    this.render();
    this.bindEvents();
    console.log('✅ DatePicker initialized');
  }

  initLocale() {
    const locale = this.options.locale;
    this.monthNames = Array.from({ length: 12 }, (_, i) =>
      new Date(2024, i, 1).toLocaleDateString(locale, { month: 'long' })
    );
    this.dayNamesShort = Array.from({ length: 7 }, (_, i) => {
      const day = (i + this.options.firstDayOfWeek) % 7;
      return new Date(2024, 0, day + 1).toLocaleDateString(locale, { weekday: 'short' });
    });
    this.dayNamesMin = Array.from({ length: 7 }, (_, i) => {
      const day = (i + this.options.firstDayOfWeek) % 7;
      return new Date(2024, 0, day + 1).toLocaleDateString(locale, { weekday: 'narrow' });
    });
  }

  render() {
    const mode = this.options.mode;
    const showRange = mode === 'range';
    
    this.container.innerHTML = `
      <div class="date-picker" id="datepick-${this.pickerId}">
        <div class="date-picker__input-area">
          <div class="input-with-icon ${showRange ? 'date-picker__input--range' : ''}">
            <span class="input-with-icon__icon input-with-icon__icon--left material-icons">calendar_today</span>
            <input type="text" class="form-input" id="date-input-${this.pickerId}" 
                   placeholder="${this.options.placeholder}" 
                   value="${this.selectedDate ? this.formatDate(this.selectedDate) : ''}"
                   readonly autocomplete="off">
            ${showRange ? `
              <span class="date-picker__range-separator">—</span>
              <input type="text" class="form-input" id="date-input-end-${this.pickerId}" 
                     placeholder="${this.options.placeholderEnd}" 
                     value="${this.selectedDateEnd ? this.formatDate(this.selectedDateEnd) : ''}"
                     readonly autocomplete="off">
            ` : ''}
            <span class="input-with-icon__icon input-with-icon__icon--right material-icons date-picker__clear-btn" 
                  id="date-clear-${this.pickerId}" 
                  style="display:${this.selectedDate ? 'flex' : 'none'};cursor:pointer"
                  title="Hapus tanggal">close</span>
          </div>
        </div>

        <div class="date-picker__dropdown" id="date-dropdown-${this.pickerId}" style="display:none">
          <div class="date-picker__header">
            <div class="date-picker__nav">
              <button class="btn-icon btn-icon-sm" data-action="prev-year" title="Tahun Sebelumnya">
                <span class="material-icons">first_page</span>
              </button>
              <button class="btn-icon btn-icon-sm" data-action="prev-month" title="Bulan Sebelumnya">
                <span class="material-icons">chevron_left</span>
              </button>
            </div>
            <div class="date-picker__month-year">
              ${this.options.showMonthPicker ? `
                <select id="date-month-${this.pickerId}" class="date-picker__select">
                  ${this.monthNames.map((n, i) => `<option value="${i}" ${i === this.currentMonth ? 'selected' : ''}>${n}</option>`).join('')}
                </select>
              ` : `<span class="date-picker__month-label">${this.monthNames[this.currentMonth]}</span>`}
              ${this.options.showYearPicker ? `
                <select id="date-year-${this.pickerId}" class="date-picker__select">
                  ${this.getYearOptions()}
                </select>
              ` : `<span class="date-picker__year-label">${this.currentYear}</span>`}
            </div>
            <div class="date-picker__nav">
              <button class="btn-icon btn-icon-sm" data-action="next-month" title="Bulan Berikutnya">
                <span class="material-icons">chevron_right</span>
              </button>
              <button class="btn-icon btn-icon-sm" data-action="next-year" title="Tahun Berikutnya">
                <span class="material-icons">last_page</span>
              </button>
            </div>
          </div>

          <div class="date-picker__days-header">
            ${this.options.showWeekNumbers ? '<div class="date-picker__week-header">#</div>' : ''}
            ${this.dayNamesMin.map((n, i) => `
              <div class="date-picker__day-name ${this.isWeekend(i) ? 'date-picker__day-name--weekend' : ''}">${n}</div>
            `).join('')}
          </div>

          <div class="date-picker__days" id="date-days-${this.pickerId}">
            ${this.renderDays()}
          </div>

          ${this.options.showTime ? this.renderTimePicker() : ''}

          <div class="date-picker__footer">
            <div class="date-picker__footer-left">
              ${this.options.showTodayButton ? `
                <button class="btn btn-ghost btn-sm" data-action="today">Hari Ini</button>
              ` : ''}
              ${this.options.showClearButton ? `
                <button class="btn btn-ghost btn-sm" data-action="clear" 
                        style="display:${this.selectedDate ? 'flex' : 'none'}">Hapus</button>
              ` : ''}
            </div>
            <div class="date-picker__footer-right">
              ${!this.options.autoApply ? `
                <button class="btn btn-ghost btn-sm" data-action="cancel">Batal</button>
                <button class="btn btn-primary btn-sm" data-action="apply">Terapkan</button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    this.input = this.container.querySelector(`#date-input-${this.pickerId}`);
    this.inputEnd = this.container.querySelector(`#date-input-end-${this.pickerId}`);
    this.dropdown = this.container.querySelector(`#date-dropdown-${this.pickerId}`);
  }

  renderTimePicker() {
    const hours = this.selectedTime?.hours ?? (this.today.getHours());
    const minutes = this.selectedTime?.minutes ?? (this.today.getMinutes());
    const interval = this.options.timeInterval;
    const is24h = this.options.timeFormat === '24h';

    let hoursOptions = '';
    if (is24h) {
      for (let h = 0; h < 24; h++) {
        hoursOptions += `<option value="${h}" ${h === hours ? 'selected' : ''}>${String(h).padStart(2, '0')}</option>`;
      }
    } else {
      for (let h = 1; h <= 12; h++) {
        hoursOptions += `<option value="${h}" ${h === (hours % 12 || 12) ? 'selected' : ''}>${String(h).padStart(2, '0')}</option>`;
      }
    }

    let minutesOptions = '';
    for (let m = 0; m < 60; m += interval) {
      minutesOptions += `<option value="${m}" ${m === Math.round(minutes / interval) * interval ? 'selected' : ''}>${String(m).padStart(2, '0')}</option>`;
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';

    return `
      <div class="date-picker__time">
        <div class="date-picker__time-label">⏰ Waktu</div>
        <div class="date-picker__time-inputs">
          <select id="time-hours-${this.pickerId}" class="date-picker__select date-picker__time-select">${hoursOptions}</select>
          <span class="date-picker__time-separator">:</span>
          <select id="time-minutes-${this.pickerId}" class="date-picker__select date-picker__time-select">${minutesOptions}</select>
          ${!is24h ? `
            <select id="time-ampm-${this.pickerId}" class="date-picker__select date-picker__time-select">
              <option value="AM" ${!ampm || ampm === 'AM' ? 'selected' : ''}>AM</option>
              <option value="PM" ${ampm === 'PM' ? 'selected' : ''}>PM</option>
            </select>
          ` : ''}
        </div>
      </div>
    `;
  }

  getYearOptions() {
    const currentYear = this.today.getFullYear();
    const minYear = this.options.minDate ? new Date(this.options.minDate).getFullYear() : currentYear - 100;
    const maxYear = this.options.maxDate ? new Date(this.options.maxDate).getFullYear() : currentYear + 100;
    const years = [];
    for (let y = minYear; y <= maxYear; y++) {
      years.push(`<option value="${y}" ${y === this.currentYear ? 'selected' : ''}>${y}</option>`);
    }
    return years.join('');
  }

  renderDays() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = (firstDay.getDay() - this.options.firstDayOfWeek + 7) % 7;

    let html = '';

    if (this.options.showWeekNumbers) {
      const weekNum = this.getWeekNumber(firstDay);
      for (let i = startDay - 1; i >= 0; i--) {
        const d = new Date(this.currentYear, this.currentMonth, -i);
        html += `<div class="date-picker__week">${this.getWeekNumber(d)}</div>`;
      }
      for (let day = 1; day <= daysInMonth; day++) {
        if ((startDay + day - 1) % 7 === 0) {
          html += `<div class="date-picker__week">${this.getWeekNumber(new Date(this.currentYear, this.currentMonth, day))}</div>`;
        }
      }
    }

    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(this.currentYear, this.currentMonth - 1, prevMonthLastDay - i);
      html += `<div class="date-picker__day date-picker__day--other" data-date="${d.toISOString()}">${prevMonthLastDay - i}</div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      const classes = [];
      const dateStr = date.toISOString().split('T')[0];

      if (this.isToday(date)) classes.push('date-picker__day--today');
      if (this.isSelected(date)) classes.push('date-picker__day--selected');
      if (this.isRangeStart(date)) classes.push('date-picker__day--range-start');
      if (this.isRangeEnd(date)) classes.push('date-picker__day--range-end');
      if (this.isInRange(date)) classes.push('date-picker__day--in-range');
      if (this.isDisabled(date)) classes.push('date-picker__day--disabled');
      if (date.getDay() === 0 || date.getDay() === 6) classes.push('date-picker__day--weekend');
      if (this.options.highlightedDates.includes(dateStr)) classes.push('date-picker__day--highlighted');

      html += `
        <div class="date-picker__day ${classes.join(' ')}" 
             data-date="${date.toISOString()}"
             ${this.isDisabled(date) ? 'aria-disabled="true"' : 'role="button" tabindex="0"'}>
          <span class="date-picker__day-number">${day}</span>
          ${this.options.highlightedDates.includes(dateStr) ? '<span class="date-picker__day-dot"></span>' : ''}
        </div>
      `;
    }

    const totalCells = startDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(this.currentYear, this.currentMonth + 1, day);
      html += `<div class="date-picker__day date-picker__day--other" data-date="${d.toISOString()}">${day}</div>`;
    }

    return html;
  }

  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  isWeekend(index) {
    const day = (index + this.options.firstDayOfWeek) % 7;
    return day === 0 || day === 6;
  }

  isToday(date) {
    return date.toDateString() === this.today.toDateString();
  }

  isSelected(date) {
    return this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
  }

  isRangeStart(date) {
    return this.selectedDate && date.toDateString() === this.selectedDate.toDateString() && this.options.mode === 'range';
  }

  isRangeEnd(date) {
    return this.selectedDateEnd && date.toDateString() === this.selectedDateEnd.toDateString();
  }

  isInRange(date) {
    if (!this.selectedDate || !this.selectedDateEnd) return false;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const start = new Date(Math.min(this.selectedDate, this.selectedDateEnd));
    start.setHours(0, 0, 0, 0);
    const end = new Date(Math.max(this.selectedDate, this.selectedDateEnd));
    end.setHours(23, 59, 59, 999);
    return d > start && d < end;
  }

  isDisabled(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (this.options.minDate && d < new Date(this.options.minDate)) return true;
    if (this.options.maxDate && d > new Date(this.options.maxDate)) return true;
    if (this.options.disabledDays.includes(d.getDay())) return true;
    if (this.options.disabledDates.includes(d.toISOString().split('T')[0])) return true;
    return false;
  }

  selectDate(date) {
    if (this.isDisabled(date)) return;

    if (this.options.mode === 'range') {
      this.handleRangeSelection(date);
    } else {
      this.selectedDate = new Date(date);
      this.selectedDate.setHours(0, 0, 0, 0);
      
      if (this.options.showTime && this.selectedTime) {
        this.selectedDate.setHours(this.selectedTime.hours, this.selectedTime.minutes);
      }

      this.input.value = this.formatDate(this.selectedDate);
      
      if (this.options.closeOnSelect && !this.options.showTime) {
        this.close();
      }

      if (!this.options.autoApply) {
        this.refreshCalendar();
      }
    }

    this.updateClearButton();
    this.updateFooterButtons();

    if (this.options.onChange && !this.options.mode === 'range') {
      this.options.onChange(this.selectedDate, this.formatDate(this.selectedDate));
    }
  }

  handleRangeSelection(date) {
    if (!this.selectedDate || (this.selectedDate && this.selectedDateEnd)) {
      this.selectedDate = new Date(date);
      this.selectedDate.setHours(0, 0, 0, 0);
      this.selectedDateEnd = null;
      this.input.value = this.formatDate(this.selectedDate);
      if (this.inputEnd) this.inputEnd.value = '';
      this.isRangeSelecting = true;
    } else {
      if (date < this.selectedDate) {
        this.selectedDateEnd = new Date(this.selectedDate);
        this.selectedDate = new Date(date);
        this.selectedDate.setHours(0, 0, 0, 0);
      } else {
        this.selectedDateEnd = new Date(date);
        this.selectedDateEnd.setHours(23, 59, 59, 999);
      }
      
      this.isRangeSelecting = false;
      this.input.value = this.formatDate(this.selectedDate);
      if (this.inputEnd) this.inputEnd.value = this.formatDate(this.selectedDateEnd);

      if (this.options.closeOnSelect) this.close();
      
      if (this.options.onChange) {
        this.options.onChange(
          { start: this.selectedDate, end: this.selectedDateEnd },
          `${this.formatDate(this.selectedDate)} — ${this.formatDate(this.selectedDateEnd)}`
        );
      }
    }
    this.refreshCalendar();
  }

  clearDate() {
    this.selectedDate = null;
    this.selectedDateEnd = null;
    this.selectedTime = null;
    if (this.input) this.input.value = '';
    if (this.inputEnd) this.inputEnd.value = '';
    this.updateClearButton();
    this.updateFooterButtons();
    if (this.options.onChange) this.options.onChange(null, '');
    if (this.isOpen) this.refreshCalendar();
  }

  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const fmt = this.options.displayFormat || this.options.format;
    let result = fmt.replace('DD', day).replace('MM', month).replace('YYYY', year).replace('YY', String(year).slice(-2));
    if (this.options.showTime && this.selectedTime) {
      const h = String(this.selectedTime.hours).padStart(2, '0');
      const m = String(this.selectedTime.minutes).padStart(2, '0');
      result += ` ${h}:${m}`;
    }
    return result;
  }

  open() {
    this.isOpen = true;
    this.dropdown.style.display = 'block';
    this.dropdown.style.zIndex = this.options.zIndex;
    this.positionDropdown();
    this.refreshCalendar();
    if (this.options.onOpen) this.options.onOpen();
  }

  close() {
    this.isOpen = false;
    this.dropdown.style.display = 'none';
    if (this.options.onClose) this.options.onClose();
  }

  positionDropdown() {
    if (!this.dropdown) return;
    const inputRect = this.input.getBoundingClientRect();
    const dropdownHeight = this.dropdown.offsetHeight || 400;
    const spaceBelow = window.innerHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;

    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      this.dropdown.style.top = 'auto';
      this.dropdown.style.bottom = `${window.innerHeight - inputRect.top}px`;
    } else {
      this.dropdown.style.top = `${inputRect.bottom}px`;
      this.dropdown.style.bottom = 'auto';
    }

    if (this.options.position.includes('right')) {
      this.dropdown.style.left = 'auto';
      this.dropdown.style.right = '0';
    } else {
      this.dropdown.style.left = '0';
      this.dropdown.style.right = 'auto';
    }
  }

  refreshCalendar() {
    const monthSelect = this.container.querySelector(`#date-month-${this.pickerId}`);
    const yearSelect = this.container.querySelector(`#date-year-${this.pickerId}`);
    const daysGrid = this.container.querySelector(`#date-days-${this.pickerId}`);
    const monthLabel = this.container.querySelector('.date-picker__month-label');
    const yearLabel = this.container.querySelector('.date-picker__year-label');

    if (monthSelect) monthSelect.value = this.currentMonth;
    if (yearSelect) yearSelect.value = this.currentYear;
    if (monthLabel) monthLabel.textContent = this.monthNames[this.currentMonth];
    if (yearLabel) yearLabel.textContent = this.currentYear;
    if (daysGrid) daysGrid.innerHTML = this.renderDays();

    const timePicker = this.container.querySelector('.date-picker__time');
    if (timePicker && this.options.showTime) {
      timePicker.outerHTML = this.renderTimePicker();
    }
  }

  navigate(action) {
    switch (action) {
      case 'prev-month':
        if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
        else this.currentMonth--;
        break;
      case 'next-month':
        if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
        else this.currentMonth++;
        break;
      case 'prev-year': this.currentYear--; break;
      case 'next-year': this.currentYear++; break;
    }
    this.refreshCalendar();
    if (this.options.onMonthChange) {
      this.options.onMonthChange(this.currentYear, this.currentMonth);
    }
  }

  updateClearButton() {
    const clearBtn = this.container.querySelector(`#date-clear-${this.pickerId}`);
    const hasValue = this.selectedDate || this.selectedDateEnd;
    if (clearBtn) clearBtn.style.display = hasValue ? 'flex' : 'none';
  }

  updateFooterButtons() {
    const clearBtn = this.container.querySelector('[data-action="clear"]');
    if (clearBtn) clearBtn.style.display = (this.selectedDate || this.selectedDateEnd) ? 'flex' : 'none';
  }

  applyTime() {
    if (!this.options.showTime) return;
    const hoursEl = this.container.querySelector(`#time-hours-${this.pickerId}`);
    const minutesEl = this.container.querySelector(`#time-minutes-${this.pickerId}`);
    const ampmEl = this.container.querySelector(`#time-ampm-${this.pickerId}`);

    let hours = parseInt(hoursEl?.value) || 0;
    const minutes = parseInt(minutesEl?.value) || 0;

    if (ampmEl && this.options.timeFormat !== '24h') {
      const ampm = ampmEl.value;
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }

    this.selectedTime = { hours, minutes };
    if (this.selectedDate) {
      this.selectedDate.setHours(hours, minutes);
      this.input.value = this.formatDate(this.selectedDate);
    }
    if (this.options.onChange && this.selectedDate) {
      this.options.onChange(this.selectedDate, this.formatDate(this.selectedDate));
    }
  }

  getValue() { return this.selectedDate; }
  getValueEnd() { return this.selectedDateEnd; }
  getFormattedValue() { return this.selectedDate ? this.formatDate(this.selectedDate) : ''; }

  setValue(date) {
    if (date) {
      this.selectedDate = new Date(date);
      if (this.input) this.input.value = this.formatDate(this.selectedDate);
    } else {
      this.clearDate();
    }
  }

  bindEvents() {
    this.input.addEventListener('click', () => this.isOpen ? this.close() : this.open());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowDown' && !this.isOpen) this.open();
    });

    if (this.inputEnd) {
      this.inputEnd.addEventListener('click', () => !this.isOpen ? this.open() : null);
    }

    this.container.querySelector(`#date-clear-${this.pickerId}`)?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearDate();
      if (this.isOpen) this.close();
    });

    this.dropdown.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) {
        const action = btn.dataset.action;
        if (action === 'today') { this.selectDate(new Date()); if (!this.options.autoApply && !this.options.showTime) this.close(); }
        else if (action === 'clear') { this.clearDate(); }
        else if (action === 'cancel') { this.close(); }
        else if (action === 'apply') { this.applyTime(); if (this.options.onChange && this.selectedDate) this.options.onChange(this.selectedDate, this.formatDate(this.selectedDate)); this.close(); }
        else this.navigate(action);
        return;
      }

      const dayEl = e.target.closest('.date-picker__day');
      if (dayEl && !dayEl.classList.contains('date-picker__day--disabled')) {
        const dateStr = dayEl.dataset.date;
        if (dateStr) {
          this.selectDate(new Date(dateStr));
          if (this.options.autoApply && !this.options.showTime) this.close();
        }
      }
    });

    this.dropdown.addEventListener('change', (e) => {
      if (e.target.id === `date-month-${this.pickerId}`) {
        this.currentMonth = parseInt(e.target.value);
        this.refreshCalendar();
        if (this.options.onMonthChange) this.options.onMonthChange(this.currentYear, this.currentMonth);
      } else if (e.target.id === `date-year-${this.pickerId}`) {
        this.currentYear = parseInt(e.target.value);
        this.refreshCalendar();
        if (this.options.onMonthChange) this.options.onMonthChange(this.currentYear, this.currentMonth);
      } else if (e.target.id?.startsWith('time-')) {
        this.applyTime();
      }
    });

    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.container.contains(e.target)) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { this.close(); this.input.focus(); }
      if (e.ctrlKey && e.key === 't') { e.preventDefault(); this.selectDate(new Date()); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.navigate('prev-month'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); this.navigate('next-month'); }
    });

    this.container.addEventListener('mouseleave', () => {
      if (this.options.mode === 'range' && this.isRangeSelecting && this.isOpen) {
        this.dropdown.querySelectorAll('.date-picker__day--in-range').forEach(el => el.classList.remove('date-picker__day--in-range'));
      }
    });
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
      this.container.removeAttribute('data-picker-id');
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DatePicker };
}
