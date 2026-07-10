<template>
  <DefaultLayout>
    <div class="notifikasi-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">🔔 Notifikasi</h1>
          <p class="page-subtitle" v-if="unreadCount > 0">{{ unreadCount }} notifikasi belum dibaca</p>
        </div>
        <button v-if="unreadCount > 0" class="btn btn-secondary" @click="markAllRead">
          ✅ Tandai Semua Dibaca
        </button>
      </div>
      
      <div class="notifikasi-list" v-if="!loading && notifications.length > 0">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          class="notifikasi-item"
          :class="{ 'notif-unread': !notif.isRead }"
          @click="handleClick(notif)"
        >
          <div class="notif-icon">
            <span>{{ getNotifIcon(notif.tipe) }}</span>
          </div>
          <div class="notif-content">
            <div class="notif-header">
              <h4 class="notif-title">{{ notif.judul }}</h4>
              <span class="notif-time">{{ timeAgo(notif.createdAt) }}</span>
            </div>
            <p class="notif-message">{{ notif.pesan }}</p>
            <div class="notif-meta">
              <span class="badge badge-sm" :class="`badge-${getNotifBadge(notif.tipe)}`">{{ notif.tipe }}</span>
              <span v-if="!notif.isRead" class="notif-unread-dot"></span>
            </div>
          </div>
          <button
            v-if="!notif.isRead"
            class="btn btn-sm btn-icon"
            @click.stop="markRead(notif.id)"
            title="Tandai dibaca"
          >✓</button>
        </div>
      </div>
      
      <div v-else-if="loading" class="notif-loading">
        <LoadingSpinner text="Memuat notifikasi..." />
      </div>
      
      <div v-else class="notif-empty">
        <div class="empty-state">
          <span>🔔</span>
          <h3>Tidak ada notifikasi</h3>
          <p>Anda akan menerima notifikasi saat ada surat masuk baru, disposisi, atau approval.</p>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import API from '@/api'
import { timeAgo } from '@/utils/helpers'

export default {
  name: 'NotifikasiView',
  components: { DefaultLayout, LoadingSpinner },
  setup() {
    const router = useRouter()
    const appStore = useAppStore()
    
    const loading = ref(false)
    const notifications = ref([])
    
    const unreadCount = computed(() => appStore.unreadCount)
    
    const getNotifIcon = (type) => ({ info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' }[type] || 'ℹ️')
    const getNotifBadge = (type) => ({ info: 'info', success: 'success', warning: 'warning', error: 'danger' }[type] || 'info')
    
    const fetchNotifications = async () => {
      loading.value = true
      try {
        const response = await API.notifikasiList({ limit: 50 })
        if (response.status === 'success') {
          notifications.value = response.data.items
        }
      } catch (err) {} finally { loading.value = false }
    }
    
    const markRead = async (id) => {
      await appStore.markNotificationRead(id)
      const notif = notifications.value.find(n => n.id === id)
      if (notif) notif.isRead = true
    }
    
    const markAllRead = async () => {
      await appStore.markAllNotificationsRead()
      notifications.value.forEach(n => n.isRead = true)
    }
    
    const handleClick = (notif) => {
      if (!notif.isRead) markRead(notif.id)
      if (notif.linkUrl) router.push(notif.linkUrl)
    }
    
    onMounted(() => fetchNotifications())
    
    return {
      loading, notifications, unreadCount,
      timeAgo, getNotifIcon, getNotifBadge, markRead, markAllRead, handleClick
    }
  }
}
</script>

<style lang="scss" scoped>
.notifikasi-page { max-width: 700px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
  .page-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px; }
  .page-subtitle { color: var(--text-secondary); font-size: 0.875rem; margin: 0; }
}
.notifikasi-list { display: flex; flex-direction: column; gap: 8px; }
.notifikasi-item { display: flex; gap: 16px; padding: 16px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); cursor: pointer; transition: all var(--transition-fast);
  &:hover { box-shadow: var(--shadow-md); }
  &.notif-unread { border-left: 3px solid var(--color-primary); background: var(--bg-active); }
}
.notif-icon { font-size: 24px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); border-radius: var(--radius-md); flex-shrink: 0; }
.notif-content { flex: 1; min-width: 0; }
.notif-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.notif-title { font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); margin: 0; }
.notif-time { font-size: 0.7rem; color: var(--text-tertiary); white-space: nowrap; }
.notif-message { font-size: 0.8125rem; color: var(--text-secondary); margin: 4px 0; }
.notif-meta { display: flex; gap: 8px; align-items: center; margin-top: 4px; }
.notif-unread-dot { width: 8px; height: 8px; background: var(--color-primary); border-radius: 50%; }
.notif-loading, .notif-empty { display: flex; justify-content: center; padding: 48px 0; }
.btn-icon { width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: transparent; border: 1px solid var(--border-color); cursor: pointer; flex-shrink: 0; align-self: center;
  &:hover { background: var(--bg-hover); }
}
</style>
