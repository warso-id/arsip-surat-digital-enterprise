/**
 * RICH TEXT EDITOR - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * WYSIWYG editor for text formatting
 */

class RichEditor {
  constructor(options = {}) {
    this.options = {
      container: null,
      placeholder: 'Tulis konten...',
      value: '',
      toolbar: ['bold', 'italic', 'underline', 'strikethrough', '|', 'orderedList', 'unorderedList', '|', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', '|', 'link', 'image', '|', 'undo', 'redo'],
      height: '300px',
      onChange: null,
      onFocus: null,
      onBlur: null,
      ...options
    };
    
    this.container = null;
    this.editor = null;
    this.toolbar = null;
    this.isFocused = false;
    this.undoStack = [];
    this.redoStack = [];
  }
  
  /**
   * Initialize editor
   */
  init() {
    this.container = this.options.container;
    if (!this.container) {
      console.error('RichEditor: container is required');
      return;
    }
    
    this.render();
    this.bindEvents();
    
    if (this.options.value) {
      this.setContent(this.options.value);
    }
  }
  
  /**
   * Render editor
   */
  render() {
    this.container.innerHTML = `
      <div class="rich-editor">
        <div class="rich-editor__toolbar" id="editor-toolbar">
          ${this.renderToolbar()}
        </div>
        <div class="rich-editor__content" 
             id="editor-content" 
             contenteditable="true" 
             data-placeholder="${this.options.placeholder}"
             style="min-height:${this.options.height}">
        </div>
      </div>
    `;
    
    this.toolbar = this.container.querySelector('#editor-toolbar');
    this.editor = this.container.querySelector('#editor-content');
  }
  
  /**
   * Render toolbar
   */
  renderToolbar() {
    const tools = {
      'bold': { icon: 'format_bold', title: 'Tebal (Ctrl+B)', command: 'bold' },
      'italic': { icon: 'format_italic', title: 'Miring (Ctrl+I)', command: 'italic' },
      'underline': { icon: 'format_underlined', title: 'Garis Bawah (Ctrl+U)', command: 'underline' },
      'strikethrough': { icon: 'strikethrough_s', title: 'Coret', command: 'strikeThrough' },
      'orderedList': { icon: 'format_list_numbered', title: 'Daftar Bernomor', command: 'insertOrderedList' },
      'unorderedList': { icon: 'format_list_bulleted', title: 'Daftar', command: 'insertUnorderedList' },
      'alignLeft': { icon: 'format_align_left', title: 'Rata Kiri', command: 'justifyLeft' },
      'alignCenter': { icon: 'format_align_center', title: 'Tengah', command: 'justifyCenter' },
      'alignRight': { icon: 'format_align_right', title: 'Rata Kanan', command: 'justifyRight' },
      'alignJustify': { icon: 'format_align_justify', title: 'Rata Penuh', command: 'justifyFull' },
      'link': { icon: 'link', title: 'Tautan', command: 'createLink' },
      'image': { icon: 'image', title: 'Gambar', command: 'insertImage' },
      'undo': { icon: 'undo', title: 'Undo (Ctrl+Z)', command: 'undo' },
      'redo': { icon: 'redo', title: 'Redo (Ctrl+Y)', command: 'redo' }
    };
    
    return this.options.toolbar.map(item => {
      if (item === '|') return '<div class="rich-editor__divider"></div>';
      
      const tool = tools[item];
      if (!tool) return '';
      
      return `
        <button type="button" class="rich-editor__tool" data-command="${tool.command}" title="${tool.title}">
          <span class="material-icons">${tool.icon}</span>
        </button>
      `;
    }).join('');
  }
  
  /**
   * Execute command
   */
  executeCommand(command, value = null) {
    document.execCommand(command, false, value);
    this.editor.focus();
    this.updateToolbarState();
    this.saveUndoState();
    
    if (this.options.onChange) {
      this.options.onChange(this.getContent());
    }
  }
  
  /**
   * Save undo state
   */
  saveUndoState() {
    this.undoStack.push(this.editor.innerHTML);
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }
  
  /**
   * Undo
   */
  undo() {
    if (this.undoStack.length <= 1) return;
    
    this.redoStack.push(this.undoStack.pop());
    this.editor.innerHTML = this.undoStack[this.undoStack.length - 1];
    
    if (this.options.onChange) {
      this.options.onChange(this.getContent());
    }
  }
  
  /**
   * Redo
   */
  redo() {
    if (this.redoStack.length === 0) return;
    
    const state = this.redoStack.pop();
    this.undoStack.push(state);
    this.editor.innerHTML = state;
    
    if (this.options.onChange) {
      this.options.onChange(this.getContent());
    }
  }
  
  /**
   * Update toolbar button states
   */
  updateToolbarState() {
    const buttons = this.toolbar.querySelectorAll('.rich-editor__tool');
    buttons.forEach(btn => {
      const command = btn.dataset.command;
      if (command && document.queryCommandState(command)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  /**
   * Insert link
   */
  insertLink() {
    const url = prompt('Masukkan URL:', 'https://');
    if (url) {
      this.executeCommand('createLink', url);
    }
  }
  
  /**
   * Insert image
   */
  insertImage() {
    const url = prompt('Masukkan URL gambar:', 'https://');
    if (url) {
      this.executeCommand('insertImage', url);
    }
  }
  
  /**
   * Get content
   */
  getContent() {
    return this.editor ? this.editor.innerHTML : '';
  }
  
  /**
   * Get plain text
   */
  getText() {
    return this.editor ? this.editor.textContent : '';
  }
  
  /**
   * Set content
   */
  setContent(html) {
    if (this.editor) {
      this.editor.innerHTML = html;
      this.saveUndoState();
    }
  }
  
  /**
   * Clear content
   */
  clear() {
    if (this.editor) {
      this.editor.innerHTML = '';
      this.saveUndoState();
      
      if (this.options.onChange) {
        this.options.onChange('');
      }
    }
  }
  
  /**
   * Focus editor
   */
  focus() {
    if (this.editor) this.editor.focus();
  }
  
  /**
   * Bind events
   */
  bindEvents() {
    // Toolbar buttons
    this.toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.rich-editor__tool');
      if (!btn) return;
      
      const command = btn.dataset.command;
      
      if (command === 'createLink') {
        this.insertLink();
      } else if (command === 'insertImage') {
        this.insertImage();
      } else if (command === 'undo') {
        this.undo();
      } else if (command === 'redo') {
        this.redo();
      } else {
        this.executeCommand(command);
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
      if (this.options.onBlur) this.options.onBlur();
    });
    
    this.editor.addEventListener('input', () => {
      if (this.options.onChange) {
        this.options.onChange(this.getContent());
      }
    });
    
    this.editor.addEventListener('keydown', (e) => {
      this.updateToolbarState();
      
      // Keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b': e.preventDefault(); this.executeCommand('bold'); break;
          case 'i': e.preventDefault(); this.executeCommand('italic'); break;
          case 'u': e.preventDefault(); this.executeCommand('underline'); break;
          case 'z': e.preventDefault(); this.undo(); break;
          case 'y': e.preventDefault(); this.redo(); break;
          case 'k': e.preventDefault(); this.insertLink(); break;
        }
      }
    });
    
    // Paste handling
    this.editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });
  }
  
  /**
   * Destroy editor
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RichEditor };
}
