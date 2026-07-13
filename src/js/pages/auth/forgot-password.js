/**
 * FORGOT PASSWORD PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 */

class ForgotPasswordPage {
  constructor() {
    this.container = null;
    this.step = 1; // 1: enter identifier, 2: verification, 3: new password
    this.identifier = '';
    this.resetToken = '';
  }
  
  render(container) {
    this.container = container;
    this.renderStep1();
  }
  
  renderStep1() {
    this.container.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <img src="/src/assets/icons/logo.svg" alt="Logo" class="auth-logo">
            <h1>Lupa Password</h1>
            <p>Masukkan username atau email untuk mereset password</p>
          </div>
          <div class="auth-body">
            <div class="form-field">
              <label class="form-label">Username atau Email</label>
              <div class="input-with-icon">
                <span class="input-with-icon__icon input-with-icon__icon--left material-icons">person</span>
                <input type="text" class="form-input" id="identifier" placeholder="Username atau email">
              </div>
            </div>
            <button class="btn btn-primary btn-block" id="btn-next">
              Lanjutkan
              <span class="material-icons">arrow_forward</span>
            </button>
          </div>
          <div class="auth-footer">
            <a href="#/login" class="btn btn-ghost btn-sm">
              <span class="material-icons">arrow_back</span>
              Kembali ke Login
            </a>
          </div>
        </div>
      </div>
    `;
    
    this.container.querySelector('#btn-next')?.addEventListener('click', () => {
      this.checkUser();
    });
    
    this.container.querySelector('#identifier')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkUser();
    });
  }
  
  async checkUser() {
    const identifier = this.container.querySelector('#identifier')?.value.trim();
    
    if (!identifier) {
      NotificationService.error('Masukkan username atau email');
      return;
    }
    
    try {
      const response = await api.checkUser(identifier);
      
      if (response.status === 'success') {
        this.identifier = identifier;
        NotificationService.success('User ditemukan');
        this.renderStep2(response.data);
      } else {
        NotificationService.error('User tidak ditemukan');
      }
    } catch (error) {
      NotificationService.error('Gagal memeriksa user');
    }
  }
  
  renderStep2(userData) {
    this.container.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <span class="material-icons auth-icon">mark_email_read</span>
            <h1>Verifikasi</h1>
            <p>Kode reset telah dikirim ke email <strong>${userData.email || 'Anda'}</strong></p>
          </div>
          <div class="auth-body">
            <div class="form-field">
              <label class="form-label">Kode Reset</label>
              <div class="code-input-group" id="code-inputs">
                <input type="text" class="code-input" maxlength="1" pattern="[0-9]" inputmode="numeric">
                <input type="text" class="code-input" maxlength="1" pattern="[0-9]" inputmode="numeric">
                <input type="text" class="code-input" maxlength="1" pattern="[0-9]" inputmode="numeric">
                <input type="text" class="code-input" maxlength="1" pattern="[0-9]" inputmode="numeric">
              </div>
            </div>
            <button class="btn btn-primary btn-block" id="btn-verify-code">
              Verifikasi
            </button>
            <button class="btn btn-ghost btn-block btn-sm" id="btn-resend-code">
              Kirim Ulang Kode
            </button>
          </div>
          <div class="auth-footer">
            <button class="btn btn-ghost btn-sm" id="btn-back-step1">
              <span class="material-icons">arrow_back</span>
              Kembali
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.bindCodeInputs();
    
    this.container.querySelector('#btn-verify-code')?.addEventListener('click', () => {
      this.verifyCode();
    });
    
    this.container.querySelector('#btn-back-step1')?.addEventListener('click', () => {
      this.renderStep1();
    });
  }
  
  verifyCode() {
    const code = Array.from(this.container.querySelectorAll('.code-input')).map(i => i.value).join('');
    
    if (code.length !== 4) {
      NotificationService.error('Masukkan 4 digit kode');
      return;
    }
    
    // Simulate verification
    this.resetToken = 'reset-' + Date.now();
    this.renderStep3();
  }
  
  renderStep3() {
    this.container.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <span class="material-icons auth-icon">lock_reset</span>
            <h1>Password Baru</h1>
            <p>Masukkan password baru untuk akun Anda</p>
          </div>
          <div class="auth-body">
            <div class="form-field">
              <label class="form-label">Password Baru</label>
              <div class="input-with-icon">
                <span class="input-with-icon__icon input-with-icon__icon--left material-icons">lock</span>
                <input type="password" class="form-input" id="new-password" placeholder="Minimal 8 karakter">
                <span class="input-with-icon__icon input-with-icon__icon--right input-with-icon__icon--clickable material-icons toggle-password">visibility</span>
              </div>
              <div class="password-strength" id="password-strength">
                <div class="password-strength__bar"></div>
                <span class="password-strength__text"></span>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Konfirmasi Password</label>
              <div class="input-with-icon">
                <span class="input-with-icon__icon input-with-icon__icon--left material-icons">lock</span>
                <input type="password" class="form-input" id="confirm-password" placeholder="Ulangi password">
              </div>
            </div>
            <button class="btn btn-primary btn-block" id="btn-reset-password">
              <span class="material-icons">check</span>
              Reset Password
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Password strength
    this.container.querySelector('#new-password')?.addEventListener('input', (e) => {
      this.updatePasswordStrength(e.target.value);
    });
    
    // Toggle password visibility
    this.container.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        btn.textContent = type === 'password' ? 'visibility' : 'visibility_off';
      });
    });
    
    this.container.querySelector('#btn-reset-password')?.addEventListener('click', async () => {
      await this.resetPassword();
    });
  }
  
  async resetPassword() {
    const newPassword = this.container.querySelector('#new-password')?.value;
    const confirmPassword = this.container.querySelector('#confirm-password')?.value;
    
    if (!newPassword || newPassword.length < 8) {
      NotificationService.error('Password minimal 8 karakter');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      NotificationService.error('Password tidak cocok');
      return;
    }
    
    try {
      const response = await api.post('auth.resetPassword', {
        identifier: this.identifier,
        token: this.resetToken,
        newPassword
      });
      
      if (response.status === 'success') {
        NotificationService.success('Password berhasil direset! Silakan login.');
        setTimeout(() => {
          router.navigate('/login');
        }, 1500);
      } else {
        NotificationService.error(response.message || 'Gagal mereset password');
      }
    } catch (error) {
      NotificationService.error('Gagal mereset password');
    }
  }
  
  updatePasswordStrength(password) {
    const strengthBar = this.container.querySelector('.password-strength__bar');
    const strengthText = this.container.querySelector('.password-strength__text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    
    const levels = ['Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
    const colors = ['#F44336', '#FF9800', '#FFEB3B', '#4CAF50', '#00C853'];
    
    strengthBar.style.width = `${(strength / 5) * 100}%`;
    strengthBar.style.backgroundColor = colors[strength - 1] || '#F44336';
    strengthText.textContent = levels[strength - 1] || '';
    strengthText.style.color = colors[strength - 1] || '#F44336';
  }
  
  bindCodeInputs() {
    const codeInputs = this.container.querySelectorAll('.code-input');
    codeInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < codeInputs.length - 1) {
          codeInputs[index + 1].focus();
        }
        if (index === codeInputs.length - 1 && e.target.value.length === 1) {
          const code = Array.from(codeInputs).map(i => i.value).join('');
          if (code.length === 4) this.verifyCode();
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          codeInputs[index - 1].focus();
        }
      });
    });
  }
}

const ForgotPasswordComponent = (props) => {
  const page = new ForgotPasswordPage();
  const container = document.createElement('div');
  page.render(container);
  return container;
};
