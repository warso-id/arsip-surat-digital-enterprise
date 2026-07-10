<template>
  <div class="pagination-wrapper" v-if="totalPages > 1">
    <div class="pagination-info">
      Menampilkan {{ startItem }}-{{ endItem }} dari {{ total }} data
    </div>
    
    <nav class="pagination">
      <!-- First Page -->
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="goToPage(1)"
        title="Halaman Pertama"
      >
        ⏮
      </button>
      
      <!-- Previous Page -->
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        title="Halaman Sebelumnya"
      >
        ◀
      </button>
      
      <!-- Page Numbers -->
      <template v-for="page in visiblePages" :key="page">
        <span v-if="page === '...'" class="page-ellipsis">...</span>
        <button
          v-else
          class="page-btn"
          :class="{ active: page === currentPage }"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </template>
      
      <!-- Next Page -->
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        title="Halaman Berikutnya"
      >
        ▶
      </button>
      
      <!-- Last Page -->
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="goToPage(totalPages)"
        title="Halaman Terakhir"
      >
        ⏭
      </button>
    </nav>
    
    <!-- Page Size Selector -->
    <div class="page-size-selector" v-if="showPageSize">
      <label for="pageSize">Tampilkan:</label>
      <select
        id="pageSize"
        :value="pageSize"
        @change="onPageSizeChange"
        class="page-size-select"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }} data
        </option>
      </select>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'Pagination',
  props: {
    currentPage: { type: Number, default: 1 },
    totalPages: { type: Number, default: 1 },
    total: { type: Number, default: 0 },
    pageSize: { type: Number, default: 20 },
    showPageSize: { type: Boolean, default: true },
    pageSizeOptions: { type: Array, default: () => [10, 20, 50, 100] },
    maxVisiblePages: { type: Number, default: 5 }
  },
  emits: ['page-change', 'page-size-change'],
  setup(props, { emit }) {
    const startItem = computed(() => {
      return props.total === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1
    })
    
    const endItem = computed(() => {
      return Math.min(props.currentPage * props.pageSize, props.total)
    })
    
    const visiblePages = computed(() => {
      const pages = []
      const total = props.totalPages
      const current = props.currentPage
      const max = props.maxVisiblePages
      
      if (total <= max) {
        for (let i = 1; i <= total; i++) {
          pages.push(i)
        }
      } else {
        let start = Math.max(1, current - Math.floor(max / 2))
        let end = Math.min(total, start + max - 1)
        
        if (end - start + 1 < max) {
          start = Math.max(1, end - max + 1)
        }
        
        if (start > 1) {
          pages.push(1)
          if (start > 2) pages.push('...')
        }
        
        for (let i = start; i <= end; i++) {
          pages.push(i)
        }
        
        if (end < total) {
          if (end < total - 1) pages.push('...')
          pages.push(total)
        }
      }
      
      return pages
    })
    
    const goToPage = (page) => {
      if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
        emit('page-change', page)
      }
    }
    
    const onPageSizeChange = (event) => {
      emit('page-size-change', parseInt(event.target.value))
    }
    
    return {
      startItem,
      endItem,
      visiblePages,
      goToPage,
      onPageSizeChange
    }
  }
}
</script>

<style lang="scss" scoped>
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 0;
}

.pagination-info {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--color-primary);
  }
  
  &.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.page-ellipsis {
  padding: 0 4px;
  color: var(--text-tertiary);
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  
  label {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
  
  .page-size-select {
    padding: 6px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    background: var(--bg-card);
    color: var(--text-primary);
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
}

@media (max-width: 768px) {
  .pagination-wrapper {
    flex-direction: column;
    align-items: center;
  }
  
  .page-btn {
    min-width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }
}
</style>
