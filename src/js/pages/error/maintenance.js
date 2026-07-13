/**
 * MAINTENANCE PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

const MaintenancePageComponent = (props) => {
  const container = document.createElement('div');
  container.className = 'error-page error-page--maintenance';
  container.innerHTML = `
    <div class="error-page__content">
      <div class="error-page__icon">
        <span class="material-icons">engineering</span>
      </div>
      <h1 class="error-page__title">Sedang Dalam Perbaikan</h1>
      <p class="error-page__description">
        Sistem sedang dalam pemeliharaan. Silakan coba lagi dalam beberapa saat.
      </p>
      <div class="error-page__info">
        <div class="info-card">
          <span class="material-icons">schedule</span>
          <div>
            <strong>Estimasi Selesai</strong>
            <p>${props?.estimatedTime || '30 menit'}</p>
          </div>
        </div>
      </div>
      <div class="error-page__actions">
        <button class="btn btn-primary" id="btn-check-status">
          <span class="material-icons">refresh</span>
          Periksa Status
        </button>
      </div>
      <p class="error-page__footer">
        ${props?.message || 'Kami sedang meningkatkan layanan untuk pengalaman yang lebih baik.'}
      </p>
    </div>
  `;
  
  setTimeout(() => {
    container.querySelector('#btn-check-status')?.addEventListener('click', async () => {
      try {
        const response = await api.ping();
        if (response.status === 'success') {
          window.location.reload();
        }
      } catch {
        NotificationService.warning('Sistem masih dalam pemeliharaan');
      }
    });
  }, 0);
  
  return container;
};
