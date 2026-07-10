<template>
  <DefaultLayout>
    <div class="search-page">
      <div class="page-header">
        <h1 class="page-title">🔍 Pencarian Global</h1>
      </div>
      
      <div class="search-main">
        <SearchBar
          v-model="query"
          placeholder="Cari surat, nomor agenda, pengirim, perihal..."
          :showFilters="true"
          :filterOptions="filterOptions"
          @search="handleSearch"
          @clear="handleClear"
          @filter-change="handleFilterChange"
        />
      </div>
      
      <div v-if="searchPerformed" class="search-results">
        <div class="results-header">
          <p class="results-count">Ditemukan <strong>{{ totalResults }}</strong> hasil untuk "<strong>{{ searchedQuery }}</strong>"</p>
          <div class="results-tabs">
            <button :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">Semua ({{ totalResults }})</button>
            <button :class="{ active: activeTab === 'surat-masuk' }" @click="activeTab = 'surat-masuk'">Surat Masuk ({{ masukCount }})</button>
            <button :class="{ active: activeTab === 'surat-keluar' }" @click="activeTab = 'surat-keluar'">Surat Keluar ({{ keluarCount }})</button>
          </div>
        </div>
        
        <div v-if="loading" class="results-loading">
          <LoadingSpinner text="Mencari..." />
        </div>
        
        <div v-else-if="filteredResults.length > 0" class="results-list">
          <div
            v-for="result in filteredResults"
            :key="result.id"
            class="result-item"
            @click="goToDetail(result)"
          >
            <div class="result-icon">
              <span>{{ result.type === 'surat-masuk' ? '📥' : '📤' }}</span>
            </div>
            <div class="result-content">
              <div class="result-type-badge">
                <span class="badge" :class="result.type === 'surat-masuk' ? 'badge-info' : 'badge-success'">
                  {{ result.type === 'surat-masuk' ? 'Surat Masuk' : 'Surat Keluar' }}
                </span>
              </div>
              <h4 class="result-title" v-html="highlightMatch(result.title)"></h4>
              <p class="result-desc" v-html="highlightMatch(result.description)"></p>
              <div class="result-meta">
                <span>{{ formatDate(result.date) }}</span>
                <span>•</span>
                <span class="badge badge-sm" :class="`badge-${getStatusBadge(result.status)}`">{{ result.status }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="results-empty">
          <div class="empty-state">
            <span>🔍</span>
            <h3>Tidak ada hasil</h3>
            <p>Coba gunakan kata kunci yang berbeda</p>
          </div>
        </div>
        
        <Pagination
          v-if="totalPages > 1"
          :currentPage="page"
          :totalPages="totalPages"
          :total="totalResults"
          :pageSize="limit"
          @page-change="handlePageChange"
        />
      </div>
      
      <div v-else class="search-initial">
        <div class="empty-state">
          <span>🔍</span>
          <h3>Pencarian Global</h3>
          <p>Gunakan fitur pencarian untuk menemukan surat masuk dan surat keluar dengan cepat.</p>
          <div class="search-tips">
            <h4>Tips Pencarian:</h4>
            <ul>
              <li>Gunakan nomor surat untuk pencarian spesifik</li>
              <li>Cari berdasarkan nama pengirim atau tujuan</li>
              <li>Gunakan kata kunci dari perihal surat</li>
              <li>Filter berdasarkan tipe surat</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import SearchBar from '@/components/common/SearchBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import Pagination from '@/components/common/Pagination.vue'
import API from '@/api'
import { formatDate } from '@/utils/formatters'

export default {
  name: 'SearchView',
  components: { DefaultLayout, SearchBar, LoadingSpinner, Pagination },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    const query = ref(route.query.q || '')
    const activeTab = ref('all')
    const activeFilter = ref('')
    const loading = ref(false)
    const searchPerformed = ref(false)
    const searchedQuery = ref('')
    const results = ref([])
    const totalResults = ref(0)
    const page = ref(1)
    const limit = ref(20)
    const totalPages = ref(0)
    
    const filterOptions = [
      { value: 'surat-masuk', label: 'Surat Masuk' },
      { value: 'surat-keluar', label: 'Surat Keluar' }
    ]
    
    const masukCount = computed(() => results.value.filter(r => r.type === 'surat-masuk').length)
    const keluarCount = computed(() => results.value.filter(r => r.type === 'surat-keluar').length)
    
    const filteredResults = computed(() => {
      if (activeTab.value === 'all') return results.value
      return results.value.filter(r => r.type === activeTab.value)
    })
    
    const getStatusBadge = (s) => {
      const map = { diterima: 'info', diproses: 'warning', selesai: 'success', diarsipkan: 'secondary', draft: 'secondary', dikirim: 'info' }
      return map[s] || 'info'
    }
    
    const highlightMatch = (text) => {
      if (!text || !searchedQuery.value) return text || '-'
      const regex = new RegExp(`(${searchedQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      return text.replace(regex, '<mark>$1</mark>')
    }
    
    const performSearch = async () => {
      if (!query.value.trim()) return
      
      loading.value = true
      searchPerformed.value = true
      searchedQuery.value = query.value.trim()
      
      try {
        const response = await API.search({
          q: query.value.trim(),
          type: activeFilter.value || undefined,
          page: page.value,
          limit: limit.value
        })
        
        if (response.status === 'success') {
          results.value = response.data.results || []
          totalResults.value = response.data.totalResults || 0
          totalPages.value = response.data.pagination?.totalPages || 1
        }
      } catch (err) {
        results.value = []
      } finally {
        loading.value = false
      }
    }
    
    const handleSearch = () => {
      page.value = 1
      performSearch()
    }
    
    const handleClear = () => {
      query.value = ''
      results.value = []
      searchPerformed.value = false
    }
    
    const handleFilterChange = (filter) => {
      activeFilter.value = filter
      page.value = 1
      if (searchPerformed.value) performSearch()
    }
    
    const handlePageChange = (p) => {
      page.value = p
      performSearch()
    }
    
    const goToDetail = (result) => {
      if (result.type === 'surat-masuk') {
        router.push({ name: 'SuratMasukDetail', params: { id: result.id } })
      } else {
        router.push({ name: 'SuratKeluarDetail', params: { id: result.id } })
      }
    }
    
    if (query.value) performSearch()
    
    return {
      query, activeTab, activeFilter, loading, searchPerformed, searchedQuery,
      results, totalResults, page, limit, totalPages, filterOptions,
      masukCount, keluarCount, filteredResults,
      formatDate, getStatusBadge, highlightMatch,
      handleSearch, handleClear, handleFilterChange, handlePageChange, goToDetail
    }
  }
}
</script>

<style lang="scss" scoped>
.search-page { max-width: 900px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
.search-main { margin-bottom: 24px; }
.search-results { margin-top: 24px; }
.results-header { margin-bottom: 16px; }
.results-count { color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 12px; }
.results-tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--border-color);
  button { padding: 8px 16px; border: none; background: none; cursor: pointer; font-size: 0.8125rem; color: var(--text-secondary); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all var(--transition-fast);
    &:hover { color: var(--text-primary); }
    &.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
  }
}
.results-list { display: flex; flex-direction: column; gap: 12px; }
.result-item { display: flex; gap: 16px; padding: 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); cursor: pointer; transition: all var(--transition-fast);
  &:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
}
.result-icon { font-size: 28px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); border-radius: var(--radius-md); flex-shrink: 0; }
.result-content { flex: 1; min-width: 0; }
.result-type-badge { margin-bottom: 8px; }
.result-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0 0 4px; }
.result-desc { font-size: 0.8125rem; color: var(--text-secondary); margin: 0 0 8px; }
.result-meta { display: flex; gap: 8px; align-items: center; font-size: 0.75rem; color: var(--text-tertiary); }
.results-loading { display: flex; justify-content: center; padding: 48px; }
.results-empty { padding: 48px 0; }
.search-initial { padding: 48px 0; }
.search-tips { margin-top: 24px; text-align: left; background: var(--bg-card); padding: 20px; border-radius: var(--radius-lg); border: 1px solid var(--border-color);
  h4 { margin: 0 0 12px; font-size: 0.9375rem; }
  ul { margin: 0; padding-left: 20px; }
  li { margin-bottom: 6px; font-size: 0.8125rem; color: var(--text-secondary); }
}
</style>
