<template>
  <DefaultLayout>
    <div class="dashboard-page">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <div class="welcome-info">
          <h1 class="welcome-title">
            Selamat Datang, {{ userName }}!
          </h1>
          <p class="welcome-date">{{ currentDate }}</p>
        </div>
        <div class="welcome-actions">
          <router-link to="/surat-masuk/create" class="btn btn-primary">
            <span>📥</span> Tambah Surat Masuk
          </router-link>
          <router-link to="/surat-keluar/create" class="btn btn-outline">
            <span>📤</span> Buat Surat Keluar
          </router-link>
        </div>
      </div>
      
      <!-- Stats Cards -->
      <div class="stats-grid" v-if="!loading">
        <StatCard
          title="Surat Masuk Hari Ini"
          :value="stats.suratMasuk?.hariIni || 0"
          icon="📥"
          color="primary"
          :trend="5"
        />
        <StatCard
          title="Surat Masuk Bulan Ini"
          :value="stats.suratMasuk?.bulanIni || 0"
          icon="📊"
          color="info"
        />
        <StatCard
          title="Pending Disposisi"
          :value="stats.disposisi?.pending || 0"
          icon="📋"
          color="warning"
        />
        <StatCard
          title="Surat Keluar"
          :value="stats.suratKeluar?.total || 0"
          icon="📤"
          color="success"
        />
      </div>
      
      <div v-else class="stats-grid">
        <div v-for="i in 4" :key="i" class="skeleton skeleton-card"></div>
      </div>
      
      <!-- Charts & Recent Activity -->
      <div class="dashboard-grid">
        <!-- Chart -->
        <div class="card chart-card">
          <div class="card-header">
            <h3 class="card-title">📈 Grafik Surat {{ currentYear }}</h3>
            <select v-model="chartYear" class="chart-year-select" @change="fetchChartData">
              <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
          <div class="card-body">
            <BarChart v-if="chartData" :data="chartData" :height="300" />
            <div v-else class="chart-loading">
              <LoadingSpinner size="md" />
            </div>
          </div>
        </div>
        
        <!-- Recent Surat Masuk -->
        <div class="card recent-card">
          <div class="card-header">
            <h3 class="card-title">📥 Surat Masuk Terbaru</h3>
            <router-link to="/surat-masuk" class="btn-link">Lihat Semua →</router-link>
          </div>
          <div class="card-body">
            <div v-if="recentSuratMasuk.length > 0" class="recent-list">
              <div
                v-for="surat in recentSuratMasuk"
                :key="surat.id"
                class="recent-item"
                @click="goToDetail('surat-masuk', surat.id)"
              >
                <div class="recent-icon">
                  <span :class="getSifatClass(surat.sifat)">{{ getSifatIcon(surat.sifat) }}</span>
                </div>
                <div class="recent-content">
                  <div class="recent-title">{{ surat.perihal || 'Tanpa Perihal' }}</div>
                  <div class="recent-meta">
                    <span>{{ surat.pengirim }}</span>
                    <span>•</span>
                    <span>{{ formatDate(surat.tanggalSurat) }}</span>
                  </div>
                </div>
                <div class="recent-status">
                  <span class="badge" :class="`badge-${getStatusClass(surat.status)}`">
                    {{ surat.status }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <span>📭</span>
              <p>Belum ada surat masuk</p>
            </div>
          </div>
        </div>
        
        <!-- Recent Surat Keluar -->
        <div class="card recent-card">
          <div class="card-header">
            <h3 class="card-title">📤 Surat Keluar Terbaru</h3>
            <router-link to="/surat-keluar" class="btn-link">Lihat Semua →</router-link>
          </div>
          <div class="card-body">
            <div v-if="recentSuratKeluar.length > 0" class="recent-list">
              <div
                v-for="surat in recentSuratKeluar"
                :key="surat.id"
                class="recent-item"
                @click="goToDetail('surat-keluar', surat.id)"
              >
                <div class="recent-icon">
                  <span>📤</span>
                </div>
                <div class="recent-content">
                  <div class="recent-title">{{ surat.perihal || 'Tanpa Perihal' }}</div>
                  <div class="recent-meta">
                    <span>{{ surat.tujuan }}</span>
                    <span>•</span>
                    <span>{{ formatDate(surat.tanggalSurat) }}</span>
                  </div>
                </div>
                <div class="recent-status">
                  <span class="badge" :class="`badge-${getApprovalClass(surat.approvalStatus)}`">
                    {{ surat.approvalStatus || 'draft' }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <span>📭</span>
              <p>Belum ada surat keluar</p>
            </div>
          </div>
        </div>
        
        <!-- AI Insights -->
        <div class="card ai-card">
          <div class="card-header">
            <h3 class="card-title">🤖 AI Insights</h3>
            <span class="badge badge-info">BETA</span>
          </div>
          <div class="card-body">
            <div v-if="aiInsights.length > 0" class="insights-list">
              <div v-for="(insight, index) in aiInsights" :key="index" class="insight-item">
                <span class="insight-icon">{{ insight.icon }}</span>
                <div class="insight-content">
                  <div class="insight-title">{{ insight.title }}</div>
                  <div class="insight-desc">{{ insight.description }}</div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <span>🤖</span>
              <p>AI Insights akan tersedia setelah data cukup</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import StatCard from '@/components/charts/StatCard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import API from '@/api'
import { formatDate, formatDateTime } from '@/utils/formatters'

export default {
  name: 'DashboardView',
  components: {
    DefaultLayout,
    StatCard,
    BarChart,
    LoadingSpinner
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const toast = inject('toast')
    
    const loading = ref(true)
    const stats = ref({})
    const chartData = ref(null)
    const chartYear = ref(new Date().getFullYear())
    const recentSuratMasuk = ref([])
    const recentSuratKeluar = ref([])
    const aiInsights = ref([])
    
    const currentYear = ref(new Date().getFullYear())
    const yearOptions = computed(() => {
      const years = []
      const now = new Date().getFullYear()
      for (let i = now; i >= now - 5; i--) {
        years.push(i)
      }
      return years
    })
    
    const userName = computed(() => {
      return authStore.user?.namaLengkap || authStore.user?.username || 'User'
    })
    
    const currentDate = computed(() => {
      const now = new Date()
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      return now.toLocaleDateString('id-ID', options)
    })
    
    const fetchDashboardData = async () => {
      loading.value = true
      
      try {
        const [statsRes, chartRes, smRes, skRes, aiRes] = await Promise.all([
          API.dashboardStats(),
          API.dashboardChart({ year: chartYear.value }),
          API.suratMasukList({ limit: 5 }),
          API.suratKeluarList({ limit: 5 }),
          API.dashboardAIInsights().catch(() => ({ status: 'success', data: { recommendations: [] } }))
        ])
        
        if (statsRes.status === 'success') {
          stats.value = statsRes.data
        }
        
        if (chartRes.status === 'success') {
          chartData.value = chartRes.data
        }
        
        if (smRes.status === 'success') {
          recentSuratMasuk.value = smRes.data.items
        }
        
        if (skRes.status === 'success') {
          recentSuratKeluar.value = skRes.data.items
        }
        
        if (aiRes.status === 'success') {
          aiInsights.value = aiRes.data.recommendations || []
        }
      } catch (err) {
        toast?.error('Gagal memuat data dashboard')
        console.error('Dashboard error:', err)
      } finally {
        loading.value = false
      }
    }
    
    const fetchChartData = async () => {
      try {
        const response = await API.dashboardChart({ year: chartYear.value })
        if (response.status === 'success') {
          chartData.value = response.data
        }
      } catch (err) {
        console.error('Chart error:', err)
      }
    }
    
    const goToDetail = (type, id) => {
      if (type === 'surat-masuk') {
        router.push({ name: 'SuratMasukDetail', params: { id } })
      } else {
        router.push({ name: 'SuratKeluarDetail', params: { id } })
      }
    }
    
    const getSifatIcon = (sifat) => {
      const icons = {
        biasa: '📄',
        penting: '⭐',
        rahasia: '🔒',
        segera: '⚡'
      }
      return icons[sifat] || '📄'
    }
    
    const getSifatClass = (sifat) => {
      return `sifat-${sifat || 'biasa'}`
    }
    
    const getStatusClass = (status) => {
      const classes = {
        diterima: 'info',
        diproses: 'warning',
        selesai: 'success',
        diarsipkan: 'secondary'
      }
      return classes[status] || 'info'
    }
    
    const getApprovalClass = (status) => {
      const classes = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
        draft: 'secondary'
      }
      return classes[status] || 'secondary'
    }
    
    onMounted(() => {
      fetchDashboardData()
    })
    
    return {
      loading,
      stats,
      chartData,
      chartYear,
      recentSuratMasuk,
      recentSuratKeluar,
      aiInsights,
      currentYear,
      yearOptions,
      userName,
      currentDate,
      fetchChartData,
      goToDetail,
      getSifatIcon,
      getSifatClass,
      getStatusClass,
      getApprovalClass,
      formatDate,
      formatDateTime
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-page {
  animation: fadeIn 0.5s ease-out;
}

.welcome-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  
  .welcome-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 4px;
  }
  
  .welcome-date {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0;
  }
  
  .welcome-actions {
    display: flex;
    gap: 12px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  
  .chart-card {
    grid-row: span 1;
  }
}

.chart-year-select {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  background: var(--bg-card);
  color: var(--text-primary);
}

.recent-list {
  .recent-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition-fast);
    
    &:hover {
      background: var(--bg-hover);
    }
    
    &:not(:last-child) {
      border-bottom: 1px solid var(--border-light);
    }
  }
}

.recent-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.recent-content {
  flex: 1;
  min-width: 0;
  
  .recent-title {
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .recent-meta {
    font-size: 0.75rem;
    color: var(--text-secondary);
    display: flex;
    gap: 6px;
  }
}

.recent-status {
  flex-shrink: 0;
}

.ai-card {
  grid-column: 1 / -1;
}

.insights-list {
  .insight-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: var(--radius-md);
    
    &:not(:last-child) {
      border-bottom: 1px solid var(--border-light);
    }
    
    .insight-icon {
      font-size: 24px;
    }
    
    .insight-title {
      font-weight: 500;
      font-size: 0.875rem;
      color: var(--text-primary);
    }
    
    .insight-desc {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
  }
}

.skeleton-card {
  height: 120px;
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-hover) 50%, var(--bg-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-lg);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    align-items: flex-start;
    
    .welcome-actions {
      width: 100%;
      
      .btn {
        flex: 1;
        justify-content: center;
      }
    }
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
