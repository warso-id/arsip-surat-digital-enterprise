<template>
  <div class="stat-card" :class="[`stat-${color}`, { 'stat-clickable': clickable }]" @click="clickable && $emit('click')">
    <div class="stat-icon-wrapper">
      <span class="stat-icon">{{ icon }}</span>
    </div>
    <div class="stat-content">
      <div class="stat-value">
        <span v-if="loading" class="skeleton skeleton-text"></span>
        <span v-else>{{ formatNumber(value) }}</span>
      </div>
      <div class="stat-label">{{ title }}</div>
      <div v-if="trend !== undefined && !loading" class="stat-trend" :class="trendClass">
        <span class="trend-icon">{{ trendIcon }}</span>
        <span class="trend-value">{{ Math.abs(trend) }}%</span>
        <span class="trend-text">dari kemarin</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    title: { type: String, required: true },
    value: { type: [Number, String], default: 0 },
    icon: { type: String, default: '📊' },
    color: { type: String, default: 'primary' },
    trend: { type: Number, default: undefined },
    loading: { type: Boolean, default: false },
    clickable: { type: Boolean, default: false }
  },
  emits: ['click'],
  computed: {
    trendClass() {
      if (this.trend === undefined) return ''
      return this.trend >= 0 ? 'trend-up' : 'trend-down'
    },
    trendIcon() {
      if (this.trend === undefined) return ''
      return this.trend >= 0 ? '▲' : '▼'
    }
  },
  methods: {
    formatNumber(num) {
      if (typeof num === 'string') return num
      return num?.toLocaleString('id-ID') || '0'
    }
  }
}
</script>

<style lang="scss" scoped>
.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  gap: 16px;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  
  &.stat-clickable {
    cursor: pointer;
  }
  
  &.stat-primary .stat-icon-wrapper {
    background: #E3F2FD;
    color: #1976D2;
  }
  
  &.stat-success .stat-icon-wrapper {
    background: #E8F5E9;
    color: #4CAF50;
  }
  
  &.stat-warning .stat-icon-wrapper {
    background: #FFF3E0;
    color: #FF9800;
  }
  
  &.stat-danger .stat-icon-wrapper {
    background: #FFEBEE;
    color: #F44336;
  }
  
  &.stat-info .stat-icon-wrapper {
    background: #E0F7FA;
    color: #00BCD4;
  }
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 0.75rem;
  
  .trend-icon {
    font-size: 10px;
  }
  
  .trend-value {
    font-weight: 600;
  }
  
  .trend-text {
    color: var(--text-tertiary);
  }
  
  &.trend-up {
    color: var(--color-success);
  }
  
  &.trend-down {
    color: var(--color-danger);
  }
}

.skeleton-text {
  height: 28px;
  width: 60px;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
  display: inline-block;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
