/**
 * KALENDER DISPOSISI PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class KalenderDisposisiPage {
  constructor() {
    this.container = null;
    this.calendar = null;
    this.events = [];
    this.selectedDate = null;
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    await this.loadEvents();
    this.initCalendar();
    this.bindEvents();
  }
  
  getTemplate() {
    return `
      <div class="kalender-disposisi">
        <div class="content-area__header">
          <h1 class="content-area__title">Kalender Disposisi</h1>
          <p class="content-area__description">Jadwal dan tenggat waktu disposisi</p>
        </div>
        
        <div class="kalender-layout">
          <div class="kalender-main">
            <div id="calendar-container"></div>
          </div>
          
          <div class="kalender-sidebar">
            <div class="card" id="selected-date-info">
              <div class="card__header">
                <h3 id="selected-date-title">Pilih Tanggal</h3>
              </div>
              <div class="card__body" id="events-list">
                <p class="text-muted">Klik tanggal untuk melihat disposisi</p>
              </div>
            </div>
            
            <div class="card">
              <div class="card__header"><h3>Statistik</h3></div>
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
              </div>
            </div>
            
            <div class="card">
              <div class="card__header"><h3>Legenda</h3></div>
              <div class="card__body">
                <div class="legend-item">
                  <span class="legend-dot legend-dot--disposisi"></span>
                  <span>Disposisi</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot legend-dot--deadline"></span>
                  <span>Tenggat Waktu</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot legend-dot--reminder"></span>
                  <span>Pengingat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadEvents() {
    try {
      const response = await api.get('disposisi.kalender', {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      });
      
      if (response.status === 'success') {
        this.events = (response.data || []).map(event => ({
          date: event.batasWaktu || event.createdAt,
          title: event.instruksi?.substring(0, 30) || 'Disposisi',
          type: this.getEventType(event),
          status: event.status,
          id: event.id,
          fullData: event
        }));
        
        this.updateStats();
      }
    } catch (error) {
      console.warn('Failed to load events:', error);
    }
  }
  
  getEventType(event) {
    if (event.status === 'terlambat') return 'deadline';
    if (event.reminder) return 'reminder';
    return 'disposisi';
  }
  
  initCalendar() {
    const calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) return;
    
    this.calendar = new Calendar({
      container: calendarContainer,
      events: this.events,
      onSelect: (date) => this.handleDateSelect(date),
      onMonthChange: (year, month) => this.handleMonthChange(year, month)
    });
    
    this.calendar.init();
  }
  
  handleDateSelect(date) {
    this.selectedDate = date;
    
    const dateEvents = this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
    
    this.renderEventsList(date, dateEvents);
  }
  
  renderEventsList(date, events) {
    const titleEl = document.getElementById('selected-date-title');
    const listEl = document.getElementById('events-list');
    
    if (titleEl) {
      titleEl.textContent = date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    
    if (listEl) {
      if (events.length === 0) {
        listEl.innerHTML = '<p class="text-muted">Tidak ada disposisi pada tanggal ini</p>';
        return;
      }
      
      listEl.innerHTML = events.map(event => `
        <div class="event-item" onclick="router.navigate('/disposisi/${event.id}')">
          <div class="event-item__header">
            <span class="badge badge-${this.getStatusBadge(event.status)}">${event.status}</span>
            <span class="event-item__time">${Formatters.date(event.date, 'HH:mm')}</span>
          </div>
          <div class="event-item__title">${event.title}</div>
          ${event.fullData?.suratPerihal ? `<div class="event-item__subtitle">${event.fullData.suratPerihal}</div>` : ''}
        </div>
      `).join('');
    }
  }
  
  async handleMonthChange(year, month) {
    try {
      const response = await api.get('disposisi.kalender', { year, month: month + 1 });
      
      if (response.status === 'success') {
        this.events = (response.data || []).map(event => ({
          date: event.batasWaktu || event.createdAt,
          title: event.instruksi?.substring(0, 30) || 'Disposisi',
          type: this.getEventType(event),
          status: event.status,
          id: event.id,
          fullData: event
        }));
        
        this.calendar.setEvents(this.events);
        this.updateStats();
      }
    } catch (error) {
      console.warn('Failed to load month events:', error);
    }
  }
  
  updateStats() {
    const now = new Date();
    const thisMonth = this.events.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    
    document.getElementById('stat-total').textContent = thisMonth.length;
    document.getElementById('stat-pending').textContent = thisMonth.filter(e => e.status === 'pending').length;
    document.getElementById('stat-overdue').textContent = thisMonth.filter(e => e.status === 'terlambat').length;
    document.getElementById('stat-completed').textContent = thisMonth.filter(e => e.status === 'selesai').length;
  }
  
  getStatusBadge(status) {
    const badges = { 'pending': 'warning', 'diproses': 'info', 'selesai': 'success', 'terlambat': 'error' };
    return badges[status] || 'default';
  }
  
  bindEvents() {
    // Responsive sidebar toggle
    const toggleBtn = this.container.querySelector('#btn-toggle-sidebar');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.container.querySelector('.kalender-sidebar').classList.toggle('open');
      });
    }
  }
}

const KalenderDisposisiComponent = (props) => {
  const page = new KalenderDisposisiPage();
  const container = document.createElement('div');
  container.className = 'content-area kalender-disposisi';
  page.render(container);
  return container;
};
