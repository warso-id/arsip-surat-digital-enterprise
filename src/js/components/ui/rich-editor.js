/**
 * ============================================
 * RICH TEXT EDITOR - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL WYSIWYG EDITOR - SIAP PRODUKSI
 * Mendukung: Toolbar, Formatting, Image, Link,
 * Table, Source View, Word Count, API Integration
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class RichEditor {
  constructor(options = {}) {
    this.options = {
      container: null,
      placeholder: 'Tulis konten...',
      value: '',
      toolbar: [
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'heading', '|',
        'orderedList', 'unorderedList', '|',
        'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', '|',
        'link', 'image', 'table', '|',
        'removeFormat', '|',
        'undo', 'redo', '|',
        'sourceView'
      ],
      height: '300px',
      minHeight: '150px',
      maxHeight: '600px',
      readOnly: false,
      spellcheck: true,
      allowedTags: null,
      disallowedTags: null,
      maxLength: 0,
      showWordCount: false,
      wordCountPosition: 'bottom',
      autoSave: false,
      autoSaveInterval: 30000,
      autoSaveKey: null,
      onChange: null,
      onFocus: null,
      onBlur: null,
      onPaste: null,
      onImageUpload: null,
      imageUploadEndpoint: 'file.upload',
      ...options
    };

    this.container = null;
    this.editor = null;
    this.toolbar = null;
    this.isFocused = false;
    this.isSourceView = false;
    this.undoStack = [];
    this.redoStack = [];
    this.autoSaveTimer = null;
    this.editorId = 'richedit-' + Math.random().toString(36).substr(2, 9);
    this.headingMenuOpen = false;
  }

  init() {
    this.container = this.options.container;
    if (!this.container) {
      console.error('RichEditor: container is required');
      return;
    }

    this.container.setAttribute('data-editor-id', this.editorId);
    this.render();
    this.bindEvents();

    if (this.options.value) {
      this.setContent(this.options.value);
    }

    if (this.options.autoSave) {
      this.startAutoSave();
    }

    console.log('✅ RichEditor initialized');
  }

  render() {
    const readOnly = this.options.readOnly ? 'contenteditable="false"' : 'contenteditable="true"';
    const spellcheck = this.options.spellcheck ? 'spellcheck="true"' : 'spellcheck="false"';

    this.container.innerHTML = `
      <div class="rich-editor ${this.options.readOnly ? 'rich-editor--readonly' : ''}" id="${this.editorId}">
        ${!this.options.readOnly ? `
          <div class="rich-editor__toolbar" id="editor-toolbar-${this.editorId}">
            ${this.renderToolbar()}
          </div>
        ` : ''}

        <div class="rich-editor__content-wrapper" style="position:relative">
          <div class="rich-editor__content" 
               id="editor-content-${this.editorId}" 
               ${readOnly}
               ${spellcheck}
               data-placeholder="${this.options.placeholder}"
               style="min-height:${this.options.minHeight};max-height:${this.options.maxHeight};height:${this.options.height}">
          </div>

          <div class="rich-editor__source" id="editor-source-${this.editorId}" style="display:none">
            <textarea class="rich-editor__source-textarea" 
                      id="editor-textarea-${this.editorId}"
                      style="min-height:${this.options.minHeight};max-height:${this.options.maxHeight};height:${this.options.height}"
                      placeholder="${this.options.placeholder}"></textarea>
          </div>
        </div>

        ${this.options.showWordCount ? `
          <div class="rich-editor__footer">
            <span class="rich-editor__word-count" id="editor-wordcount-${this.editorId}">
              <span class="material-icons" style="font-size:14px">text_fields</span>
              <span id="editor-count-${this.editorId}">0 karakter</span>
            </span>
          </div>
        ` : ''}

        <div class="rich-editor__image-modal hidden" id="editor-image-modal-${this.editorId}">
          <div class="rich-editor__image-modal-content">
            <h4>Masukkan Gambar</h4>
            <div class="form-field">
              <label class="form-label">URL Gambar</label>
              <input type="url" class="form-input" id="editor-image-url-${this.editorId}" placeholder="https://...">
            </div>
            <div class="rich-editor__image-modal-or">
              <span>atau</span>
            </div>
            <div class="form-field">
              <label class="form-label">Upload Gambar</label>
              <input type="file" id="editor-image-file-${this.editorId}" accept="image/*">
            </div>
            <div class="rich-editor__image-preview hidden" id="editor-image-preview-${this.editorId}">
              <img src="" alt="Preview" style="max-width:100%;max-height:200px;border-radius:8px">
            </div>
            <div class="rich-editor__image-modal-actions">
              <button class="btn btn-ghost btn-sm image-modal-cancel">Batal</button>
              <button class="btn btn-primary btn-sm image-modal-insert">Masukkan</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.toolbar = this.container.querySelector(`#editor-toolbar-${this.editorId}`);
    this.editor = this.container.querySelector(`#editor-content-${this.editorId}`);
    this.sourceTextarea = this.container.querySelector(`#editor-textarea-${this.editorId}`);
    this.sourceView = this.container.querySelector(`#editor-source-${this.editorId}`);
    this.imageModal = this.container.querySelector(`#editor-image-modal-${this.editorId}`);
  }

  renderToolbar() {
    const tools = {
      'bold': { icon: 'format_bold', title: 'Tebal (Ctrl+B)', command: 'bold', tag: 'b' },
      'italic': { icon: 'format_italic', title: 'Miring (Ctrl+I)', command: 'italic', tag: 'i' },
      'underline': { icon: 'format_underlined', title: 'Garis Bawah (Ctrl+U)', command: 'underline', tag: 'u' },
      'strikethrough': { icon: 'strikethrough_s', title: 'Coret', command: 'strikeThrough', tag: 's' },
      'subscript': { icon: 'subscript', title: 'Subscript', command: 'subscript' },
      'superscript': { icon: 'superscript', title: 'Superscript', command: 'superscript' },
      'heading': { icon: 'title', title: 'Heading', command: 'heading', type: 'dropdown', items: [
        { label: 'Normal', command: 'formatBlock', value: 'p' },
        { label: 'Heading 1', command: 'formatBlock', value: 'h2' },
        { label: 'Heading 2', command: 'formatBlock', value: 'h3' },
        { label: 'Heading 3', command: 'formatBlock', value: 'h4' }
      ]},
      'orderedList': { icon: 'format_list_numbered', title: 'Daftar Bernomor', command: 'insertOrderedList' },
      'unorderedList': { icon: 'format_list_bulleted', title: 'Daftar', command: 'insertUnorderedList' },
      'alignLeft': { icon: 'format_align_left', title: 'Rata Kiri', command: 'justifyLeft' },
      'alignCenter': { icon: 'format_align_center', title: 'Tengah', command: 'justifyCenter' },
      'alignRight': { icon: 'format_align_right', title: 'Rata Kanan', command: 'justifyRight' },
      'alignJustify': { icon: 'format_align_justify', title: 'Rata Penuh', command: 'justifyFull' },
      'indent': { icon: 'format_indent_increase', title: 'Tambah Indent', command: 'indent' },
      'outdent': { icon: 'format_indent_decrease', title: 'Kurangi Indent', command: 'outdent' },
      'link': { icon: 'link', title: 'Tautan (Ctrl+K)', command: 'createLink' },
      'image': { icon: 'image', title: 'Gambar', command: 'insertImage', type: 'custom' },
      'table': { icon: 'table_chart', title: 'Tabel', command: 'insertTable', type: 'dropdown', items: [
        { label: '2×2', command: 'insertTable', value: '2x2' },
        { label: '3×3', command: 'insertTable', value: '3x3' },
        { label: '4×4', command: 'insertTable', value: '4x4' }
      ]},
      'horizontalRule': { icon: 'horizontal_rule', title: 'Garis Horizontal', command: 'insertHorizontalRule' },
      'removeFormat': { icon: 'format_clear', title: 'Hapus Format', command: 'removeFormat' },
      'undo': { icon: 'undo', title: 'Undo (Ctrl+Z)', command: 'undo', type: 'custom' },
      'redo': { icon: 'redo', title: 'Redo (Ctrl+Y)', command: 'redo', type: 'custom' },
      'sourceView': { icon: 'code', title: 'Lihat Sumber', command: 'sourceView', type: 'custom' }
    };

    return this.options.toolbar.map(item => {
      if (item === '|') return '<div class="rich-editor__divider"></div>';

      const tool = tools[item];
      if (!tool) return '';

      if (tool.type === 'dropdown' && tool.items) {
        return `
          <div class="rich-editor__dropdown">
            <button type="button" class="rich-editor__tool rich-editor__dropdown-btn" data-command="${tool.command}" title="${tool.title}">
              <span class="material-icons">${tool.icon}</span>
              <span class="material-icons" style="font-size:16px">arrow_drop_down</span>
            </button>
            <div class="rich-editor__dropdown-menu">
              ${tool.items.map(it => `
                <button type="button" class="rich-editor__dropdown-item" data-command="${it.command}" data-value="${it.value || ''}">
                  ${it.label}
                </button>
              `).join('')}
            </div>
          </div>
        `;
      }

      return `
        <button type="button" class="rich-editor__tool" data-command="${tool.command}" title="${tool.title}">
          <span class="material-icons">${tool.icon}</span>
        </button>
      `;
    }).join('');
  }

  executeCommand(command, value = null, showUI = false) {
    this.editor.focus();

    if (command === 'insertTable' && value) {
      this.insertTable(value);
      return;
    }

    if (command === 'formatBlock' && value) {
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, showUI, value);
    }

    this.updateToolbarState();
    this.saveUndoState();
    this.updateWordCount();
    this.emitChange();
  }

  insertTable(size) {
    const [rows, cols] = size.split('x').map(Number);
    let tableHTML = '<table class="rich-editor__table" style="width:100%;border-collapse:collapse">';
    for (let r = 0; r < rows; r++) {
      tableHTML += '<tr>';
      for (let c = 0; c < cols; c++) {
        tableHTML += '<td style="border:1px solid #ccc;padding:8px;min-width:60px">&nbsp;</td>';
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</table><p>&nbsp;</p>';
    document.execCommand('insertHTML', false, tableHTML);
    this.saveUndoState();
  }

  saveUndoState() {
    this.undoStack.push(this.editor.innerHTML);
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length <= 1) return;
    this.redoStack.push(this.undoStack.pop());
    this.editor.innerHTML = this.undoStack[this.undoStack.length - 1];
    this.updateToolbarState();
    this.updateWordCount();
    this.emitChange();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const state = this.redoStack.pop();
    this.undoStack.push(state);
    this.editor.innerHTML = state;
    this.updateToolbarState();
    this.updateWordCount();
    this.emitChange();
  }

  updateToolbarState() {
    if (!this.toolbar) return;
    const buttons = this.toolbar.querySelectorAll('.rich-editor__tool');
    buttons.forEach(btn => {
      const command = btn.dataset.command;
      if (!command || command === 'undo' || command === 'redo' || command === 'sourceView' || command === 'removeFormat') return;
      try {
        if (document.queryCommandState(command)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      } catch (e) {}
    });
  }

  insertLink() {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    const defaultUrl = selectedText && selectedText.match(/^https?:\/\//) ? selectedText : 'https://';

    const url = prompt('Masukkan URL:', defaultUrl);
    if (!url) return;

    if (!selectedText || selectedText === url) {
      const text = prompt('Teks tampilan:', url);
      if (text === null) return;
      this.editor.focus();
      if (text && text !== url) {
        document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener">${text}</a>`);
      } else {
        document.execCommand('createLink', false, url);
      }
    } else {
      document.execCommand('createLink', false, url);
    }

    this.saveUndoState();
    this.emitChange();
  }

  openImageModal() {
    if (!this.imageModal) return;
    this.imageModal.classList.remove('hidden');
    const urlInput = this.container.querySelector(`#editor-image-url-${this.editorId}`);
    if (urlInput) urlInput.value = '';
    const fileInput = this.container.querySelector(`#editor-image-file-${this.editorId}`);
    if (fileInput) fileInput.value = '';
    const preview = this.container.querySelector(`#editor-image-preview-${this.editorId}`);
    if (preview) preview.classList.add('hidden');
  }

  closeImageModal() {
    if (this.imageModal) this.imageModal.classList.add('hidden');
  }

  insertImageFromUrl() {
    const urlInput = this.container.querySelector(`#editor-image-url-${this.editorId}`);
    const url = urlInput?.value?.trim();
    if (!url) { this.showToast('Masukkan URL gambar', 'warning'); return; }

    this.editor.focus();
    document.execCommand('insertImage', false, url);
    this.closeImageModal();
    this.saveUndoState();
    this.emitChange();
  }

  async insertImageFromFile() {
    const fileInput = this.container.querySelector(`#editor-image-file-${this.editorId}`);
    const file = fileInput?.files?.[0];
    if (!file) { this.showToast('Pilih file gambar', 'warning'); return; }

    if (this.options.onImageUpload) {
      try {
        const result = await this.options.onImageUpload(file);
        if (result?.url || result?.data?.fileUrl) {
          const imgUrl = result.url || result.data.fileUrl;
          this.editor.focus();
          document.execCommand('insertImage', false, imgUrl);
          this.closeImageModal();
          this.saveUndoState();
          this.emitChange();
        }
      } catch (error) {
        this.showToast('Gagal upload gambar: ' + error.message, 'error');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.editor.focus();
      document.execCommand('insertImage', false, e.target.result);
      this.closeImageModal();
      this.saveUndoState();
      this.emitChange();
    };
    reader.readAsDataURL(file);
  }

  toggleSourceView() {
    this.isSourceView = !this.isSourceView;
    const contentDiv = this.container.querySelector(`#editor-content-${this.editorId}`);
    const sourceDiv = this.container.querySelector(`#editor-source-${this.editorId}`);

    if (this.isSourceView) {
      this.sourceTextarea.value = this.getContent();
      if (contentDiv) contentDiv.style.display = 'none';
      if (sourceDiv) sourceDiv.style.display = 'block';
      this.sourceTextarea.focus();
      const sourceBtn = this.toolbar?.querySelector('[data-command="sourceView"]');
      if (sourceBtn) sourceBtn.classList.add('active');
    } else {
      this.setContent(this.sourceTextarea.value);
      if (contentDiv) contentDiv.style.display = '';
      if (sourceDiv) sourceDiv.style.display = 'none';
      const sourceBtn = this.toolbar?.querySelector('[data-command="sourceView"]');
      if (sourceBtn) sourceBtn.classList.remove('active');
      this.saveUndoState();
      this.emitChange();
    }
  }

  updateWordCount() {
    if (!this.options.showWordCount) return;
    const countEl = this.container.querySelector(`#editor-count-${this.editorId}`);
    if (!countEl) return;
    const text = this.getText();
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    countEl.textContent = `${charCount} karakter, ${wordCount} kata`;
    if (this.options.maxLength > 0 && charCount > this.options.maxLength) {
      countEl.style.color = 'var(--md-sys-color-error, #BA1A1A)';
    } else {
      countEl.style.color = '';
    }
  }

  enforceMaxLength() {
    if (!this.options.maxLength || this.options.maxLength <= 0) return;
    const text = this.getText();
    if (text.length > this.options.maxLength) {
      this.showToast(`Maksimal ${this.options.maxLength} karakter`, 'warning');
      const truncated = text.substring(0, this.options.maxLength);
      this.editor.textContent = truncated;
      const range = document.createRange();
      range.selectNodeContents(this.editor);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  emitChange() {
    if (this.options.onChange) {
      this.options.onChange(this.getContent(), this.getText());
    }
    if (this.options.autoSave) {
      this.scheduleAutoSave();
    }
  }

  scheduleAutoSave() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      this.saveToStorage();
    }, this.options.autoSaveInterval);
  }

  startAutoSave() {
    const key = this.options.autoSaveKey || `asd_editor_${this.editorId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.content) this.setContent(data.content);
      } catch (e) {}
    }
  }

  saveToStorage() {
    const key = this.options.autoSaveKey || `asd_editor_${this.editorId}`;
    try {
      localStorage.setItem(key, JSON.stringify({
        content: this.getContent(),
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  getContent() { return this.editor ? this.editor.innerHTML : ''; }
  getText() { return this.editor ? (this.editor.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  setContent(html) {
    if (this.editor) {
      this.editor.innerHTML = html || '';
      this.saveUndoState();
      this.updateWordCount();
    }
  }

  clear() {
    if (this.editor) {
      this.editor.innerHTML = '';
      this.saveUndoState();
      this.updateWordCount();
      this.emitChange();
    }
  }

  focus() { if (this.editor) this.editor.focus(); }
  blur() { if (this.editor) this.editor.blur(); }

  setReadOnly(readOnly) {
    this.options.readOnly = readOnly;
    if (this.editor) this.editor.contentEditable = readOnly ? 'false' : 'true';
    if (this.toolbar) this.toolbar.style.display = readOnly ? 'none' : '';
  }

  showToast(message, type = 'info') {
    if (typeof Toast !== 'undefined') {
      Toast.show(message, type);
    } else if (typeof NotificationService !== 'undefined') {
      NotificationService.show(message, type);
    }
  }

  bindEvents() {
    if (!this.container) return;

    // Toolbar buttons
    if (this.toolbar) {
      this.toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.rich-editor__tool');
        if (!btn) return;
        const command = btn.dataset.command;

        if (command === 'createLink') { this.insertLink(); return; }
        if (command === 'insertImage') { this.openImageModal(); return; }
        if (command === 'undo') { this.undo(); return; }
        if (command === 'redo') { this.redo(); return; }
        if (command === 'sourceView') { this.toggleSourceView(); return; }
        if (command === 'removeFormat') {
          document.execCommand('removeFormat', false, null);
          this.saveUndoState(); this.emitChange(); return;
        }
        if (command === 'insertTable') { this.insertTable('3x3'); return; }
        this.executeCommand(command);
      });

      // Dropdown items
      this.toolbar.addEventListener('click', (e) => {
        const item = e.target.closest('.rich-editor__dropdown-item');
        if (!item) return;
        const command = item.dataset.command;
        const value = item.dataset.value;
        if (command === 'insertTable' && value) { this.insertTable(value); }
        else if (command === 'formatBlock' && value) { this.executeCommand('formatBlock', value); }
        else { this.executeCommand(command, value); }
        const dropdown = item.closest('.rich-editor__dropdown');
        if (dropdown) dropdown.classList.remove('rich-editor__dropdown--open');
      });

      // Toggle dropdown
      this.toolbar.addEventListener('click', (e) => {
        const dropdownBtn = e.target.closest('.rich-editor__dropdown-btn');
        if (dropdownBtn) {
          const dropdown = dropdownBtn.closest('.rich-editor__dropdown');
          if (dropdown) {
            const wasOpen = dropdown.classList.contains('rich-editor__dropdown--open');
            this.toolbar.querySelectorAll('.rich-editor__dropdown--open').forEach(d => d.classList.remove('rich-editor__dropdown--open'));
            if (!wasOpen) dropdown.classList.add('rich-editor__dropdown--open');
          }
        }
      });
    }

    // Image modal
    this.container.querySelector('.image-modal-insert')?.addEventListener('click', () => {
      const urlInput = this.container.querySelector(`#editor-image-url-${this.editorId}`);
      if (urlInput?.value) { this.insertImageFromUrl(); }
      else { this.insertImageFromFile(); }
    });
    this.container.querySelector('.image-modal-cancel')?.addEventListener('click', () => this.closeImageModal());
    this.container.querySelector(`#editor-image-url-${this.editorId}`)?.addEventListener('input', (e) => {
      const preview = this.container.querySelector(`#editor-image-preview-${this.editorId}`);
      const img = preview?.querySelector('img');
      if (preview && img && e.target.value) {
        preview.classList.remove('hidden');
        img.src = e.target.value;
      } else if (preview) {
        preview.classList.add('hidden');
      }
    });
    this.container.querySelector(`#editor-image-file-${this.editorId}`)?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const preview = this.container.querySelector(`#editor-image-preview-${this.editorId}`);
          const img = preview?.querySelector('img');
          if (preview && img) { preview.classList.remove('hidden'); img.src = ev.target.result; }
        };
        reader.readAsDataURL(file);
      }
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (this.toolbar && !this.toolbar.contains(e.target)) {
        this.toolbar.querySelectorAll('.rich-editor__dropdown--open').forEach(d => d.classList.remove('rich-editor__dropdown--open'));
      }
    });

    // Editor events
    this.editor.addEventListener('focus', () => {
      this.isFocused = true;
      this.container.classList.add('rich-editor--focused');
      if (this.options.onFocus) this.options.onFocus();
    });

    this.editor.addEventListener('blur', () => {
      this.isFocused = false;
      this.container.classList.remove('rich-editor--focused');
      this.updateToolbarState();
      if (this.options.onBlur) this.options.onBlur();
    });

    this.editor.addEventListener('input', () => {
      this.updateToolbarState();
      this.updateWordCount();
      this.enforceMaxLength();
      this.emitChange();
    });

    this.editor.addEventListener('keydown', (e) => {
      this.updateToolbarState();
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b': e.preventDefault(); this.executeCommand('bold'); break;
          case 'i': e.preventDefault(); this.executeCommand('italic'); break;
          case 'u': e.preventDefault(); this.executeCommand('underline'); break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) this.redo(); else this.undo();
            break;
          case 'y': e.preventDefault(); this.redo(); break;
          case 'k': e.preventDefault(); this.insertLink(); break;
          case 's': e.preventDefault(); this.saveToStorage(); this.showToast('Tersimpan', 'success'); break;
        }
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertHTML', false, '&emsp;');
      }
    });

    // Paste handling
    this.editor.addEventListener('paste', (e) => {
      if (this.options.onPaste) {
        this.options.onPaste(e);
        return;
      }
      const hasHTML = (e.clipboardData || window.clipboardData).types.includes('text/html');
      if (!hasHTML) return;
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });

    // Source textarea
    this.sourceTextarea?.addEventListener('input', () => {
      this.updateWordCount();
    });

    this.sourceTextarea?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.toggleSourceView();
        this.showToast('Tersimpan', 'success');
      }
    });

    // Auto-save on unload
    window.addEventListener('beforeunload', () => {
      if (this.options.autoSave) this.saveToStorage();
    });
  }

  destroy() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    if (this.options.autoSave) this.saveToStorage();
    if (this.container) {
      this.container.innerHTML = '';
      this.container.removeAttribute('data-editor-id');
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RichEditor };
}
