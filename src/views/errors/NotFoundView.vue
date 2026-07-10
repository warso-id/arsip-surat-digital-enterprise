<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1>Halaman Tidak Ditemukan</h1>
      <p>Maaf, halaman yang Anda cari tidak ditemukan atau telah dipindahkan.</p>
      <div class="error-actions">
        <router-link to="/dashboard" class="btn btn-primary">
          🏠 Kembali ke Dashboard
        </router-link>
        <button class="btn btn-secondary" @click="$router.back()">
          ← Kembali
        </button>
      </div>
      <div class="error-illustration">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="#F5F5F5" stroke="#E0E0E0" stroke-width="2"/>
          <text x="100" y="110" text-anchor="middle" font-size="60" fill="#BDBDBD">?</text>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView'
}
</script>

<style lang="scss" scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
  
  .error-code {
    font-size: 120px;
    font-weight: 900;
    color: var(--color-primary);
    line-height: 1;
    opacity: 0.3;
  }
  
  h1 {
    font-size: 1.75rem;
    color: var(--text-primary);
    margin: 16px 0 8px;
  }
  
  p {
    color: var(--text-secondary);
    margin-bottom: 24px;
  }
  
  .error-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .error-illustration {
    margin-top: 40px;
  }
}
</style>
