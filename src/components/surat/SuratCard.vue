<template>
  <div class="surat-card" @click="$emit('click', surat)">
    <div class="surat-card-header">
      <div class="surat-badge" :class="`badge-${type === 'masuk' ? 'info' : 'success'}`">
        {{ type === 'masuk' ? '📥 Surat Masuk' : '📤 Surat Keluar' }}
      </div>
      <div class="surat-date">{{ formatDate(surat.tanggalSurat || surat.createdAt) }}</div>
    </div>
    <h4 class="surat-perihal">{{ surat.perihal || 'Tanpa Perihal' }}</h4>
    <div class="surat-meta">
      <div class="surat-meta-item">
        <span class="meta-label">Nomor</span>
        <span class="meta-value">{{ surat.nomorSurat || surat.nomorAgenda || '-' }}</span>
      </div>
      <div class="surat-meta-item">
        <span class="meta-label">{{ type === 'masuk' ? 'Pengirim' : 'Tujuan' }}</span>
        <span class="meta-value">{{ type === 'masuk' ? surat.pengirim : surat.tujuan || '-' }}</span>
      </div>
    </div>
    <div class="surat-card-footer">
      <span class="badge" :class="`badge-${getStatusBadge(surat.status)}`">{{ surat.status }}</span>
      <span class="surat-action">Lihat →</span>
    </div>
  </div>
</template>

<script>
import { formatDate } from '@/utils/formatters'

export default {
  name: 'SuratCard',
  props: {
    surat: { type: Object, required: true },
    type: { type: String, default: 'masuk' }
  },
  emits: ['click'],
  setup() {
    const getStatusBadge = (s) => {
      const map = { diterima: 'info', diproses: 'warning', selesai: 'success', diarsipkan: 'secondary', draft: 'secondary', dikirim: 'info' }
      return map[s] || 'info'
    }
    return { formatDate, getStatusBadge }
  }
}
</script>

<style lang="scss" scoped>
.surat-card {
  background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg);
  padding: 20px; cursor: pointer; transition: all var(--transition-fast);
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); border-color: var(--color-primary); }
}
.surat-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.surat-badge { font-size: 0.7rem; font-weight: 600; padding: 4px 10px; border-radius: var(--radius-full); }
.surat-date { font-size: 0.75rem; color: var(--text-tertiary); }
.surat-perihal { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0 0 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.surat-meta { display: flex; gap: 24px; margin-bottom: 12px; }
.surat-meta-item { .meta-label { display: block; font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; } .meta-value { font-size: 0.8125rem; color: var(--text-secondary); font-weight: 500; } }
.surat-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border-light); }
.surat-action { font-size: 0.8125rem; color: var(--color-primary); font-weight: 500; }
</style>
