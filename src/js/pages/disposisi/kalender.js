/**
 * ============================================
 * KALENDER DISPOSISI PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL DISPOSITION CALENDAR - SIAP PRODUKSI
 * Mendukung: Calendar View, Event List, Stats,
 * Filters, API Integration, Responsive
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class KalenderDisposisiPage {
  constructor() {
    this.container = null;
    this.calendar = null;
    this.events = [];
    this.allEvents = [];
    this.selectedDate = null;
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth();
    this.filters = { status: '', sifat: '', search: '' };
    this.isLoading = false;
    this.pageId = 'kaldisp-' + Math.random().toString(36).substr(2, 9);
    this.viewMode = 'calendar'; // calendar | list
  }

  async render(container) {
    this.container = container;
    this.container.setAttribute('data-page-id', this.pageId);
    this.container.innerHTML = this.getTemplate();
    await this.loadEvents();
    this.initCalendar();
    this.bindEvents();
    this.updateStats();
    console.log('✅ KalenderDisposisiPage rendered');
  }

  getTemplate() {
    return `
      <div class="kalender-disposisi" id="kaldisp-${this.pageId}">
        <div class="content-area__header">
          <div class="header-left">
            <h1 class="content-area__title">
              <span class="material-icons">calendar_month</span> Kalender Disposisi
            </h1>
            <p class="content-area__description">Jadwal dan tenggat waktu disposisi surat</p>
          </div>
          <div class="header-right">
            <div class="btn-group">
              <button class="btn btn-sm ${this.viewMode === 'calendar' ? 'btn-primary' : 'btn-ghost'}" id="btn-view-calendar">
                <span class="material-icons">calendar_month</span> Kalender
              </button>
              <button class="btn btn-sm ${this.viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}" id="btn-view-list">
                <span class="material-icons">list</span> Daftar
              </button>
            </div>
            <a href="#/disposisi/create" class="btn btn-primary btn-sm" onclick="event.preventDefault();router.navigate('/disposisi/create')">
              <span class="material-icons">add</span> Buat Disposisi
            </a>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-bar">
          <div class="search-input" style="max-width:300px;flex:1">
            <span class="search-input__icon material-icons">search</span>
            <input type="text" class="form-input" placeholder="Cari disposisi..." id="filter-search">
          </div>
          <select class="form-select" id="filter-status" style="width:160px">
            <option value="">Semua Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="diproses">🔄 Diproses</option>
            <option value="selesai">✅ Selesai</option>
            <option value="terlambat">⚠️ Terlambat</option>
            <option value="draft">📝 Draft</option>
          </select>
          <select class="form-select" id="filter-sifat" style="width:160px">
            <option value="">Semua Sifat</option>
            <option value="biasa">📋 Biasa</option>
            <option value="penting">⚠️ Penting</option>
            <option value="segera">🔴 Segera</option>
            <option value="rahasia">🔒 Rahasia</option>
          </select>
          <div class="filters-bar__actions">
            <button class="btn btn-sm btn-ghost" id="btn-clear-filters">
              <span class="material-icons">clear_all</span> Reset
            </button>
            <button class="btn btn-sm btn-ghost" id="btn-today">
              <span class="material-icons">today</span> Hari Ini
            </button>
          </div>
          <span class="text-muted" id="total-events" style="margin-left:auto">0 disposisi</span>
        </div>

        <!-- Quick Date Navigation -->
        <div class="chip-group" style="margin-bottom:16px">
          <span class="chip filter-chip active" data-period="this-month">Bulan Ini</span>
          <span class="chip filter-chip" data-period="next-month">Bulan Depan</span>
          <span class="chip filter-chip" data-period="this-week">Minggu Ini</span>
          <span class="chip filter-chip" data-period="overdue">Terlambat</span>
          <span class="chip filter-chip" data-period="today">Hari Ini</span>
        </div>

        <div class="kalender-layout">
          <!-- Main Calendar Area -->
          <div class="kalender-main">
            <div id="calendar-container"></div>
            <!-- List View -->
            <div id="list-view-container" style="display:none">
              <div class="card">
                <div class="card__body" id="events-list-view"></div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="kalender-sidebar">
            <!-- Selected Date Events -->
            <div class="card" id="selected-date-card">
              <div class="card__header">
                <h3 id="selected-date-title">
                  <span class="material-icons">event</span> Pilih Tanggal
                </h3>
                <button class="btn-icon btn-icon-sm" id="btn-close-events" style="display:none" title="Tutup">
                  <span class="material-icons">close</span>
                </button>
              </div>
              <div class="card__body" id="events-list">
                <p class="text-muted" style="text-align:center;padding:20px">
                  <span class="material-icons" style="font-size:40px;color:var(--md-sys-color-outline)">touch_app</span>
                  <br>Klik tanggal pada kalender untuk melihat disposisi
                </p>
              </div>
            </div>

            <!-- Statistics -->
            <div class="card">
              <div class="card__header"><h3><span class="material-icons">bar_chart</span> Statistik</h3></div>
              <div class="card__body">
                <div class="stat-mini">
                  <span class="stat-mini__label">Total Bulan Ini</span>
                  <span class="stat-mini__value" id="stat-total">0</span>
                </div>
                <div class="stat-mini">
                  <span class="stat-mini__label">Pending</span>
                  <span class="stat-mini__value text-warning" id="stat-pending">0</span>
                </div>
                <div class="stat-mini">
                  <span class="stat-mini__label">Terlambat</span>
                  <span class="stat-mini__value text-error" id="stat-overdue">0</span>
                </div>
                <div class="stat-mini">
                  <span class="stat-mini__label">Selesai</span>
                  <span class="stat-mini__value text-success" id="stat-completed">0</span>
                </div>
                <div class="stat-mini">
                  <span class="stat-mini__label">Diproses</span>
                  <span class="stat-mini__value text-info" id="stat-processing">0</span>
                </div>
                <div class="stat-mini">
                  <span class="stat-mini__label">Tingkat Penyelesaian</span>
                  <span class="stat-mini__value" id="stat-completion">0%</span>
                </div>
              </div>
            </div>

            <!-- Legend -->
            <div class="card">
              <div class="card__header"><h3><span class="material-icons">legend_toggle</span> Legenda</h3></div>
              <div class="card__body">
                <div class="legend-item">
                  <span class="legend-dot legend-dot--pending"></span>
                  <span>Pending</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot legend-dot--processing"></span>
                  <span>Diproses</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot legend-dot--completed"></span>
                  <span>Selesai</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot legend-dot--overdue"></span>
                  <span>Terlambat</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot legend-dot--deadline"></span>
                  <span>Tenggat Hari Ini</span>
                </div>
              </div>
            </div>

            <!-- Upcoming Deadlines -->
            <div class="card">
              <div class="card__header">
                <h3><span class="material-icons">schedule</span> Mendekati Tenggat</h3>
              </div>
              <div class="card__body" id="upcoming-deadlines">
                <p class="text-muted">Memuat...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadEvents() {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      let response;
      const params = {
        year: this.currentYear,
        month: this.currentMonth + 1,
        ...this.filters
      };

      if (typeof api !== 'undefined') {
        response = await api.get('disposisi.kalender', params);
      } else if (typeof API !== 'undefined') {
        response = await API.get('disposisi.kalender', params);
      } else {
        const query = new URLSearchParams({ action: 'disposisi.kalender', ...params });
        const url = this.getApiUrl() + '?' + query.toString();
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.allEvents = response.data || [];
        this.applyFilters();
        this.updateStats();
        this.renderUpcomingDeadlines();
        this.updateTotalDisplay();
      }
    } catch (error) {
      console.warn('Failed to load events:', error);
      this.showToast('Gagal memuat data kalender', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.allEvents];

    // Filter by search
    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        (e.instruksi || '').toLowerCase().includes(q) ||
        (e.suratPerihal || '').toLowerCase().includes(q) ||
        (e.nomorAgenda || '').toLowerCase().includes(q) ||
        (e.penerimaNama || '').toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (this.filters.status) {
      filtered = filtered.filter(e => e.status === this.filters.status);
    }

    // Filter by sifat
    if (this.filters.sifat) {
      filtered = filtered.filter(e => e.sifat === this.filters.sifat);
    }

    this.events = filtered.map(event => ({
      date: event.batasWaktu || event.tanggalDisposisi || event.createdAt,
      title: (event.instruksi || 'Disposisi').substring(0, 40),
      type: this.getEventType(event),
      status: event.status,
      id: event.id,
      color: this.getStatusColor(event.status),
      fullData: event
    }));

    // Update calendar if exists
    if (this.calendar && typeof this.calendar.setEvents === 'function') {
      this.calendar.setEvents(this.events);
    }

    this.updateTotalDisplay();
  }

  getEventType(event) {
    const now = new Date();
    const deadline = event.batasWaktu ? new Date(event.batasWaktu) : null;

    if (deadline && deadline < now && event.status !== 'selesai') return 'overdue';
    if (deadline && this.isSameDay(deadline, now)) return 'deadline';
    if (event.reminder || event.setReminder) return 'reminder';
    if (event.status === 'pending') return 'pending';
    if (event.status === 'diproses') return 'processing';
    if (event.status === 'selesai') return 'completed';
    return 'disposisi';
  }

  getStatusColor(status) {
    const colors = {
      'pending': '#E65100',
      'diproses': '#1565C0',
      'selesai': '#2E7D32',
      'terlambat': '#C62828',
      'draft': '#616161'
    };
    return colors[status] || '#1976D2';
  }

  initCalendar() {
    const calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) return;

    if (typeof Calendar !== 'undefined') {
      this.calendar = new Calendar({
        container: calendarContainer,
        year: this.currentYear,
        month: this.currentMonth,
        events: this.events,
        firstDayOfWeek: 1,
        locale: 'id-ID',
        showAdjacentMonths: true,
        onSelect: (date) => this.handleDateSelect(date),
        onMonthChange: (year, month) => this.handleMonthChange(year, month),
        onEventClick: (event) => {
          if (event.id) {
            if (typeof router !== 'undefined') {
              router.navigate('/disposisi/' + event.id);
            }
          }
        },
        eventColors: {
          pending: { bg: '#FFF3E0', text: '#E65100', border: '#E65100' },
          processing: { bg: '#E3F2FD', text: '#1565C0', border: '#1565C0' },
          completed: { bg: '#E8F5E9', text: '#2E7D32', border: '#2E7D32' },
          overdue: { bg: '#FFEBEE', text: '#C62828', border: '#C62828' },
          deadline: { bg: '#FFF3E0', text: '#E65100', border: '#E65100' },
          reminder: { bg: '#F3E5F5', text: '#7B1FA2', border: '#7B1FA2' },
          default: { bg: '#F5F5F5', text: '#616161', border: '#9E9E9E' }
        }
      });
      this.calendar.init();
    } else {
      // Fallback: simple calendar display
      calendarContainer.innerHTML = `
        <div class="card">
          <div class="card__body" style="text-align:center;padding:40px">
            <span class="material-icons" style="font-size:48px;color:var(--md-sys-color-outline)">calendar_month</span>
            <p>Komponen kalender tidak tersedia.</p>
            <p class="text-muted">Gunakan tampilan daftar untuk melihat disposisi.</p>
          </div>
        </div>
      `;
    }
  }

  handleDateSelect(date) {
    this.selectedDate = date;

    const dateEvents = this.events.filter(event => {
      const eventDate = new Date(event.date);
      return this.isSameDay(eventDate, date);
    });

    this.renderEventsList(date, dateEvents);
    document.getElementById('btn-close-events').style.display = 'flex';
  }

  renderEventsList(date, events) {
    const titleEl = document.getElementById('selected-date-title');
    const listEl = document.getElementById('events-list');

    if (titleEl) {
      titleEl.innerHTML = `<span class="material-icons">event</span> ${date.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })}`;
    }

    if (listEl) {
      if (events.length === 0) {
        listEl.innerHTML = `
          <div style="text-align:center;padding:20px">
            <span class="material-icons" style="font-size:32px;color:var(--md-sys-color-outline)">event_busy</span>
            <p class="text-muted">Tidak ada disposisi pada tanggal ini</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = events.map(event => `
        <div class="event-item animate-fade-in-up" 
             onclick="if(typeof router!=='undefined')router.navigate('/disposisi/${event.id}')"
             style="cursor:pointer">
          <div class="event-item__header">
            <span class="badge badge-sm badge-${this.getStatusBadge(event.status)}">${event.status || 'pending'}</span>
            <span class="event-item__time">${this.formatTime(event.date)}</span>
          </div>
          <div class="event-item__title">${this.escapeHtml(event.title)}</div>
          ${event.fullData?.suratPerihal ? `
            <div class="event-item__subtitle">📄 ${this.escapeHtml(event.fullData.suratPerihal)}</div>
          ` : ''}
          ${event.fullData?.penerimaNama ? `
            <div class="event-item__subtitle">👤 ${this.escapeHtml(event.fullData.penerimaNama)}</div>
          ` : ''}
        </div>
      `).join('');
    }
  }

  async handleMonthChange(year, month) {
    this.currentYear = year;
    this.currentMonth = month;
    await this.loadEvents();
  }

  renderListView() {
    const container = document.getElementById('events-list-view');
    if (!container) return;

    document.getElementById('calendar-container').style.display = 'none';
    document.getElementById('list-view-container').style.display = 'block';

    const sortedEvents = [...this.events].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sortedEvents.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="min-height:200px">
          <span class="material-icons" style="font-size:48px">event_busy</span>
          <p>Tidak ada disposisi</p>
        </div>
      `;
      return;
    }

    // Group by date
    const grouped = {};
    sortedEvents.forEach(event => {
      const dateKey = new Date(event.date).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });

    container.innerHTML = Object.entries(grouped).map(([dateKey, events]) => `
      <div class="list-date-group">
        <h4 class="list-date-group__title">
          <span class="material-icons">event</span> ${dateKey}
          <span class="badge badge-sm">${events.length} disposisi</span>
        </h4>
        ${events.map(event => `
          <div class="event-item animate-fade-in-up" 
               onclick="if(typeof router!=='undefined')router.navigate('/disposisi/${event.id}')"
               style="cursor:pointer">
            <div class="event-item__header">
              <span class="badge badge-sm badge-${this.getStatusBadge(event.status)}">${event.status || 'pending'}</span>
              ${event.fullData?.sifat ? `<span class="badge badge-sm badge-outline">${event.fullData.sifat}</span>` : ''}
              <span class="event-item__time">${this.formatTime(event.date)}</span>
            </div>
            <div class="event-item__title">${this.escapeHtml(event.title)}</div>
            ${event.fullData?.suratPerihal ? `<div class="event-item__subtitle">📄 ${this.escapeHtml(event.fullData.suratPerihal)}</div>` : ''}
            ${event.fullData?.penerimaNama ? `<div class="event-item__subtitle">👤 ${this.escapeHtml(event.fullData.penerimaNama)}</div>` : ''}
            ${event.fullData?.nomorAgenda ? `<div class="event-item__subtitle text-mono text-sm">${event.fullData.nomorAgenda}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  renderUpcomingDeadlines() {
    const container = document.getElementById('upcoming-deadlines');
    if (!container) return;

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcoming = this.allEvents
      .filter(e => {
        if (!e.batasWaktu || e.status === 'selesai') return false;
        const deadline = new Date(e.batasWaktu);
        return deadline >= now && deadline <= nextWeek;
      })
      .sort((a, b) => new Date(a.batasWaktu) - new Date(b.batasWaktu))
      .slice(0, 5);

    if (upcoming.length === 0) {
      container.innerHTML = '<p class="text-muted text-sm">Tidak ada tenggat dalam 7 hari ke depan</p>';
      return;
    }

    container.innerHTML = upcoming.map(e => {
      const daysLeft = Math.ceil((new Date(e.batasWaktu) - now) / (1000 * 60 * 60 * 24));
      return `
        <div class="deadline-item" onclick="if(typeof router!=='undefined')router.navigate('/disposisi/${e.id}')" style="cursor:pointer">
          <div class="deadline-item__days ${daysLeft <= 1 ? 'deadline-item__days--urgent' : daysLeft <= 3 ? 'deadline-item__days--soon' : ''}">
            ${daysLeft <= 0 ? 'Hari Ini' : daysLeft + ' hari'}
          </div>
          <div class="deadline-item__info">
            <div class="deadline-item__title text-sm">${this.escapeHtml((e.instruksi || 'Disposisi').substring(0, 50))}</div>
            <div class="deadline-item__date text-xs text-muted">${this.formatDate(e.batasWaktu)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateStats() {
    const now = new Date();
    const thisMonth = this.allEvents.filter(e => {
      const d = new Date(e.batasWaktu || e.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const total = thisMonth.length;
    const selesai = thisMonth.filter(e => e.status === 'selesai').length;
    const pending = thisMonth.filter(e => e.status === 'pending').length;
    const terlambat = thisMonth.filter(e => e.status === 'terlambat' || (e.batasWaktu && new Date(e.batasWaktu) < now && e.status !== 'selesai')).length;
    const diproses = thisMonth.filter(e => e.status === 'diproses').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-overdue').textContent = terlambat;
    document.getElementById('stat-completed').textContent = selesai;
    document.getElementById('stat-processing').textContent = diproses;
    document.getElementById('stat-completion').textContent = total > 0 ? Math.round((selesai / total) * 100) + '%' : '0%';
  }

  updateTotalDisplay() {
    const el = document.getElementById('total-events');
    if (el) el.textContent = `${this.events.length} disposisi`;
  }

  applyPeriodFilter(period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'this-month':
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth();
        break;
      case 'next-month':
        this.currentYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
        this.currentMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
        break;
      case 'this-week':
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth();
        break;
      case 'overdue':
        this.filters.status = 'terlambat';
        break;
      case 'today':
        this.currentYear = now.getFullYear();
        this.currentMonth = now.getMonth();
        break;
    }

    this.loadEvents().then(() => {
      if (this.calendar && typeof this.calendar.setYearMonth === 'function') {
        this.calendar.setYearMonth(this.currentYear, this.currentMonth);
      }
    });

    // Update chip active state
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    document.querySelector(`[data-period="${period}"]`)?.classList.add('active');
  }

  // Helpers
  isSameDay(d1, d2) { return d1 && d2 && d1.toDateString() === d2.toDateString(); }
  formatDate(d) { try { return new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }); } catch { return d || '-'; } }
  formatTime(d) { try { return new Date(d).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' }); } catch { return ''; } }
  getStatusBadge(s) { const b = { pending:'warning', diproses:'info', selesai:'success', terlambat:'error', draft:'secondary' }; return b[s] || 'default'; }
  escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  getApiUrl() { return (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : ''; }
  showToast(m, t) { if (typeof Toast !== 'undefined') Toast.show(m, t); else if (typeof NotificationService !== 'undefined') NotificationService.show(m, t); }

  bindEvents() {
    // View toggle
    document.getElementById('btn-view-calendar')?.addEventListener('click', () => {
      this.viewMode = 'calendar';
      document.getElementById('calendar-container').style.display = 'block';
      document.getElementById('list-view-container').style.display = 'none';
      document.getElementById('btn-view-calendar').classList.add('btn-primary');
      document.getElementById('btn-view-calendar').classList.remove('btn-ghost');
      document.getElementById('btn-view-list').classList.remove('btn-primary');
      document.getElementById('btn-view-list').classList.add('btn-ghost');
    });

    document.getElementById('btn-view-list')?.addEventListener('click', () => {
      this.viewMode = 'list';
      document.getElementById('calendar-container').style.display = 'none';
      document.getElementById('list-view-container').style.display = 'block';
      document.getElementById('btn-view-list').classList.add('btn-primary');
      document.getElementById('btn-view-list').classList.remove('btn-ghost');
      document.getElementById('btn-view-calendar').classList.remove('btn-primary');
      document.getElementById('btn-view-calendar').classList.add('btn-ghost');
      this.renderListView();
    });

    // Filters
    let searchTimeout;
    document.getElementById('filter-search')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.search = e.target.value;
        this.loadEvents();
      }, 500);
    });
    document.getElementById('filter-status')?.addEventListener('change', (e) => { this.filters.status = e.target.value; this.loadEvents(); });
    document.getElementById('filter-sifat')?.addEventListener('change', (e) => { this.filters.sifat = e.target.value; this.loadEvents(); });
    document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
      this.filters = { status: '', sifat: '', search: '' };
      document.getElementById('filter-search').value = '';
      document.getElementById('filter-status').value = '';
      document.getElementById('filter-sifat').value = '';
      this.loadEvents();
    });

    // Today button
    document.getElementById('btn-today')?.addEventListener('click', () => this.applyPeriodFilter('today'));

    // Period chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => this.applyPeriodFilter(chip.dataset.period));
    });

    // Close events panel
    document.getElementById('btn-close-events')?.addEventListener('click', () => {
      document.getElementById('events-list').innerHTML = `
        <p class="text-muted" style="text-align:center;padding:20px">
          <span class="material-icons" style="font-size:40px;color:var(--md-sys-color-outline)">touch_app</span>
          <br>Klik tanggal pada kalender untuk melihat disposisi
        </p>
      `;
      document.getElementById('selected-date-title').innerHTML = '<span class="material-icons">event</span> Pilih Tanggal';
      document.getElementById('btn-close-events').style.display = 'none';
    });
  }

  destroy() {}
}

const KalenderDisposisiComponent = (props) => {
  const page = new KalenderDisposisiPage();
  const container = document.createElement('div');
  container.className = 'content-area kalender-disposisi';
  container._kalPage = page;
  page.render(container);
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KalenderDisposisiPage, KalenderDisposisiComponent };
}
