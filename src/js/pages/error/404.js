/**
 * 404 PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

const Error404Component = (props) => {
  const container = document.createElement('div');
  container.className = 'error-page';
  container.innerHTML = `
    <div class="error-page__content">
      <div class="error-page__code">404</div>
      <h1 class="error-page__title">Halaman Tidak Ditemukan</h1>
      <p class="error-page__description">
        Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
      </p>
      <div class="error-page__actions">
        <button class="btn btn-primary" onclick="router.navigate('/')">
          <span class="material-icons">home</span>
          Ke Dashboard
        </button>
        <button class="btn btn-secondary" onclick="history.back()">
          <span class="material-icons">arrow_back</span>
          Kembali
        </button>
      </div>
      <div class="error-page__suggestions">
        <h4>Mungkin Anda mencari:</h4>
        <ul>
          <li><a href="#/surat-masuk">Surat Masuk</a></li>
          <li><a href="#/surat-keluar">Surat Keluar</a></li>
          <li><a href="#/disposisi">Disposisi</a></li>
          <li><a href="#/dashboard">Dashboard</a></li>
        </ul>
      </div>
    </div>
  `;
  return container;
};
