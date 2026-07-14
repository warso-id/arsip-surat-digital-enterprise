/**
 * ============================================
 * TWO-FACTOR AUTH PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL 2FA VERIFICATION - SIAP PRODUKSI
 * Mendukung: TOTP, SMS, Email, Recovery Codes,
 * Biometric, QR Setup, Multiple Methods
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class TwoFactorPage {
  constructor() {
    this.container = null;
    this.method = 'totp'; // totp | sms | email | recovery
    this.codeLength = 6;
    this.countdown = 60;
    this.countdownTimer = null;
    this.attempts = 0;
    this.maxAttempts = 5;
    this.pendingToken = null;
    this.isVerifying = false;
    this.pageId = '2fa-' + Math.random().toString(36).substr(2, 9);
  }

  async render(container) {
    this.container = container;
    this.container.setAttribute('data-page-id', this.pageId);

    // Check pending token from login
    this.pendingToken = this.getPendingToken();

    if (!this.pendingToken) {
      this.showError('Sesi verifikasi tidak ditemukan. Silakan login kembali.');
      return;
    }

    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    this.startCountdown();
    this.focusFirstInput();
    
    console.log('✅ TwoFactorPage rendered');
  }

  getPendingToken() {
    try {
      const token = sessionStorage.getItem('asd_2fa_pending_token') ||
                    sessionStorage.getItem('2fa_pending') ||
                    localStorage.getItem('asd_2fa_pending');
      return token;
    } catch { return null; }
  }

  clearPendingToken() {
    try {
      sessionStorage.removeItem('asd_2fa_pending_token');
      sessionStorage.removeItem('2fa_pending');
      localStorage.removeItem('asd_2fa_pending');
    } catch {}
  }

  getTemplate() {
    const methodInfo = {
      totp: { icon: 'qr_code_2', label: 'Aplikasi Authenticator', hint: 'Masukkan 6 digit kode dari aplikasi authenticator Anda (Google Authenticator, Microsoft Authenticator, dll)' },
      sms: { icon: 'sms', label: 'SMS', hint: 'Masukkan 6 digit kode yang dikirim via SMS ke nomor terdaftar' },
      email: { icon: 'email', label: 'Email', hint: 'Masukkan 6 digit kode yang dikirim ke email terdaftar' },
      recovery: { icon: 'key', label: 'Kode Recovery', hint: 'Masukkan 8 digit kode recovery yang Anda simpan' }
    };

    const currentMethod = methodInfo[this.method] || methodInfo.totp;

    return `
      <div class="auth-wrapper" id="2fa-${this.pageId}">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">AS</div>
            <span class="material-icons auth-icon" style="font-size:48px;color:var(--md-sys-color-primary)">shield</span>
            <h1>Verifikasi 2FA</h1>
            <p>Tingkatkan keamanan akun Anda dengan verifikasi dua faktor</p>
          </div>

          <div class="auth-body">
            <!-- Alert -->
            <div id="2fa-alert"></div>

            <!-- Method Selector -->
            <div class="2fa-method-selector">
              <button class="2fa-method ${this.method === 'totp' ? 'active' : ''}" data-method="totp" title="Authenticator App">
                <span class="material-icons">qr_code_2</span>
                <span>Authenticator</span>
              </button>
              <button class="2fa-method ${this.method === 'sms' ? 'active' : ''}" data-method="sms" title="SMS">
                <span class="material-icons">sms</span>
                <span>SMS</span>
              </button>
              <button class="2fa-method ${this.method === 'email' ? 'active' : ''}" data-method="email" title="Email">
                <span class="material-icons">email</span>
                <span>Email</span>
              </button>
              <button class="2fa-method ${this.method === 'recovery' ? 'active' : ''}" data-method="recovery" title="Recovery Code">
                <span class="material-icons">key</span>
                <span>Recovery</span>
              </button>
            </div>

            <!-- Current Method Info -->
            <div class="2fa-method-info">
              <span class="material-icons">${currentMethod.icon}</span>
              <div>
                <strong>${currentMethod.label}</strong>
                <p>${currentMethod.hint}</p>
              </div>
            </div>

            <!-- Code Input -->
            <div class="form-field">
              <label class="form-label required">Kode Verifikasi</label>
              <div class="code-input-group" id="code-inputs">
                ${Array.from({ length: this.method === 'recovery' ? 8 : 6 }, (_, i) => `
                  <input type="text" class="code-input" 
                         maxlength="1" 
                         pattern="${this.method === 'recovery' ? '[0-9A-Za-z]' : '[0-9]'}" 
                         inputmode="${this.method === 'recovery' ? 'text' : 'numeric'}"
                         data-index="${i}"
                         autocomplete="one-time-code">
                `).join('')}
              </div>
              <div class="form-error hidden" id="code-error"></div>
              <span class="form-helper" id="method-hint">${currentMethod.hint}</span>
            </div>

            <!-- Countdown -->
            <div class="countdown-bar" id="countdown-bar">
              <div class="countdown-bar__progress" id="countdown-progress"></div>
            </div>
            <div class="countdown-text" style="text-align:center;margin-bottom:16px;font-size:12px;color:var(--md-sys-color-on-surface-variant)">
              ⏱️ Kode berlaku: <strong id="countdown">60</strong> detik
            </div>

            <!-- Verify Button -->
            <button class="btn btn-primary btn-block" id="btn-verify">
              <span class="material-icons">verified</span>
              Verifikasi
            </button>

            <!-- Resend Button -->
            <button class="btn btn-ghost btn-block" id="btn-resend" disabled>
              <span class="material-icons">refresh</span>
              <span id="resend-text">Kirim Ulang Kode</span>
            </button>

            <!-- Attempts Info -->
            <div style="text-align:center;margin-top:8px">
              <small class="text-muted">Percobaan: <span id="attempts-count">${this.attempts}</span>/${this.maxAttempts}</small>
            </div>
          </div>

          <div class="auth-footer">
            <button class="btn btn-ghost btn-sm" id="btn-back-login">
              <span class="material-icons">arrow_back</span>
              Kembali ke Login
            </button>
            <button class="btn btn-ghost btn-sm" id="btn-recovery-mode">
              <span class="material-icons">key</span>
              Gunakan Recovery Code
            </button>
          </div>
        </div>

        <!-- Biometric Option (if available) -->
        <div class="biometric-option" id="biometric-option" style="display:none;margin-top:16px;text-align:center">
          <p class="text-muted" style="margin-bottom:8px">atau</p>
          <button class="btn btn-secondary" id="btn-biometric-verify">
            <span class="material-icons">fingerprint</span>
            Verifikasi dengan Biometric
          </button>
        </div>
      </div>
    `;
  }

  showError(message) {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">AS</div>
            <span class="material-icons" style="font-size:48px;color:var(--md-sys-color-error)">error_outline</span>
            <h1>Verifikasi 2FA</h1>
          </div>
          <div class="auth-body">
            <div class="alert alert-error">${message}</div>
            <a href="#/login" class="btn btn-primary btn-block" onclick="event.preventDefault();router.navigate('/login')">
              <span class="material-icons">login</span>
              Kembali ke Login
            </a>
          </div>
        </div>
      </div>
    `;
  }

  async verifyCode(code) {
    if (this.isVerifying) return;
    
    const expectedLength = this.method === 'recovery' ? 8 : 6;
    if (code.length !== expectedLength) {
      this.showToast(`Masukkan ${expectedLength} digit kode`, 'warning');
      return;
    }

    this.isVerifying = true;
    this.attempts++;
    document.getElementById('attempts-count').textContent = this.attempts;

    const alertEl = document.getElementById('2fa-alert');
    const btn = document.getElementById('btn-verify');
    
    alertEl.innerHTML = '';
    this.setButtonLoading(btn, true);

    // Check max attempts
    if (this.attempts > this.maxAttempts) {
      alertEl.innerHTML = `<div class="alert alert-error">❌ Terlalu banyak percobaan. Akun terkunci sementara. Silakan coba lagi nanti.</div>`;
      this.setButtonLoading(btn, false);
      this.isVerifying = false;
      setTimeout(() => this.goToLogin(), 3000);
      return;
    }

    try {
      let response;

      if (typeof api !== 'undefined') {
        response = await api.post('2fa.verify', {
          code: code,
          method: this.method,
          token: this.pendingToken
        });
      } else if (typeof API !== 'undefined') {
        response = await API.post('2fa.verify', {
          code: code,
          method: this.method,
          token: this.pendingToken
        });
      } else {
        // Direct fetch
        const url = this.getApiUrl() + '?action=2fa.verify';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, method: this.method, token: this.pendingToken })
        });
        response = await res.json();
      }

      if (response?.status === 'success') {
        // Save final auth data
        if (response.data?.token) {
          this.saveAuthData(response.data);
        }

        this.clearPendingToken();
        this.showToast('✅ Verifikasi berhasil!', 'success');
        
        // Redirect
        setTimeout(() => {
          this.goToDashboard();
        }, 500);
      } else {
        this.clearCodeInputs();
        this.focusFirstInput();
        
        const remaining = this.maxAttempts - this.attempts;
        alertEl.innerHTML = `<div class="alert alert-error">❌ ${response?.message || 'Kode tidak valid'}. ${remaining > 0 ? `Sisa percobaan: ${remaining}` : ''}</div>`;
        this.shakeCodeInputs();
      }
    } catch (error) {
      console.error('2FA verification failed:', error);
      alertEl.innerHTML = `<div class="alert alert-error">❌ Gagal verifikasi. ${error.message || 'Silakan coba lagi.'}</div>`;
    } finally {
      this.setButtonLoading(btn, false);
      this.isVerifying = false;
    }
  }

  async requestNewCode() {
    const btn = document.getElementById('btn-resend');
    this.setButtonLoading(btn, true);

    try {
      if (typeof api !== 'undefined') {
        await api.post('2fa.setup', { method: this.method, token: this.pendingToken });
      } else if (typeof API !== 'undefined') {
        await API.post('2fa.setup', { method: this.method, token: this.pendingToken });
      }

      this.showToast(`Kode baru dikirim via ${this.getMethodLabel(this.method)}`, 'success');
      this.clearCodeInputs();
      this.focusFirstInput();
      this.startCountdown();
      document.getElementById('2fa-alert').innerHTML = '';
      this.attempts = 0;
      document.getElementById('attempts-count').textContent = '0';
    } catch (error) {
      this.showToast('Gagal mengirim kode baru', 'error');
    } finally {
      this.setButtonLoading(btn, false);
    }
  }

  async verifyBiometric() {
    try {
      if (typeof BiometricService !== 'undefined' && BiometricService.authenticate) {
        const result = await BiometricService.authenticate();
        if (result) {
          this.clearPendingToken();
          this.showToast('✅ Verifikasi biometric berhasil!', 'success');
          setTimeout(() => this.goToDashboard(), 500);
        }
      } else if (window.PublicKeyCredential) {
        // WebAuthn fallback
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            allowCredentials: [],
            timeout: 60000,
            userVerification: 'required'
          }
        });
        if (assertion) {
          this.clearPendingToken();
          this.showToast('✅ Verifikasi biometric berhasil!', 'success');
          setTimeout(() => this.goToDashboard(), 500);
        }
      } else {
        this.showToast('Biometric tidak didukung di perangkat ini', 'warning');
      }
    } catch (error) {
      console.warn('Biometric verification failed:', error);
      this.showToast('Verifikasi biometric gagal', 'error');
    }
  }

  switchMethod(method) {
    if (this.isVerifying) return;
    
    this.method = method;
    this.codeLength = method === 'recovery' ? 8 : 6;
    this.attempts = 0;
    
    // Update UI
    document.querySelectorAll('.2fa-method').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-method="${method}"]`)?.classList.add('active');
    
    // Request new code for the method
    if (method !== 'recovery') {
      this.requestNewCode();
    }
    
    // Update hint
    const hints = {
      totp: 'Masukkan 6 digit kode dari aplikasi authenticator',
      sms: 'Masukkan 6 digit kode yang dikirim via SMS',
      email: 'Masukkan 6 digit kode yang dikirim ke email',
      recovery: 'Masukkan 8 digit kode recovery yang tersimpan'
    };
    const hintEl = document.getElementById('method-hint');
    if (hintEl) hintEl.textContent = hints[method] || hints.totp;

    // Update code inputs count
    this.renderCodeInputs();
    
    // Update countdown
    this.stopCountdown();
    if (method !== 'recovery') {
      this.startCountdown();
    } else {
      document.getElementById('countdown-bar').style.display = 'none';
      document.querySelector('.countdown-text').style.display = 'none';
      document.getElementById('btn-resend').style.display = 'none';
    }
  }

  renderCodeInputs() {
    const container = document.getElementById('code-inputs');
    if (!container) return;
    
    const length = this.method === 'recovery' ? 8 : 6;
    const isRecovery = this.method === 'recovery';
    
    container.innerHTML = Array.from({ length }, (_, i) => `
      <input type="text" class="code-input" 
             maxlength="1" 
             pattern="${isRecovery ? '[0-9A-Za-z]' : '[0-9]'}" 
             inputmode="${isRecovery ? 'text' : 'numeric'}"
             data-index="${i}"
             autocomplete="one-time-code">
    `).join('');
    
    this.bindCodeInputs();
    this.focusFirstInput();
  }

  startCountdown() {
    this.stopCountdown();
    this.countdown = 60;
    this.updateCountdown();

    const btnResend = document.getElementById('btn-resend');
    const countdownBar = document.getElementById('countdown-bar');
    const countdownText = document.querySelector('.countdown-text');
    
    if (btnResend) btnResend.disabled = true;
    if (countdownBar) countdownBar.style.display = 'block';
    if (countdownText) countdownText.style.display = 'block';

    this.countdownTimer = setInterval(() => {
      this.countdown--;
      this.updateCountdown();

      if (this.countdown <= 0) {
        this.stopCountdown();
        if (btnResend) btnResend.disabled = false;
        document.getElementById('resend-text').textContent = 'Kirim Ulang Kode';
        document.getElementById('countdown').textContent = '0';
        if (countdownBar) countdownBar.style.display = 'none';
      }
    }, 1000);
  }

  stopCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  updateCountdown() {
    const el = document.getElementById('countdown');
    const progress = document.getElementById('countdown-progress');
    if (el) el.textContent = this.countdown;
    if (progress) progress.style.width = `${(this.countdown / 60) * 100}%`;
  }

  clearCodeInputs() {
    this.container.querySelectorAll('.code-input').forEach(input => {
      input.value = '';
      input.classList.remove('code-input--error');
    });
  }

  shakeCodeInputs() {
    const inputs = this.container.querySelectorAll('.code-input');
    inputs.forEach(i => {
      i.classList.add('code-input--error');
      setTimeout(() => i.classList.remove('code-input--error'), 600);
    });
    const group = document.getElementById('code-inputs');
    if (group) {
      group.style.animation = 'none';
      group.offsetHeight;
      group.style.animation = 'shake 0.5s ease-in-out';
    }
  }

  focusFirstInput() {
    const first = this.container.querySelector('.code-input');
    if (first) first.focus();
  }

  saveAuthData(data) {
    try {
      if (data.token) {
        localStorage.setItem('asd_token', data.token);
        localStorage.setItem('asd_auth_token', data.token);
      }
      if (data.csrf) {
        localStorage.setItem('asd_csrf', data.csrf);
        localStorage.setItem('asd_csrf_token', data.csrf);
      }
      if (data.user) {
        localStorage.setItem('asd_user', JSON.stringify(data.user));
        localStorage.setItem('asd_auth_user', JSON.stringify(data.user));
      }
      if (typeof AuthService !== 'undefined' && AuthService.saveSession) {
        AuthService.saveSession(data.token, data.csrf, data.user);
      }
    } catch (e) {
      console.warn('Failed to save auth data:', e);
    }
  }

  goToDashboard() {
    if (typeof router !== 'undefined') {
      router.navigate('/');
    } else {
      window.location.hash = '#/';
    }
  }

  goToLogin() {
    if (typeof router !== 'undefined') {
      router.navigate('/login');
    } else {
      window.location.hash = '#/login';
    }
  }

  getMethodLabel(method) {
    const labels = { totp: 'Authenticator', sms: 'SMS', email: 'Email', recovery: 'Recovery Code' };
    return labels[method] || method;
  }

  getApiUrl() {
    if (typeof APP_CONFIG !== 'undefined') {
      return APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '';
    }
    return '';
  }

  setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) { btn.classList.add('btn-loading'); btn.disabled = true; }
    else { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }

  showToast(message, type = 'info') {
    if (typeof Toast !== 'undefined') Toast.show(message, type);
    else if (typeof NotificationService !== 'undefined') NotificationService.show(message, type);
  }

  bindCodeInputs() {
    const codeInputs = this.container.querySelectorAll('.code-input');
    codeInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const value = this.method === 'recovery' ? e.target.value : e.target.value.replace(/\D/g, '');
        e.target.value = value;

        if (value.length === 1 && index < codeInputs.length - 1) {
          codeInputs[index + 1].focus();
        }

        const expectedLength = this.method === 'recovery' ? 8 : 6;
        if (index === codeInputs.length - 1 && value.length === 1) {
          const allFilled = Array.from(codeInputs).every(i => i.value.length === 1);
          if (allFilled) {
            const code = Array.from(codeInputs).map(i => i.value).join('');
            if (code.length === expectedLength) {
              setTimeout(() => this.verifyCode(code), 300);
            }
          }
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          codeInputs[index - 1].focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
          codeInputs[index - 1].focus();
        }
        if (e.key === 'ArrowRight' && index < codeInputs.length - 1) {
          codeInputs[index + 1].focus();
        }
        if (e.key === 'Enter') {
          const code = Array.from(codeInputs).map(i => i.value).join('');
          const expectedLength = this.method === 'recovery' ? 8 : 6;
          if (code.length === expectedLength) this.verifyCode(code);
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const pattern = this.method === 'recovery' ? /[^A-Za-z0-9]/g : /\D/g;
        const chars = paste.replace(pattern, '').split('');

        codeInputs.forEach((inp, i) => {
          if (chars[i]) {
            inp.value = chars[i];
            if (i < codeInputs.length - 1) codeInputs[i + 1]?.focus();
          }
        });

        const allFilled = Array.from(codeInputs).every(i => i.value.length === 1);
        if (allFilled) {
          const code = chars.slice(0, codeInputs.length).join('');
          setTimeout(() => this.verifyCode(code), 300);
        }
      });
    });
  }

  bindEvents() {
    // Method selector
    this.container.querySelectorAll('.2fa-method').forEach(btn => {
      btn.addEventListener('click', () => this.switchMethod(btn.dataset.method));
    });

    // Code inputs
    this.bindCodeInputs();

    // Verify button
    document.getElementById('btn-verify')?.addEventListener('click', () => {
      const code = Array.from(this.container.querySelectorAll('.code-input')).map(i => i.value).join('');
      this.verifyCode(code);
    });

    // Resend button
    document.getElementById('btn-resend')?.addEventListener('click', () => this.requestNewCode());

    // Back to login
    document.getElementById('btn-back-login')?.addEventListener('click', () => {
      this.clearPendingToken();
      this.goToLogin();
    });

    // Recovery mode
    document.getElementById('btn-recovery-mode')?.addEventListener('click', () => {
      this.switchMethod('recovery');
    });

    // Biometric
    document.getElementById('btn-biometric-verify')?.addEventListener('click', () => this.verifyBiometric());

    // Check biometric availability
    this.checkBiometricAvailability();
  }

  async checkBiometricAvailability() {
    try {
      let available = false;
      if (typeof BiometricService !== 'undefined' && BiometricService.isSupported) {
        available = BiometricService.isSupported;
      } else if (window.PublicKeyCredential) {
        available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      
      if (available) {
        const biometricOption = document.getElementById('biometric-option');
        if (biometricOption) biometricOption.style.display = 'block';
      }
    } catch (e) {
      // Biometric not available
    }
  }

  destroy() {
    this.stopCountdown();
  }
}

const TwoFactorComponent = (props) => {
  const page = new TwoFactorPage();
  const container = document.createElement('div');
  container._twoFactorPage = page;
  page.render(container);
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TwoFactorPage, TwoFactorComponent };
}
