/**
 * TWO-FACTOR AUTH PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class TwoFactorPage {
  constructor() {
    this.container = null;
    this.method = 'totp'; // totp | sms | email
    this.countdown = 60;
    this.countdownTimer = null;
  }
  
  async render(container) {
    this.container = container;
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    this.startCountdown();
  }
  
  getTemplate() {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <img src="/src/assets/icons/logo.svg" alt="Logo" class="auth-logo">
            <h1>Verifikasi 2FA</h1>
            <p>Masukkan kode verifikasi untuk melanjutkan</p>
          </div>
          
          <div class="auth-body">
            <div class="2fa-method-selector">
              <button class="2fa-method active" data-method="totp">
                <span class="material-icons">qr_code</span>
                <span>Authenticator</span>
              </button>
              <button class="2fa-method" data-method="email">
                <span class="material-icons">email</span>
                <span>Email</span>
              </button>
              <button class="2fa-method" data-method="sms">
                <span class="material-icons">sms</span>
                <span>SMS</span>
              </button>
            </div>
            
            <div class="form-field">
              <label class="form-label">Kode Verifikasi</label>
              <div class="code-input-group" id="code-inputs">
                <input type="text" class="code-input" maxlength="1" pattern="[0-9]" inputmode="numeric" autocomplete="one-time-code">
                <input type="text" class="code-input" maxlength="1" pattern="[0-9]" inputmode="numeric">
                <input type="text" class="code-input" maxlength="1" pattern="[0-9]" inputmode="numeric">
                <input type="text" class="code-input" maxlength="1" pattern="[0-9]" inputmode="numeric">
                <input type="text" class="code-input" maxlength="1" pattern="[0-9]" inputmode="numeric">
                <input type="text" class="code-input" maxlength="1" pattern="[0-9]" inputmode="numeric">
              </div>
              <span class="form-helper">Masukkan 6 digit kode dari aplikasi authenticator</span>
            </div>
            
            <div class="countdown-text">
              Kirim ulang kode dalam <span id="countdown">60</span> detik
            </div>
            
            <button class="btn btn-primary btn-block" id="btn-verify">
              <span class="material-icons">verified</span>
              Verifikasi
            </button>
            
            <button class="btn btn-ghost btn-block" id="btn-resend" disabled>
              <span class="material-icons">refresh</span>
              Kirim Ulang Kode
            </button>
          </div>
          
          <div class="auth-footer">
            <button class="btn btn-ghost btn-sm" id="btn-back-login">
              <span class="material-icons">arrow_back</span>
              Kembali ke Login
            </button>
            <button class="btn btn-ghost btn-sm" id="btn-recovery">
              Gunakan Kode Recovery
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  bindEvents() {
    // Method selector
    this.container.querySelectorAll('.2fa-method').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.2fa-method').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.method = btn.dataset.method;
        this.requestNewCode();
      });
    });
    
    // Code inputs
    const codeInputs = this.container.querySelectorAll('.code-input');
    codeInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const value = e.target.value;
        
        if (value.length === 1 && index < codeInputs.length - 1) {
          codeInputs[index + 1].focus();
        }
        
        // Auto-submit when all filled
        if (index === codeInputs.length - 1 && value.length === 1) {
          const code = Array.from(codeInputs).map(i => i.value).join('');
          if (code.length === 6) {
            this.verifyCode(code);
          }
        }
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          codeInputs[index - 1].focus();
        }
      });
      
      // Paste support
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const digits = paste.replace(/\D/g, '').split('');
        
        codeInputs.forEach((inp, i) => {
          if (digits[i]) {
            inp.value = digits[i];
          }
        });
        
        if (digits.length === 6) {
          this.verifyCode(digits.join(''));
        }
      });
    });
    
    // Verify button
    this.container.querySelector('#btn-verify')?.addEventListener('click', () => {
      const code = Array.from(this.container.querySelectorAll('.code-input')).map(i => i.value).join('');
      this.verifyCode(code);
    });
    
    // Resend button
    this.container.querySelector('#btn-resend')?.addEventListener('click', () => {
      this.requestNewCode();
    });
    
    // Back to login
    this.container.querySelector('#btn-back-login')?.addEventListener('click', () => {
      AuthService.clearAuth();
      router.navigate('/login');
    });
    
    // Recovery code
    this.container.querySelector('#btn-recovery')?.addEventListener('click', () => {
      this.showRecoveryInput();
    });
  }
  
  async verifyCode(code) {
    if (code.length !== 6) {
      NotificationService.error('Masukkan 6 digit kode');
      return;
    }
    
    try {
      const response = await api.post('2fa.verify', {
        code,
        method: this.method
      });
      
      if (response.status === 'success') {
        NotificationService.success('Verifikasi berhasil');
        
        // Redirect to dashboard
        setTimeout(() => {
          router.navigate('/');
        }, 500);
      } else {
        NotificationService.error('Kode tidak valid');
        this.clearCodeInputs();
      }
    } catch (error) {
      NotificationService.error('Verifikasi gagal');
    }
  }
  
  async requestNewCode() {
    try {
      await api.post('2fa.setup', { method: this.method });
      NotificationService.success('Kode baru telah dikirim');
      this.startCountdown();
    } catch (error) {
      NotificationService.error('Gagal mengirim kode');
    }
  }
  
  startCountdown() {
    this.countdown = 60;
    this.updateCountdown();
    
    const btnResend = this.container.querySelector('#btn-resend');
    if (btnResend) btnResend.disabled = true;
    
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    
    this.countdownTimer = setInterval(() => {
      this.countdown--;
      this.updateCountdown();
      
      if (this.countdown <= 0) {
        clearInterval(this.countdownTimer);
        if (btnResend) btnResend.disabled = false;
        this.container.querySelector('#countdown').textContent = '0';
      }
    }, 1000);
  }
  
  updateCountdown() {
    const el = this.container.querySelector('#countdown');
    if (el) el.textContent = this.countdown;
  }
  
  clearCodeInputs() {
    this.container.querySelectorAll('.code-input').forEach(input => {
      input.value = '';
    });
    this.container.querySelector('.code-input')?.focus();
  }
  
  showRecoveryInput() {
    const codeInputs = this.container.querySelector('#code-inputs');
    if (codeInputs) {
      codeInputs.querySelector('.form-helper').textContent = 'Masukkan 8 digit kode recovery';
      codeInputs.querySelectorAll('.code-input').forEach(input => {
        input.value = '';
        input.maxLength = '1';
      });
      // Add 2 more inputs for recovery code (8 digits)
      if (codeInputs.children.length === 6) {
        for (let i = 0; i < 2; i++) {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'code-input';
          input.maxLength = '1';
          input.pattern = '[0-9A-Za-z]';
          input.inputMode = 'text';
          codeInputs.appendChild(input);
        }
      }
    }
  }
}

const TwoFactorComponent = (props) => {
  const page = new TwoFactorPage();
  const container = document.createElement('div');
  page.render(container);
  return container;
};
