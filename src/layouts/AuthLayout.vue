<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <svg width="64" height="64" viewBox="0 0 80 80">
              <rect width="80" height="80" rx="16" fill="#1976D2"/>
              <path d="M20 25h40v5H20zM20 35h40v5H20zM20 45h30v5H20z" fill="white"/>
              <path d="M55 42l10 10-10 10" stroke="white" stroke-width="3" fill="none"/>
            </svg>
          </div>
          <h1 class="auth-title">Arsip Surat Digital</h1>
          <p class="auth-subtitle">Enterprise v3.1.0</p>
        </div>
        
        <slot />
        
        <div class="auth-footer">
          <p>© 2026 Arsip Surat Digital Enterprise</p>
          <p class="auth-version">v3.1.0 • Build 2026-07-10</p>
        </div>
      </div>
    </div>
    
    <!-- Background Decoration -->
    <div class="auth-bg">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthLayout'
}
</script>

<style lang="scss" scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.auth-container {
  width: 100%;
  max-width: 440px;
  padding: 20px;
  z-index: 1;
}

.auth-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
  
  .auth-logo {
    margin-bottom: 16px;
    animation: float 3s ease-in-out infinite;
  }
  
  .auth-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary);
    margin: 0 0 4px;
  }
  
  .auth-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
  }
}

.auth-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
  
  p {
    margin: 4px 0;
    font-size: 0.75rem;
    color: var(--text-tertiary);
  }
  
  .auth-version {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
  }
}

.auth-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
  
  .bg-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
    background: white;
    
    &-1 {
      width: 600px;
      height: 600px;
      top: -200px;
      right: -200px;
    }
    
    &-2 {
      width: 400px;
      height: 400px;
      bottom: -100px;
      left: -100px;
    }
    
    &-3 {
      width: 300px;
      height: 300px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 24px;
  }
  
  .auth-header .auth-title {
    font-size: 1.25rem;
  }
}
</style>
