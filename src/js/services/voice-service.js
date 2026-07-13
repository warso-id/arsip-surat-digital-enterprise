/**
 * VOICE SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Voice commands for hands-free navigation
 */

class VoiceService {
  constructor() {
    this.isListening = false;
    this.isSupported = false;
    this.recognition = null;
    this.commands = [];
    this.language = 'id-ID';
    this.confidenceThreshold = 0.7;
    this.wakeWord = 'arsip';
    this.wakeWordDetected = false;
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
  }
  
  /**
   * Initialize voice service
   */
  init() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
      this.registerDefaultCommands();
    } else {
      console.warn('Speech Recognition not supported');
    }
    
    console.log(`✅ Voice Service initialized (Supported: ${this.isSupported})`);
  }
  
  /**
   * Setup speech recognition
   */
  setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = this.language;
    this.recognition.maxAlternatives = 3;
    
    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      
      if (result.isFinal) {
        const transcript = result[0].transcript.toLowerCase().trim();
        const confidence = result[0].confidence;
        
        if (confidence >= this.confidenceThreshold) {
          this.processCommand(transcript, confidence);
        }
        
        if (this.onResult) {
          this.onResult(transcript, confidence);
        }
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error);
      
      if (this.onError) {
        this.onError(event.error);
      }
      
      // Auto-restart on certain errors
      if (event.error === 'no-speech' || event.error === 'aborted') {
        if (this.isListening) {
          setTimeout(() => this.startListening(), 500);
        }
      }
    };
    
    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStart) this.onStart();
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) this.onEnd();
      
      // Auto-restart if still supposed to be listening
      if (this.isListening) {
        setTimeout(() => this.startListening(), 300);
      }
    };
  }
  
  /**
   * Register default commands
   */
  registerDefaultCommands() {
    // Navigation commands
    this.registerCommand('dashboard', ['dashboard', 'beranda', 'home'], () => {
      router.navigate('/');
    });
    
    this.registerCommand('surat-masuk', ['surat masuk', 'inbox', 'surat diterima'], () => {
      router.navigate('/surat-masuk');
    });
    
    this.registerCommand('surat-keluar', ['surat keluar', 'outbox', 'surat dikirim'], () => {
      router.navigate('/surat-keluar');
    });
    
    this.registerCommand('disposisi', ['disposisi', 'forward'], () => {
      router.navigate('/disposisi');
    });
    
    this.registerCommand('pengguna', ['pengguna', 'users', 'user'], () => {
      router.navigate('/users');
    });
    
    this.registerCommand('pengaturan', ['pengaturan', 'settings', 'setting'], () => {
      router.navigate('/settings');
    });
    
    this.registerCommand('pencarian', ['cari', 'search', 'pencarian'], () => {
      router.navigate('/search');
    });
    
    // Action commands
    this.registerCommand('tambah-surat', ['tambah surat', 'surat baru', 'buat surat'], () => {
      router.navigate('/surat-masuk/create');
    });
    
    this.registerCommand('logout', ['keluar', 'logout', 'log out'], async () => {
      await AuthService.logout();
    });
    
    // UI commands
    this.registerCommand('toggle-sidebar', ['sembunyikan menu', 'tutup sidebar', 'buka sidebar', 'toggle menu'], () => {
      store.dispatch('app.sidebarCollapsed', !store.getState('app.sidebarCollapsed'));
    });
    
    this.registerCommand('toggle-theme', ['ganti tema', 'mode gelap', 'mode terang', 'dark mode', 'light mode'], () => {
      app.toggleTheme();
    });
    
    this.registerCommand('refresh', ['refresh', 'muat ulang', 'reload'], () => {
      router.reload();
    });
    
    this.registerCommand('go-back', ['kembali', 'back', 'go back'], () => {
      history.back();
    });
  }
  
  /**
   * Register command
   */
  registerCommand(name, phrases, action) {
    this.commands.push({ name, phrases, action });
  }
  
  /**
   * Process voice command
   */
  processCommand(transcript, confidence) {
    console.log(`Voice: "${transcript}" (${Math.round(confidence * 100)}%)`);
    
    // Check for wake word
    if (transcript.includes(this.wakeWord)) {
      this.wakeWordDetected = true;
      
      // Remove wake word from transcript
      transcript = transcript.replace(this.wakeWord, '').trim();
    }
    
    if (!this.wakeWordDetected && transcript.length < 5) return;
    
    // Find matching command
    let bestMatch = null;
    let bestScore = 0;
    
    for (const command of this.commands) {
      for (const phrase of command.phrases) {
        const score = this.calculateMatchScore(transcript, phrase);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = command;
        }
      }
    }
    
    // Execute if confidence is high enough
    if (bestMatch && bestScore > 0.6) {
      console.log(`Executing command: ${bestMatch.name} (score: ${bestScore})`);
      this.speak(`Menjalankan perintah ${bestMatch.name}`);
      bestMatch.action();
      this.wakeWordDetected = false;
    } else if (transcript.length > 3) {
      console.log('No matching command found');
    }
  }
  
  /**
   * Calculate match score between transcript and phrase
   */
  calculateMatchScore(transcript, phrase) {
    const t = transcript.toLowerCase();
    const p = phrase.toLowerCase();
    
    // Exact match
    if (t === p) return 1;
    
    // Contains
    if (t.includes(p)) return 0.8;
    
    // Word overlap
    const tWords = new Set(t.split(' '));
    const pWords = p.split(' ');
    const overlap = pWords.filter(w => tWords.has(w)).length;
    
    if (overlap > 0) {
      return (overlap / pWords.length) * 0.7;
    }
    
    // Levenshtein distance for close matches
    const distance = this.levenshteinDistance(t, p);
    const maxLen = Math.max(t.length, p.length);
    return 1 - (distance / maxLen);
  }
  
  /**
   * Levenshtein distance
   */
  levenshteinDistance(a, b) {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
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
      // Already started, ignore
    }
  }
  
  /**
   * Stop listening
   */
  stopListening() {
    if (!this.recognition) return;
    
    try {
      this.recognition.stop();
    } catch {}
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
   * Speak text (Text-to-Speech)
   */
  speak(text, options = {}) {
    if (!('speechSynthesis' in window)) return;
    
    const { rate = 1, pitch = 1, volume = 1, lang = this.language } = options;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('id') || v.lang.startsWith('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
  
  /**
   * Set language
   */
  setLanguage(lang) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }
  
  /**
   * Get list of available commands
   */
  getCommands() {
    return this.commands.map(c => ({
      name: c.name,
      phrases: c.phrases
    }));
  }
  
  /**
   * Check if voice is supported
   */
  isVoiceSupported() {
    return this.isSupported;
  }
  
  /**
   * Get listening status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      isSupported: this.isSupported,
      language: this.language,
      commandCount: this.commands.length
    };
  }
}

// Singleton instance
const VoiceService = new VoiceService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VoiceService };
}
