<template>
  <div class="surat-timeline">
    <div v-if="items.length === 0" class="timeline-empty">
      <span>📋</span>
      <p>Belum ada aktivitas</p>
    </div>
    <div v-else class="timeline-list">
      <div v-for="(item, index) in items" :key="item.id || index" class="timeline-item">
        <div class="timeline-line" v-if="index < items.length - 1"></div>
        <div class="timeline-marker" :class="`marker-${item.type || 'info'}`">
          <span>{{ item.icon || '📌' }}</span>
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-title">{{ item.title }}</span>
            <span class="timeline-date">{{ formatDate(item.date) }}</span>
          </div>
          <p class="timeline-desc" v-if="item.description">{{ item.description }}</p>
          <div class="timeline-meta" v-if="item.user">
            <span>👤 {{ item.user }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatDate } from '@/utils/formatters'

export default {
  name: 'SuratTimeline',
  props: {
    items: { type: Array, default: () => [] }
  },
  setup() {
    return { formatDate }
  }
}
</script>

<style lang="scss" scoped>
.surat-timeline { position: relative; }
.timeline-empty { text-align: center; padding: 24px; span { font-size: 32px; } p { color: var(--text-secondary); font-size: 0.875rem; margin-top: 8px; } }
.timeline-list { position: relative; padding-left: 40px; }
.timeline-item { position: relative; padding-bottom: 24px; &:last-child { padding-bottom: 0; } }
.timeline-line { position: absolute; left: 15px; top: 40px; bottom: 0; width: 2px; background: var(--border-color); }
.timeline-marker { position: absolute; left: -32px; top: 4px; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; background: var(--bg-card); border: 2px solid var(--border-color); z-index: 1;
  &.marker-success { border-color: var(--color-success); background: #E8F5E9; }
  &.marker-warning { border-color: var(--color-warning); background: #FFF3E0; }
  &.marker-danger { border-color: var(--color-danger); background: #FFEBEE; }
  &.marker-info { border-color: var(--color-info); background: #E3F2FD; }
}
.timeline-content { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 16px; }
.timeline-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px; }
.timeline-title { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }
.timeline-date { font-size: 0.7rem; color: var(--text-tertiary); white-space: nowrap; }
.timeline-desc { font-size: 0.8125rem; color: var(--text-secondary); margin: 4px 0; }
.timeline-meta { font-size: 0.75rem; color: var(--text-tertiary); }
</style>
