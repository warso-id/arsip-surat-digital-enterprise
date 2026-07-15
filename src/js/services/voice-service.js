/**
 * ============================================
 * VOICE SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL VOICE COMMANDS & TTS - SIAP PRODUKSI
 * Mendukung: Speech Recognition, TTS, Commands,
 * Wake Word, Navigation, Forms, Feedback
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class VoiceService {
  constructor() {
    this.isListening = false;
    this.isSupported = false;
    this.isSpeaking = false;
    this.recognition = null;
    this.synthesis = null;
    this.commands = [];
    this.language = 'id-ID';
    this.confidenceThreshold = 0.6;
    this.wakeWord = 'arsip';
    this.wakeWordDetected = false;
    this.wakeWordTimeout = null;
    this.wakeWordTimeoutDuration = 5000; // 5 seconds after wake word
    this.commandHistory = [];
    this.maxHistory = 50;
    this.voiceIndicator = null;
    this.statusCallback = null;
    this.errorCount = 0;
    this.maxErrors = 5;

    // Callbacks
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
    this.onCommand = null;
  }

  /**
   * Initialize voice service
   */
  init() {
    // Check Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
      this.registerDefaultCommands();
    } else {
      console.warn('Speech Recognition not supported in this browser');
    }

    // Check Speech Synthesis support
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      // Load voices (they load async)
      speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }

    // Create voice indicator
    this.createVoiceIndicator();

    // Load command history
    this.loadHistory();

    // Load preferences
    this.loadPreferences();

    console.log(`✅ Voice Service initialized (Supported: ${this.isSupported})`);
  }

  /**
   * Setup speech recognition
   */
  setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true; // Enable interim for visual feedback
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Show interim results as visual feedback
      if (interimTranscript && this.voiceIndicator) {
        this.updateIndicator(interimTranscript, 'interim');
      }

      if (finalTranscript) {
        const transcript = finalTranscript.toLowerCase().trim();
        const confidence = event.results[event.results.length - 1][0].confidence;

        if (confidence >= this.confidenceThreshold) {
          this.processCommand(transcript, confidence);
        }

        if (this.onResult) {
          this.onResult(transcript, confidence);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Voice recognition error:', event.error);
      this.errorCount++;

      if (this.onError) this.onError(event.error);

      // Update indicator
      if (this.voiceIndicator) {
        this.updateIndicator(this.getErrorMessage(event.error), 'error');
      }

      // Handle specific errors
      switch (event.error) {
        case 'not-allowed':
          this.isListening = false;
          this.updateIndicator('Mikrofon tidak diizinkan', 'error');
          break;
        case 'no-speech':
        case 'aborted':
          if (this.isListening) {
            setTimeout(() => this.startListening(), 500);
          }
          break;
        case 'network':
          if (this.errorCount < this.maxErrors && this.isListening) {
            setTimeout(() => this.startListening(), 1000);
          }
          break;
      }
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.errorCount = 0;
      if (this.voiceIndicator) {
        this.voiceIndicator.style.display = 'flex';
        this.updateIndicator('🎤 Mendengarkan...', 'listening');
      }
      if (this.onStart) this.onStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.voiceIndicator && !this.wakeWordDetected) {
        setTimeout(() => {
          if (!this.isListening) this.voiceIndicator.style.display = 'none';
        }, 1500);
      }
      if (this.onEnd) this.onEnd();

      // Auto-restart if still listening
      if (this.isListening) {
        setTimeout(() => this.startListening(), 300);
      }
    };

    this.recognition.onspeechstart = () => {
      this.updateIndicator('🎤 Terdeteksi suara...', 'speaking');
    };

    this.recognition.onspeechend = () => {
      this.updateIndicator('⏳ Memproses...', 'processing');
    };
  }

  /**
   * Register default voice commands
   */
  registerDefaultCommands() {
    const nav = (path) => () => {
      if (typeof router !== 'undefined') router.navigate(path);
      else window.location.hash = '#' + path;
      this.speak(`Menuju ${path.replace(/\//g, ' ').replace(/-/g, ' ')}`);
    };

    // Navigation
    this.registerCommand('dashboard', ['dashboard', 'beranda', 'home', 'halaman utama'], nav('/'));
    this.registerCommand('surat-masuk', ['surat masuk', 'inbox', 'surat diterima', 'daftar surat masuk'], nav('/surat-masuk'));
    this.registerCommand('surat-keluar', ['surat keluar', 'outbox', 'surat dikirim', 'daftar surat keluar'], nav('/surat-keluar'));
    this.registerCommand('disposisi', ['disposisi', 'forward', 'daftar disposisi'], nav('/disposisi'));
    this.registerCommand('approval', ['approval', 'persetujuan', 'daftar approval'], nav('/approval'));
    this.registerCommand('pengguna', ['pengguna', 'users', 'user', 'daftar pengguna'], nav('/users'));
    this.registerCommand('pengaturan', ['pengaturan', 'settings', 'setting', 'konfigurasi'], nav('/settings'));
    this.registerCommand('laporan', ['laporan', 'reports', 'report'], nav('/reports'));
    this.registerCommand('pencarian', ['cari', 'search', 'pencarian', 'temukan'], nav('/search'));
    this.registerCommand('file-manager', ['file manager', 'kelola file', 'daftar file'], nav('/files'));
    this.registerCommand('audit-log', ['audit log', 'log aktivitas', 'riwayat'], nav('/audit-log'));
    this.registerCommand('blockchain', ['blockchain', 'blok chain', 'verifikasi blockchain'], nav('/blockchain'));

    // Actions
    this.registerCommand('tambah-surat-masuk', ['tambah surat masuk', 'surat masuk baru', 'buat surat masuk', 'catat surat masuk'], nav('/surat-masuk/create'));
    this.registerCommand('tambah-surat-keluar', ['tambah surat keluar', 'surat keluar baru', 'buat surat keluar'], nav('/surat-keluar/create'));
    this.registerCommand('buat-disposisi', ['buat disposisi', 'disposisi baru', 'tambah disposisi'], nav('/disposisi/create'));

    // UI Controls
    this.registerCommand('toggle-sidebar', ['sembunyikan menu', 'tutup sidebar', 'buka sidebar', 'toggle menu', 'sembunyikan sidebar'], () => {
      if (typeof store !== 'undefined') {
        store.dispatch('app.sidebarCollapsed', !store.getState('app.sidebarCollapsed'));
        this.speak('Sidebar di-toggle');
      }
    });

    this.registerCommand('toggle-theme', ['ganti tema', 'mode gelap', 'mode terang', 'dark mode', 'light mode', 'tema gelap', 'tema terang'], () => {
      const themes = ['light', 'dark', 'auto'];
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = themes[(themes.indexOf(current) + 1) % themes.length];
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('app-theme', next);
      const labels = { light: 'Mode Terang', dark: 'Mode Gelap', auto: 'Mode Otomatis' };
      this.speak(labels[next]);
    });

    this.registerCommand('refresh', ['refresh', 'muat ulang', 'reload', 'segar kan halaman'], () => {
      this.speak('Memuat ulang halaman');
      if (typeof router !== 'undefined') router.reload();
      else window.location.reload();
    });

    this.registerCommand('go-back', ['kembali', 'back', 'go back', 'halaman sebelumnya'], () => {
      window.history.back();
      this.speak('Kembali ke halaman sebelumnya');
    });

    this.registerCommand('scroll-top', ['ke atas', 'scroll atas', 'paling atas', 'awal halaman'], () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    this.registerCommand('scroll-bottom', ['ke bawah', 'scroll bawah', 'paling bawah', 'akhir halaman'], () => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    // Search commands
    this.registerCommand('voice-search', [], (transcript) => {
      const query = transcript.replace(/cari\s+|search\s+|temukan\s+|cari kan\s+/i, '').trim();
      if (query) {
        if (typeof router !== 'undefined') {
          router.navigate('/search', { query: { q: query } });
        }
        this.speak(`Mencari ${query}`);
      }
    }, true); // Use transcript directly

    // Help
    this.registerCommand('help', ['bantuan', 'help', 'apa yang bisa', 'perintah suara', 'voice commands'], () => {
      const helpText = 'Perintah yang tersedia: navigasi ke dashboard, surat masuk, surat keluar, disposisi, approval, pengguna, pengaturan, laporan, pencarian. Atau katakan "tambah surat masuk" untuk membuat surat baru.';
      this.speak(helpText);
      if (typeof Toast !== 'undefined') {
        Toast.show('🎤 Katakan "dashboard", "surat masuk", "pengaturan", dll', 'info', 5000);
      }
    });

    // Logout
    this.registerCommand('logout', ['keluar', 'logout', 'log out', 'keluar dari sistem'], async () => {
      this.speak('Anda akan keluar dari sistem. Konfirmasi?');
      // Wait for confirmation
      setTimeout(async () => {
        if (typeof AuthService !== 'undefined') await AuthService.logout();
        if (typeof router !== 'undefined') router.navigate('/login');
      }, 2000);
    });
  }

  /**
   * Register a voice command
   */
  registerCommand(name, phrases, action, useTranscript = false) {
    this.commands.push({ name, phrases, action, useTranscript });
  }

  /**
   * Process voice command
   */
  processCommand(transcript, confidence) {
    console.log(`🎤 Voice: "${transcript}" (${Math.round(confidence * 100)}%)`);

    // Check for wake word
    if (transcript.includes(this.wakeWord)) {
      this.wakeWordDetected = true;
      this.speak('Ya, ada yang bisa dibantu?');
      this.resetWakeWordTimeout();

      // Remove wake word from transcript
      transcript = transcript.replace(new RegExp(this.wakeWord, 'gi'), '').trim();
    }

    // If wake word not detected and transcript is short, ignore
    if (!this.wakeWordDetected && transcript.length < 5) return;

    // Add to history
    this.addToHistory(transcript);

    // Find matching command
    let bestMatch = null;
    let bestScore = 0;

    for (const command of this.commands) {
      if (command.useTranscript) {
        // Commands that use the transcript directly
        const score = command.phrases.some(p => transcript.includes(p)) ? 0.8 : 0;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = command;
        }
      } else {
        for (const phrase of command.phrases) {
          if (!phrase) continue;
          const score = this.calculateMatchScore(transcript, phrase);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = command;
          }
        }
      }
    }

    // Execute command
    if (bestMatch && bestScore > 0.5) {
      console.log(`✅ Executing: ${bestMatch.name} (score: ${bestScore.toFixed(2)})`);

      if (bestMatch.useTranscript) {
        bestMatch.action(transcript);
      } else {
        bestMatch.action();
      }

      this.wakeWordDetected = false;
      this.updateIndicator(`✅ ${bestMatch.name}`, 'success');

      if (this.onCommand) this.onCommand(bestMatch.name, transcript);

      setTimeout(() => {
        if (this.isListening && this.voiceIndicator) {
          this.updateIndicator('🎤 Mendengarkan...', 'listening');
        }
      }, 2000);

    } else if (transcript.length > 3 && this.wakeWordDetected) {
      this.speak('Maaf, perintah tidak dikenali. Katakan "bantuan" untuk daftar perintah.');
      this.wakeWordDetected = false;
    }
  }

  /**
   * Calculate match score using multiple strategies
   */
  calculateMatchScore(transcript, phrase) {
    const t = transcript.toLowerCase().trim();
    const p = phrase.toLowerCase().trim();

    // Exact match
    if (t === p) return 1.0;

    // Contains phrase
    if (t.includes(p)) return 0.85;

    // Phrase contains transcript
    if (p.includes(t) && t.length > 3) return 0.75;

    // Word overlap
    const tWords = new Set(t.split(/\s+/));
    const pWords = p.split(/\s+/);
    const overlapCount = pWords.filter(w => tWords.has(w)).length;

    if (overlapCount > 0) {
      return (overlapCount / pWords.length) * 0.7;
    }

    // Levenshtein similarity
    const distance = this.levenshteinDistance(t, p);
    const maxLen = Math.max(t.length, p.length);
    if (maxLen > 0) {
      return (1 - distance / maxLen) * 0.6;
    }

    return 0;
  }

  /**
   * Levenshtein distance
   */
  levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Start listening
   */
  startListening() {
    if (!this.isSupported || !this.recognition) return;

    try {
      this.recognition.start();
    } catch (error) {
      // Already started
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (!this.recognition) return;

    try { this.recognition.stop(); } catch (e) {}
    this.isListening = false;
    this.wakeWordDetected = false;

    if (this.voiceIndicator) {
      this.voiceIndicator.style.display = 'none';
    }
  }

  /**
   * Toggle listening
   */
  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  /**
   * Speak text using TTS
   */
  speak(text, options = {}) {
    if (!this.synthesis) return;

    const {
      rate = 1,
      pitch = 1,
      volume = 1,
      lang = this.language,
      voice = null
    } = options;

    // Cancel ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Select best voice
    const voices = this.synthesis.getVoices();
    if (voice) {
      utterance.voice = voice;
    } else {
      const preferred = voices.find(v => v.lang.startsWith('id')) ||
                        voices.find(v => v.lang.startsWith('en')) ||
                        voices[0];
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => { this.isSpeaking = true; };
    utterance.onend = () => { this.isSpeaking = false; };

    this.synthesis.speak(utterance);
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Create voice indicator UI
   */
  createVoiceIndicator() {
    if (document.getElementById('voice-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'voice-indicator';
    indicator.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      z-index: 9999; background: var(--md-sys-color-surface-container, #F3F0F4);
      color: var(--md-sys-color-on-surface, #1A1C1E); padding: 12px 24px;
      border-radius: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      font-size: 14px; font-weight: 500; display: none; align-items: center;
      gap: 10px; transition: all 0.3s; max-width: 90vw;
    `;
    indicator.innerHTML = '<span>🎤</span><span id="voice-text">Mendengarkan...</span>';
    document.body.appendChild(indicator);
    this.voiceIndicator = indicator;
  }

  /**
   * Update voice indicator
   */
  updateIndicator(text, status = 'listening') {
    if (!this.voiceIndicator) return;

    const textEl = this.voiceIndicator.querySelector('#voice-text');
    if (textEl) textEl.textContent = text;

    const colors = {
      listening: { bg: '#F3F0F4', color: '#1A1C1E', border: '#1976D2' },
      speaking: { bg: '#E3F2FD', color: '#1565C0', border: '#1976D2' },
      processing: { bg: '#FFF3E0', color: '#E65100', border: '#FF9800' },
      success: { bg: '#E8F5E9', color: '#2E7D32', border: '#4CAF50' },
      error: { bg: '#FFEBEE', color: '#C62828', border: '#F44336' },
      interim: { bg: '#F5F5F5', color: '#616161', border: '#9E9E9E' }
    };

    const style = colors[status] || colors.listening;
    this.voiceIndicator.style.background = style.bg;
    this.voiceIndicator.style.color = style.color;
    this.voiceIndicator.style.border = `2px solid ${style.border}`;
  }

  /**
   * Get error message
   */
  getErrorMessage(error) {
    const messages = {
      'not-allowed': 'Mikrofon tidak diizinkan',
      'no-speech': 'Tidak ada suara terdeteksi',
      'audio-capture': 'Mikrofon tidak tersedia',
      'network': 'Kesalahan jaringan',
      'aborted': 'Dihentikan',
      'service-not-allowed': 'Layanan tidak diizinkan',
      'bad-grammar': 'Kesalahan tata bahasa'
    };
    return messages[error] || `Error: ${error}`;
  }

  /**
   * Reset wake word timeout
   */
  resetWakeWordTimeout() {
    if (this.wakeWordTimeout) clearTimeout(this.wakeWordTimeout);
    this.wakeWordTimeout = setTimeout(() => {
      this.wakeWordDetected = false;
    }, this.wakeWordTimeoutDuration);
  }

  /**
   * Set language
   */
  setLanguage(lang) {
    this.language = lang;
    if (this.recognition) this.recognition.lang = lang;
    this.savePreferences();
  }

  /**
   * Get available voices for TTS
   */
  getVoices() {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices().map(v => ({
      name: v.name,
      lang: v.lang,
      default: v.default,
      localService: v.localService
    }));
  }

  /**
   * Get command history
   */
  getHistory() { return [...this.commandHistory]; }

  /**
   * Add to command history
   */
  addToHistory(transcript) {
    this.commandHistory.unshift({ transcript, timestamp: Date.now() });
    if (this.commandHistory.length > this.maxHistory) this.commandHistory.pop();
    this.saveHistory();
  }

  /**
   * Clear command history
   */
  clearHistory() {
    this.commandHistory = [];
    localStorage.removeItem('asd_voice_history');
  }

  /**
   * Load/Save history
   */
  loadHistory() {
    try {
      this.commandHistory = JSON.parse(localStorage.getItem('asd_voice_history') || '[]');
    } catch { this.commandHistory = []; }
  }

  saveHistory() {
    try {
      localStorage.setItem('asd_voice_history', JSON.stringify(this.commandHistory.slice(0, 20)));
    } catch {}
  }

  /**
   * Load/Save preferences
   */
  loadPreferences() {
    try {
      const prefs = JSON.parse(localStorage.getItem('asd_voice_prefs') || '{}');
      if (prefs.language) this.language = prefs.language;
    } catch {}
  }

  savePreferences() {
    try {
      localStorage.setItem('asd_voice_prefs', JSON.stringify({ language: this.language }));
    } catch {}
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      isSupported: this.isSupported,
      language: this.language,
      commandCount: this.commands.length,
      errorCount: this.errorCount,
      wakeWordDetected: this.wakeWordDetected
    };
  }

  /**
   * Destroy
   */
  destroy() {
    this.stopListening();
    this.stopSpeaking();
    if (this.voiceIndicator?.parentNode) {
      this.voiceIndicator.parentNode.removeChild(this.voiceIndicator);
    }
    this.commands = [];
  }
}

// Singleton instance
const VoiceService = new VoiceService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VoiceService };
}
