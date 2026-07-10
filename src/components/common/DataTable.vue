<template>
  <div class="data-table-wrapper">
    <div class="table-responsive">
      <table class="data-table" :class="{ 'table-striped': striped, 'table-hover': hover }">
        <thead>
          <tr>
            <th v-if="selectable" class="th-checkbox">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected && !allSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              :style="{ width: column.width, minWidth: column.minWidth }"
              :class="{ 'sortable': column.sortable, 'sorted': sortKey === column.key }"
              @click="column.sortable && toggleSort(column.key)"
            >
              <div class="th-content">
                <span>{{ column.label }}</span>
                <span v-if="column.sortable" class="sort-icon">
                  {{ sortKey === column.key ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅' }}
                </span>
              </div>
            </th>
            <th v-if="$slots.actions" class="th-actions">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="totalColumns" class="td-loading">
              <div class="skeleton-row" v-for="i in 5" :key="i">
                <div class="skeleton skeleton-text" v-for="j in columns.length" :key="j"></div>
              </div>
            </td>
          </tr>
          <tr v-else-if="data.length === 0">
            <td :colspan="totalColumns" class="td-empty">
              <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p class="empty-text">{{ emptyText }}</p>
              </div>
            </td>
          </tr>
          <tr
            v-for="(row, index) in data"
            :key="row.id || index"
            :class="{ 'row-selected': selectedIds.includes(row.id) }"
            @click="selectable && toggleRow(row.id)"
          >
            <td v-if="selectable" class="td-checkbox" @click.stop>
              <input
                type="checkbox"
                :checked="selectedIds.includes(row.id)"
                @change="toggleRow(row.id)"
              />
            </td>
            <td v-for="column in columns" :key="column.key" :class="column.class">
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :index="index">
                <span v-if="column.format" v-html="column.format(row[column.key], row)"></span>
                <span v-else>{{ row[column.key] ?? '-' }}</span>
              </slot>
            </td>
            <td v-if="$slots.actions" class="td-actions" @click.stop>
              <slot name="actions" :row="row" :index="index"></slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <Pagination
      v-if="showPagination && totalPages > 1"
      :currentPage="currentPage"
      :totalPages="totalPages"
      :total="total"
      :pageSize="pageSize"
      @page-change="$emit('page-change', $event)"
      @page-size-change="$emit('page-size-change', $event)"
    />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import Pagination from './Pagination.vue'

export default {
  name: 'DataTable',
  components: { Pagination },
  props: {
    columns: { type: Array, required: true },
    data: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    striped: { type: Boolean, default: true },
    hover: { type: Boolean, default: true },
    selectable: { type: Boolean, default: false },
    selectedIds: { type: Array, default: () => [] },
    emptyText: { type: String, default: 'Tidak ada data' },
    showPagination: { type: Boolean, default: false },
    currentPage: { type: Number, default: 1 },
    totalPages: { type: Number, default: 1 },
    total: { type: Number, default: 0 },
    pageSize: { type: Number, default: 20 },
    defaultSortKey: { type: String, default: '' },
    defaultSortOrder: { type: String, default: 'asc' }
  },
  emits: ['selection-change', 'sort-change', 'page-change', 'page-size-change'],
  setup(props, { emit }) {
    const sortKey = ref(props.defaultSortKey)
    const sortOrder = ref(props.defaultSortOrder)
    
    const allSelected = computed(() => {
      return props.data.length > 0 && props.selectedIds.length === props.data.length
    })
    
    const someSelected = computed(() => {
      return props.selectedIds.length > 0 && props.selectedIds.length < props.data.length
    })
    
    const totalColumns = computed(() => {
      let count = props.columns.length
      if (props.selectable) count++
      return count
    })
    
    const toggleSelectAll = () => {
      if (allSelected.value) {
        emit('selection-change', [])
      } else {
        emit('selection-change', props.data.map(row => row.id))
      }
    }
    
    const toggleRow = (id) => {
      const newSelection = [...props.selectedIds]
      const index = newSelection.indexOf(id)
      if (index > -1) {
        newSelection.splice(index, 1)
      } else {
        newSelection.push(id)
      }
      emit('selection-change', newSelection)
    }
    
    const toggleSort = (key) => {
      if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortKey.value = key
        sortOrder.value = 'asc'
      }
      emit('sort-change', { key: sortKey.value, order: sortOrder.value })
    }
    
    return {
      sortKey,
      sortOrder,
      allSelected,
      someSelected,
      totalColumns,
      toggleSelectAll,
      toggleRow,
      toggleSort
    }
  }
}
</script>

<style lang="scss" scoped>
.data-table-wrapper {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border-light);
  }
  
  th {
    background: var(--bg-tertiary);
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    user-select: none;
  }
  
  td {
    color: var(--text-primary);
    font-size: 0.875rem;
    vertical-align: middle;
  }
  
  &.table-striped tbody tr:nth-child(even) {
    background: var(--bg-tertiary);
  }
  
  &.table-hover tbody tr:hover {
    background: var(--bg-hover);
  }
  
  .th-checkbox,
  .td-checkbox {
    width: 48px;
    text-align: center;
    
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--color-primary);
    }
  }
  
  .th-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .sortable {
    cursor: pointer;
    
    &:hover {
      background: var(--bg-hover);
    }
    
    .sort-icon {
      font-size: 10px;
      color: var(--text-tertiary);
    }
    
    &.sorted {
      color: var(--color-primary);
      
      .sort-icon {
        color: var(--color-primary);
      }
    }
  }
  
  .th-actions {
    width: 100px;
    text-align: center;
  }
  
  .td-actions {
    text-align: center;
    white-space: nowrap;
  }
  
  .td-empty {
    padding: 48px 16px;
    text-align: center;
  }
  
  .td-loading {
    padding: 16px;
  }
  
  .row-selected {
    background: var(--bg-active) !important;
  }
}

.empty-state {
  .empty-icon {
    font-size: 48px;
    display: block;
    margin-bottom: 12px;
    opacity: 0.5;
  }
  
  .empty-text {
    color: var(--text-secondary);
    font-size: 0.9375rem;
  }
}

.skeleton-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  
  .skeleton {
    flex: 1;
    height: 16px;
    background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 50%, var(--bg-secondary) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: var(--radius-sm);
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
