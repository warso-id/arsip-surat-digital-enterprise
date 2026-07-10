<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="search-input"
        @input="onInput"
        @keyup.enter="onSearch"
        @keyup.escape="onClear"
      />
      <button
        v-if="searchQuery"
        class="search-clear"
        @click="onClear"
        title="Bersihkan"
      >
        ✕
      </button>
    </div>
    
    <div class="search-filters" v-if="showFilters">
      <slot name="filters">
        <select v-if="filterOptions.length > 0" v-model="activeFilter" class="filter-select" @change="onFilterChange">
          <option value="">Semua</option>
          <option v-for="option in filterOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        
        <input
          v-if="showDateFilter"
          v-model="dateFrom"
          type="date"
          class="filter-date"
          @change="onDateChange"
          placeholder="Dari"
        />
        <input
          v-if="showDateFilter"
          v-model="dateTo"
          type="date"
          class="filter-date"
          @change="onDateChange"
          placeholder="Sampai"
        />
      </slot>
    </div>
    
    <button
      v-if="showAdvanced"
      class="btn-advanced"
      @click="toggleAdvanced"
      :class="{ active: advancedOpen }"
    >
      ⚙️ Advanced
    </button>
    
    <div v-if="advancedOpen" class="advanced-panel">
      <slot name="advanced">
        <p class="text-muted">Advanced search options</p>
      </slot>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'SearchBar',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: 'Cari...' },
    showFilters: { type: Boolean, default: false },
    showDateFilter: { type: Boolean, default: false },
    showAdvanced: { type: Boolean, default: false },
    filterOptions: { type: Array, default: () => [] },
    debounceTime: { type: Number, default: 300 }
  },
  emits: ['update:modelValue', 'search', 'clear', 'filter-change', 'date-change'],
  setup(props, { emit }) {
    const searchQuery = ref(props.modelValue)
    const activeFilter = ref('')
    const dateFrom = ref('')
    const dateTo = ref('')
    const advancedOpen = ref(false)
    const searchInput = ref(null)
    
    let debounceTimer = null
    
    watch(() => props.modelValue, (newVal) => {
      searchQuery.value = newVal
    })
    
    const onInput = () => {
      emit('update:modelValue', searchQuery.value)
      
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        emit('search', searchQuery.value)
      }, props.debounceTime)
    }
    
    const onSearch = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      emit('search', searchQuery.value)
    }
    
    const onClear = () => {
      searchQuery.value = ''
      activeFilter.value = ''
      dateFrom.value = ''
      dateTo.value = ''
      emit('update:modelValue', '')
      emit('clear')
      searchInput.value?.focus()
    }
    
    const onFilterChange = () => {
      emit('filter-change', activeFilter.value)
    }
    
    const onDateChange = () => {
      emit('date-change', { from: dateFrom.value, to: dateTo.value })
    }
    
    const toggleAdvanced = () => {
      advancedOpen.value = !advancedOpen.value
    }
    
    const focus = () => {
      searchInput.value?.focus()
    }
    
    return {
      searchQuery,
      activeFilter,
      dateFrom,
      dateTo,
      advancedOpen,
      searchInput,
      onInput,
      onSearch,
      onClear,
      onFilterChange,
      onDateChange,
      toggleAdvanced,
      focus
    }
  }
}
</script>

<style lang="scss" scoped>
.search-bar {
  margin-bottom: 16px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  
  .search-icon {
    position: absolute;
    left: 14px;
    font-size: 16px;
    color: var(--text-tertiary);
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: 12px 44px 12px 44px;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-lg);
    font-size: 0.9375rem;
    background: var(--bg-card);
    color: var(--text-primary);
    transition: all var(--transition-fast);
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
    }
    
    &::placeholder {
      color: var(--text-tertiary);
    }
  }
  
  .search-clear {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-tertiary);
    font-size: 16px;
    padding: 6px;
    border-radius: var(--radius-full);
    
    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
  }
}

.search-filters {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.filter-date {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  background: var(--bg-card);
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.btn-advanced {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  margin-top: 8px;
  transition: all var(--transition-fast);
  
  &:hover {
    background: var(--bg-hover);
  }
  
  &.active {
    background: var(--bg-active);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.advanced-panel {
  margin-top: 8px;
  padding: 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
