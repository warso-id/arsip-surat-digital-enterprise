<template>
  <div class="qrcode-generator">
    <div class="qrcode-container" v-if="data">
      <canvas ref="qrcanvas"></canvas>
      <p class="qrcode-label">{{ label }}</p>
    </div>
    <div class="qrcode-actions" v-if="data">
      <button class="btn btn-sm btn-secondary" @click="downloadQR">
        📥 Download QR
      </button>
      <button class="btn btn-sm btn-secondary" @click="printQR">
        🖨️ Cetak
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import QRCode from 'qrcode'

export default {
  name: 'QRCodeGenerator',
  props: {
    data: { type: String, default: '' },
    label: { type: String, default: '' },
    size: { type: Number, default: 200 },
    colorDark: { type: String, default: '#000000' },
    colorLight: { type: String, default: '#FFFFFF' }
  },
  setup(props) {
    const qrcanvas = ref(null)
    
    const generateQR = async () => {
      if (!qrcanvas.value || !props.data) return
      
      try {
        await QRCode.toCanvas(qrcanvas.value, props.data, {
          width: props.size,
          margin: 2,
          color: {
            dark: props.colorDark,
            light: props.colorLight
          }
        })
      } catch (err) {
        console.error('QR generation error:', err)
      }
    }
    
    const downloadQR = () => {
      if (!qrcanvas.value) return
      const link = document.createElement('a')
      link.download = `qrcode-${props.label || 'surat'}.png`
      link.href = qrcanvas.value.toDataURL('image/png')
      link.click()
    }
    
    const printQR = () => {
      if (!qrcanvas.value) return
      const win = window.open('', '_blank')
      win.document.write(`<img src="${qrcanvas.value.toDataURL('image/png')}" style="max-width:100%"/>`)
      win.print()
    }
    
    watch(() => props.data, () => { if (props.data) generateQR() })
    
    onMounted(() => { if (props.data) generateQR() })
    
    return { qrcanvas, downloadQR, printQR }
  }
}
</script>

<style lang="scss" scoped>
.qrcode-generator { text-align: center; }
.qrcode-container {
  display: inline-block; padding: 16px; background: white; border-radius: var(--radius-lg);
  border: 1px solid var(--border-color); margin-bottom: 12px;
  canvas { display: block; }
}
.qrcode-label { margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary); font-family: var(--font-mono); }
.qrcode-actions { display: flex; gap: 8px; justify-content: center; }
</style>
