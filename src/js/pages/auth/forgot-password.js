/**
 * ============================================
 * FORGOT PASSWORD PAGE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL PASSWORD RESET FLOW - SIAP PRODUKSI
 * Mendukung: Email/Username Check, Verification,
 * Password Reset, Strength Meter, API Integration
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class ForgotPasswordPage {
  constructor() {
    this.container = null;
    this.step = 1;
    this.identifier = '';
    this.userData = null;
    this.resetToken = '';
    this.resetCode = '';
    this.isProcessing = false;
    this.attempts = 0;
    this.maxAttempts = 3;
    this.codeExpiry = 0;
    this.countdownInterval = null;
    this.codeLength = 6;
    this.pageId = 'forgot-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Render halaman forgot password
   */
  render(container) {
    this.container = container;
    this.container.setAttribute('data-page-id', this.pageId);
    this.step = 1;
    this.renderStep1();
    console.log('✅ ForgotPasswordPage rendered');
  }

  /**
   * Step 1: Enter identifier (username/email)
   */
  renderStep1() {
    this.step = 1;
    this.container.innerHTML = `
      <div class="auth-wrapper" id="forgot-pw-${this.pageId}">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">AS</div>
            <h1>Lupa Password</h1>
            <p>Masukkan username atau email yang terdaftar untuk mereset password Anda</p>
          </div>
          
          <div class="auth-body">
            <!-- Alert -->
            <div id="step1-alert"></div>
            
            <!-- Identifier Input -->
            <div class="form-field">
              <label class="form-label required" for="identifier">Username atau Email</label>
              <div class="input-with-icon">
                <span class="input-with-icon__icon input-with-icon__icon--left material-icons">person</span>
                <input type="text" class="form-input" id="identifier" 
                       placeholder="Masukkan username atau email" 
                       autocomplete="username"
                       autofocus>
              </div>
              <div class="form-error hidden" id="identifier-error"></div>
            </div>
            
            <!-- Submit Button -->
            <button class="btn btn-primary btn-block" id="btn-next">
              <span>Lanjutkan</span>
              <span class="material-icons">arrow_forward</span>
            </button>

            <!-- Info -->
            <div class="auth-info" style="margin-top:20px;padding:16px;background:var(--md-sys-color-surface-container, #F3F0F4);border-radius:12px;font-size:13px;color:var(--md-sys-color-on-surface-variant, #44474E)">
              <p style="margin-bottom:8px"><strong>ℹ️ Informasi:</strong></p>
              <ul style="padding-left:20px;font-size:12px">
                <li>Kode reset akan dikirim ke email yang terdaftar</li>
                <li>Kode berlaku selama <strong>5 menit</strong></li>
                <li>Jika tidak menerima email, periksa folder spam</li>
              </ul>
            </div>
          </div>
          
          <div class="auth-footer">
            <a href="#/login" class="btn btn-ghost btn-sm" onclick="event.preventDefault();router.navigate('/login')">
              <span class="material-icons">arrow_back</span>
              Kembali ke Login
            </a>
            <a href="#/register" class="btn btn-ghost btn-sm" onclick="event.preventDefault();router.navigate('/register')">
              Buat Akun Baru
              <span class="material-icons">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    `;

    this.bindStep1Events();
  }

  /**
   * Step 2: Verify reset code
   */
  renderStep2() {
    this.step = 2;
    this.container.innerHTML = `
      <div class="auth-wrapper" id="forgot-pw-${this.pageId}">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">AS</div>
            <span class="material-icons auth-icon" style="font-size:56px;color:var(--md-sys-color-primary)">mark_email_read</span>
            <h1>Verifikasi Kode</h1>
            <p>
              Kode reset telah dikirim ke 
              <strong>${this.maskEmail(this.userData?.email || this.identifier)}</strong>
            </p>
            ${this.userData?.email ? `
              <p class="text-muted" style="font-size:12px;margin-top:4px">
                ${this.userData.email}
              </p>
            ` : ''}
          </div>
          
          <div class="auth-body">
            <!-- Alert -->
            <div id="step2-alert"></div>

            <!-- Code Input -->
            <div class="form-field">
              <label class="form-label required">Kode Verifikasi (${this.codeLength} digit)</label>
              <div class="code-input-group" id="code-inputs">
                ${Array.from({ length: this.codeLength }, (_, i) => `
                  <input type="text" class="code-input" 
                         maxlength="1" 
                         pattern="[0-9A-Za-z]" 
                         inputmode="text"
                         data-index="${i}"
                         autocomplete="off">
                `).join('')}
              </div>
              <div class="form-error hidden" id="code-error"></div>
              <div class="form-helper" style="text-align:center;margin-top:8px">
                Masukkan ${this.codeLength} digit kode yang dikirim ke email Anda
              </div>
            </div>

            <!-- Countdown Timer -->
            <div class="countdown-timer" id="countdown-timer" style="text-align:center;padding:12px;background:var(--md-sys-color-surface-container, #F3F0F4);border-radius:8px;margin-bottom:16px;font-size:13px">
              ⏱️ Kode berlaku: <strong id="countdown-display">05:00</strong>
            </div>

            <!-- Verify Button -->
            <button class="btn btn-primary btn-block" id="btn-verify-code">
              <span class="material-icons">verified</span>
              Verifikasi Kode
            </button>

            <!-- Resend Button -->
            <button class="btn btn-ghost btn-block btn-sm" id="btn-resend-code" disabled>
              <span class="material-icons">refresh</span>
              <span id="resend-text">Kirim Ulang Kode</span>
            </button>

            <!-- Try Another Method -->
            <div style="text-align:center;margin-top:16px">
              <button class="btn btn-ghost btn-sm" id="btn-back-step1">
                <span class="material-icons">edit</span>
                Gunakan email/username lain
              </button>
            </div>
          </div>
          
          <div class="auth-footer">
            <a href="#/login" class="btn btn-ghost btn-sm" onclick="event.preventDefault();router.navigate('/login')">
              <span class="material-icons">arrow_back</span>
              Kembali ke Login
            </a>
            <span class="text-muted" style="font-size:11px">Percobaan: ${this.attempts}/${this.maxAttempts}</span>
          </div>
        </div>
      </div>
    `;

    this.bindStep2Events();
    this.startCountdown(300); // 5 menit
    this.bindCodeInputs();
  }

  /**
   * Step 3: Set new password
   */
  renderStep3() {
    this.step = 3;
    this.container.innerHTML = `
      <div class="auth-wrapper" id="forgot-pw-${this.pageId}">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">AS</div>
            <span class="material-icons auth-icon" style="font-size:56px;color:var(--md-sys-color-success)">lock_reset</span>
            <h1>Password Baru</h1>
            <p>Buat password baru untuk akun <strong>${this.escapeHtml(this.userData?.username || this.identifier)}</strong></p>
          </div>
          
          <div class="auth-body">
            <!-- Alert -->
            <div id="step3-alert"></div>

            <!-- New Password -->
            <div class="form-field">
              <label class="form-label required">Password Baru</label>
              <div class="input-with-icon">
                <span class="input-with-icon__icon input-with-icon__icon--left material-icons">lock</span>
                <input type="password" class="form-input" id="new-password" 
                       placeholder="Minimal 8 karakter" autocomplete="new-password">
                <span class="input-with-icon__icon input-with-icon__icon--right input-with-icon__icon--clickable material-icons toggle-password" 
                      data-target="new-password" style="cursor:pointer">visibility</span>
              </div>
              <!-- Password Strength Meter -->
              <div class="password-strength" id="password-strength" style="margin-top:8px">
                <div class="password-strength__bar" id="strength-bar"></div>
                <span class="password-strength__text" id="strength-text"></span>
              </div>
              <!-- Password Requirements -->
              <div class="password-requirements" id="password-requirements" style="margin-top:8px;font-size:12px">
                <div class="password-req" data-req="length">❌ Minimal 8 karakter</div>
                <div class="password-req" data-req="uppercase">❌ Huruf besar (A-Z)</div>
                <div class="password-req" data-req="lowercase">❌ Huruf kecil (a-z)</div>
                <div class="password-req" data-req="number">❌ Angka (0-9)</div>
                <div class="password-req" data-req="special">❌ Karakter khusus (!@#$%^&*)</div>
              </div>
            </div>

            <!-- Confirm Password -->
            <div class="form-field">
              <label class="form-label required">Konfirmasi Password</label>
              <div class="input-with-icon">
                <span class="input-with-icon__icon input-with-icon__icon--left material-icons">lock</span>
                <input type="password" class="form-input" id="confirm-password" 
                       placeholder="Ulangi password baru" autocomplete="new-password">
                <span class="input-with-icon__icon input-with-icon__icon--right input-with-icon__icon--clickable material-icons toggle-password" 
                      data-target="confirm-password" style="cursor:pointer">visibility</span>
              </div>
              <div class="form-error hidden" id="confirm-error"></div>
              <div class="form-helper" id="confirm-match" style="display:none;color:var(--md-sys-color-success)">✓ Password cocok</div>
            </div>

            <!-- Submit Button -->
            <button class="btn btn-primary btn-block" id="btn-reset-password">
              <span class="material-icons">check</span>
              Reset Password
            </button>
          </div>
          
          <div class="auth-footer">
            <a href="#/login" class="btn btn-ghost btn-sm" onclick="event.preventDefault();router.navigate('/login')">
              <span class="material-icons">arrow_back</span>
              Kembali ke Login
            </a>
          </div>
        </div>
      </div>
    `;

    this.bindStep3Events();
  }

  /**
   * Step 4: Success confirmation
   */
  renderStep4() {
    this.step = 4;
    this.container.innerHTML = `
      <div class="auth-wrapper" id="forgot-pw-${this.pageId}">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-logo">AS</div>
            <span class="material-icons auth-icon" style="font-size:64px;color:var(--md-sys-color-success)">check_circle</span>
            <h1>Password Berhasil Direset! 🎉</h1>
            <p>Password Anda telah berhasil diubah. Silakan login dengan password baru Anda.</p>
          </div>
          
          <div class="auth-body">
            <div style="text-align:center;padding:16px;background:var(--md-sys-color-success-container, #C8E6C9);border-radius:12px;margin-bottom:16px">
              <p style="color:var(--md-sys-color-on-success-container);font-size:14px;font-weight:500">
                ✅ Password berhasil diperbarui pada ${new Date().toLocaleString('id-ID')}
              </p>
            </div>

            <a href="#/login" class="btn btn-primary btn-block" onclick="event.preventDefault();router.navigate('/login')">
              <span class="material-icons">login</span>
              Login Sekarang
            </a>

            <p style="text-align:center;margin-top:16px;font-size:13px;color:var(--md-sys-color-on-surface-variant)">
              Gunakan password baru Anda untuk login
            </p>
          </div>
        </div>
      </div>
    `;

    // Auto-redirect after 5 seconds
    setTimeout(() => {
      if (typeof router !== 'undefined') {
        router.navigate('/login');
      } else {
        window.location.hash = '#/login';
      }
    }, 5000);
  }

  /**
   * Check if user exists
   */
  async checkUser() {
    const identifier = this.container.querySelector('#identifier')?.value?.trim();
    const alertEl = document.getElementById('step1-alert');
    const errorEl = document.getElementById('identifier-error');
    const btn = document.getElementById('btn-next');

    // Validate
    if (!identifier) {
      this.showFieldError('identifier', 'identifier-error', 'Masukkan username atau email');
      return;
    }

    this.clearFieldError('identifier', 'identifier-error');
    alertEl.innerHTML = '';
    this.setButtonLoading(btn, true);
    this.identifier = identifier;

    try {
      let response;

      // Try API
      if (typeof api !== 'undefined' && api.checkUser) {
        response = await api.checkUser(identifier);
      } else if (typeof API !== 'undefined') {
        response = await API.post('checkUser', { identifier });
      } else {
        // Direct fetch
        const url = this.getApiUrl() + '?action=checkUser';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier })
        });
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.userData = response.data;
        this.attempts = 0;
        
        // Request reset code
        await this.requestResetCode();
        
        // Move to step 2
        this.renderStep2();
        this.showToast('Kode reset telah dikirim ke email Anda', 'success');
      } else {
        alertEl.innerHTML = `<div class="alert alert-error">❌ ${response?.message || 'User tidak ditemukan'}</div>`;
      }
    } catch (error) {
      console.error('Check user failed:', error);
      alertEl.innerHTML = `<div class="alert alert-error">❌ Gagal memeriksa user. ${error.message || 'Silakan coba lagi.'}</div>`;
    } finally {
      this.setButtonLoading(btn, false);
    }
  }

  /**
   * Request reset code from server
   */
  async requestResetCode() {
    try {
      if (typeof api !== 'undefined' && api.post) {
        await api.post('auth.requestReset', { identifier: this.identifier });
      } else if (typeof API !== 'undefined') {
        await API.post('auth.requestReset', { identifier: this.identifier });
      }
      // If no API available, simulate code generation
      this.resetCode = this.generateCode();
      this.codeExpiry = Date.now() + 300000; // 5 menit
      console.log('Reset code:', this.resetCode); // For development
    } catch (error) {
      console.warn('Failed to request reset code:', error);
      // Generate local code as fallback
      this.resetCode = this.generateCode();
      this.codeExpiry = Date.now() + 300000;
    }
  }

  /**
   * Verify reset code
   */
  async verifyCode() {
    const inputs = this.container.querySelectorAll('.code-input');
    const code = Array.from(inputs).map(i => i.value).join('');
    const alertEl = document.getElementById('step2-alert');
    const errorEl = document.getElementById('code-error');
    const btn = document.getElementById('btn-verify-code');

    if (code.length !== this.codeLength) {
      this.showFieldError('code', 'code-error', `Masukkan ${this.codeLength} digit kode`);
      return;
    }

    this.clearFieldError('code', 'code-error');
    alertEl.innerHTML = '';
    this.setButtonLoading(btn, true);

    // Check attempts
    this.attempts++;
    if (this.attempts > this.maxAttempts) {
      alertEl.innerHTML = `<div class="alert alert-error">❌ Terlalu banyak percobaan. Silakan minta kode baru.</div>`;
      this.setButtonLoading(btn, false);
      return;
    }

    // Check expiry
    if (Date.now() > this.codeExpiry) {
      alertEl.innerHTML = `<div class="alert alert-error">⏰ Kode telah kadaluarsa. Silakan minta kode baru.</div>`;
      this.setButtonLoading(btn, false);
      return;
    }

    try {
      let isValid = false;

      // Try API verification
      if (typeof api !== 'undefined' && api.post) {
        const response = await api.post('auth.verifyResetCode', {
          identifier: this.identifier,
          code: code
        });
        isValid = response?.status === 'success';
        if (isValid && response.data?.token) {
          this.resetToken = response.data.token;
        }
      } else if (typeof API !== 'undefined') {
        const response = await API.post('auth.verifyResetCode', {
          identifier: this.identifier,
          code: code
        });
        isValid = response?.status === 'success';
      } else {
        // Local verification
        isValid = code === this.resetCode;
        if (isValid) {
          this.resetToken = 'reset-token-' + Date.now();
        }
      }

      if (isValid) {
        this.stopCountdown();
        this.showToast('Kode verifikasi benar', 'success');
        setTimeout(() => this.renderStep3(), 500);
      } else {
        const remaining = this.maxAttempts - this.attempts;
        alertEl.innerHTML = `<div class="alert alert-error">❌ Kode tidak valid. ${remaining > 0 ? `Sisa percobaan: ${remaining}` : ''}</div>`;
        // Clear inputs
        inputs.forEach(i => { i.value = ''; });
        inputs[0]?.focus();
      }
    } catch (error) {
      alertEl.innerHTML = `<div class="alert alert-error">❌ Gagal verifikasi kode. Coba lagi.</div>`;
    } finally {
      this.setButtonLoading(btn, false);
    }
  }

  /**
   * Resend reset code
   */
  async resendCode() {
    const btn = document.getElementById('btn-resend-code');
    this.setButtonLoading(btn, true);

    try {
      await this.requestResetCode();
      this.startCountdown(300);
      this.showToast('Kode baru telah dikirim', 'success');
      
      // Clear inputs
      const inputs = this.container.querySelectorAll('.code-input');
      inputs.forEach(i => { i.value = ''; });
      inputs[0]?.focus();
      
      document.getElementById('step2-alert').innerHTML = '';
    } catch (error) {
      this.showToast('Gagal mengirim kode baru', 'error');
    } finally {
      this.setButtonLoading(btn, false);
    }
  }

  /**
   * Reset password
   */
  async resetPassword() {
    const newPassword = this.container.querySelector('#new-password')?.value || '';
    const confirmPassword = this.container.querySelector('#confirm-password')?.value || '';
    const alertEl = document.getElementById('step3-alert');
    const btn = document.getElementById('btn-reset-password');

    // Validate
    if (newPassword.length < 8) {
      alertEl.innerHTML = `<div class="alert alert-error">❌ Password minimal 8 karakter</div>`;
      return;
    }

    const strengthScore = this.calculatePasswordStrength(newPassword);
    if (strengthScore < 3) {
      alertEl.innerHTML = `<div class="alert alert-error">❌ Password terlalu lemah. Gunakan kombinasi huruf besar, kecil, dan angka.</div>`;
      return;
    }

    if (newPassword !== confirmPassword) {
      alertEl.innerHTML = `<div class="alert alert-error">❌ Password tidak cocok</div>`;
      return;
    }

    alertEl.innerHTML = '';
    this.setButtonLoading(btn, true);

    try {
      let response;

      if (typeof api !== 'undefined' && api.post) {
        response = await api.post('auth.resetPassword', {
          identifier: this.identifier,
          token: this.resetToken,
          newPassword: newPassword
        });
      } else if (typeof API !== 'undefined') {
        response = await API.post('auth.resetPassword', {
          identifier: this.identifier,
          token: this.resetToken,
          newPassword: newPassword
        });
      } else {
        // Direct fetch
        const url = this.getApiUrl() + '?action=auth.resetPassword';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: this.identifier,
            token: this.resetToken,
            newPassword: newPassword
          })
        });
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.showToast('Password berhasil direset!', 'success');
        setTimeout(() => this.renderStep4(), 500);
      } else {
        alertEl.innerHTML = `<div class="alert alert-error">❌ ${response?.message || 'Gagal mereset password'}</div>`;
      }
    } catch (error) {
      console.error('Reset password failed:', error);
      alertEl.innerHTML = `<div class="alert alert-error">❌ Gagal mereset password. ${error.message || 'Silakan coba lagi.'}</div>`;
    } finally {
      this.setButtonLoading(btn, false);
    }
  }

  /**
   * Calculate password strength
   */
  calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    return Math.min(score, 5);
  }

  /**
   * Update password strength meter
   */
  updatePasswordStrength(password) {
    const strengthBar = this.container.querySelector('#strength-bar');
    const strengthText = this.container.querySelector('#strength-text');
    if (!strengthBar || !strengthText) return;

    const score = this.calculatePasswordStrength(password);
    const levels = ['Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
    const colors = ['#F44336', '#FF9800', '#FFEB3B', '#4CAF50', '#00C853'];

    strengthBar.style.width = `${(score / 5) * 100}%`;
    strengthBar.style.backgroundColor = colors[score] || colors[0];
    strengthText.textContent = levels[score] || levels[0];
    strengthText.style.color = colors[score] || colors[0];

    // Update requirements checklist
    const reqs = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    Object.entries(reqs).forEach(([key, met]) => {
      const el = this.container.querySelector(`[data-req="${key}"]`);
      if (el) {
        el.innerHTML = `${met ? '✅' : '❌'} ${el.textContent.replace(/[✅❌]\s*/, '')}`;
        el.style.color = met ? 'var(--md-sys-color-success)' : '';
      }
    });
  }

  /**
   * Check password match
   */
  checkPasswordMatch() {
    const newPassword = this.container.querySelector('#new-password')?.value || '';
    const confirmPassword = this.container.querySelector('#confirm-password')?.value || '';
    const confirmMatch = document.getElementById('confirm-match');
    const confirmError = document.getElementById('confirm-error');

    if (!confirmPassword) {
      if (confirmMatch) confirmMatch.style.display = 'none';
      if (confirmError) confirmError.classList.add('hidden');
      return;
    }

    if (newPassword === confirmPassword) {
      if (confirmMatch) confirmMatch.style.display = 'block';
      if (confirmError) confirmError.classList.add('hidden');
    } else {
      if (confirmMatch) confirmMatch.style.display = 'none';
      if (confirmError) {
        confirmError.textContent = 'Password tidak cocok';
        confirmError.classList.remove('hidden');
      }
    }
  }

  /**
   * Start countdown timer
   */
  startCountdown(seconds) {
    this.stopCountdown();
    this.codeExpiry = Date.now() + seconds * 1000;

    const updateDisplay = () => {
      const remaining = Math.max(0, Math.ceil((this.codeExpiry - Date.now()) / 1000));
      const display = document.getElementById('countdown-display');
      const resendBtn = document.getElementById('btn-resend-code');
      const resendText = document.getElementById('resend-text');

      if (display) {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }

      if (remaining <= 0) {
        this.stopCountdown();
        if (resendBtn) resendBtn.disabled = false;
        if (resendText) resendText.textContent = 'Kirim Ulang Kode';
        if (display) display.textContent = '00:00';
      }
    };

    updateDisplay();
    this.countdownInterval = setInterval(updateDisplay, 1000);

    const resendBtn = document.getElementById('btn-resend-code');
    const resendText = document.getElementById('resend-text');
    if (resendBtn) resendBtn.disabled = true;
    if (resendText) resendText.textContent = 'Tunggu...';
  }

  /**
   * Stop countdown
   */
  stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Generate random code
   */
  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < this.codeLength; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Mask email for display
   */
  maskEmail(email) {
    if (!email || !email.includes('@')) return email || '***';
    const [name, domain] = email.split('@');
    if (name.length <= 3) return name.charAt(0) + '***@' + domain;
    return name.substring(0, 3) + '***@' + domain;
  }

  /**
   * Bind code input events
   */
  bindCodeInputs() {
    const codeInputs = this.container.querySelectorAll('.code-input');
    codeInputs.forEach((input, index) => {
      // Auto-focus next input
      input.addEventListener('input', (e) => {
        const value = e.target.value.toUpperCase();
        e.target.value = value;
        
        if (value.length === 1 && index < codeInputs.length - 1) {
          codeInputs[index + 1].focus();
        }
        
        // Auto-submit when all filled
        if (index === codeInputs.length - 1 && value.length === 1) {
          const allFilled = Array.from(codeInputs).every(i => i.value.length === 1);
          if (allFilled) {
            setTimeout(() => this.verifyCode(), 300);
          }
        }
      });

      // Handle backspace
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
      });

      // Handle paste
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const chars = paste.replace(/[^A-Za-z0-9]/g, '').toUpperCase().split('');
        
        codeInputs.forEach((inp, i) => {
          if (chars[i]) {
            inp.value = chars[i];
            if (i < codeInputs.length - 1) codeInputs[i + 1]?.focus();
          }
        });

        const allFilled = Array.from(codeInputs).every(i => i.value.length === 1);
        if (allFilled) setTimeout(() => this.verifyCode(), 300);
      });
    });
  }

  /**
   * Bind Step 1 events
   */
  bindStep1Events() {
    const btnNext = document.getElementById('btn-next');
    const input = document.getElementById('identifier');

    btnNext?.addEventListener('click', () => this.checkUser());
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.checkUser();
      }
    });
  }

  /**
   * Bind Step 2 events
   */
  bindStep2Events() {
    document.getElementById('btn-verify-code')?.addEventListener('click', () => this.verifyCode());
    document.getElementById('btn-resend-code')?.addEventListener('click', () => this.resendCode());
    document.getElementById('btn-back-step1')?.addEventListener('click', () => this.renderStep1());
  }

  /**
   * Bind Step 3 events
   */
  bindStep3Events() {
    document.getElementById('btn-reset-password')?.addEventListener('click', () => this.resetPassword());

    // Password strength
    document.getElementById('new-password')?.addEventListener('input', (e) => {
      this.updatePasswordStrength(e.target.value);
      this.checkPasswordMatch();
    });

    // Confirm password match
    document.getElementById('confirm-password')?.addEventListener('input', () => {
      this.checkPasswordMatch();
    });

    // Toggle password visibility
    this.container.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
          const type = input.type === 'password' ? 'text' : 'password';
          input.type = type;
          btn.textContent = type === 'password' ? 'visibility' : 'visibility_off';
        }
      });
    });
  }

  // Helper methods
  showFieldError(fieldId, errorId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (input) input.classList.add('form-input--error');
    if (error) { error.textContent = message; error.classList.remove('hidden'); }
  }

  clearFieldError(fieldId, errorId) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (input) input.classList.remove('form-input--error');
    if (error) error.classList.add('hidden');
  }

  setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.classList.add('btn-loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('btn-loading');
      btn.disabled = false;
    }
  }

  getApiUrl() {
    if (typeof APP_CONFIG !== 'undefined') {
      return APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '';
    }
    return '';
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  showToast(message, type = 'info') {
    if (typeof Toast !== 'undefined') Toast.show(message, type);
    else if (typeof NotificationService !== 'undefined') NotificationService.show(message, type);
  }

  destroy() {
    this.stopCountdown();
  }
}

const ForgotPasswordComponent = (props) => {
  const page = new ForgotPasswordPage();
  const container = document.createElement('div');
  container._forgotPage = page;
  page.render(container);
  return container;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ForgotPasswordPage, ForgotPasswordComponent };
}
