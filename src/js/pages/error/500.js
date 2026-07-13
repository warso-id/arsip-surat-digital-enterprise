/**
 * 500 PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

const Error500Component = (props) => {
  const container = document.createElement('div');
  container.className = 'error-page';
  container.innerHTML = `
    <div class="error-page__content">
      <div class="error-page__code">500</div>
      <h1 class="error-page__title">Kesalahan Server</h1>
      <p class="error-page__description">
        Terjadi kesalahan pada server. Silakan coba lagi nanti.
      </p>
      ${props?.error ? `<div class="error-page__detail"><code>${props.error.message || 'Unknown error'}</code></div>` : ''}
      <div class="error-page__actions">
        <button class="btn btn-primary" onclick="window.location.reload()">
          <span class="material-icons">refresh</span>
          Muat Ulang
        </button>
        <button class="btn btn-secondary" onclick="router.navigate('/')">
          <span class="material-icons">home</span>
          Ke Dashboard
        </button>
      </div>
    </div>
  `;
  return container;
};
