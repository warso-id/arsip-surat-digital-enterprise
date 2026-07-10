<template>
  <div class="users-manage">
    <div class="section-header">
      <h2>👥 Manajemen User</h2>
      <button class="btn btn-primary" @click="openCreateModal">
        ➕ Tambah User
      </button>
    </div>
    
    <!-- Search -->
    <SearchBar v-model="searchQuery" placeholder="Cari user..." @search="handleSearch" class="mb-4" />
    
    <!-- Users Table -->
    <div class="card">
      <div class="card-body" style="padding: 0;">
        <table class="data-table" v-if="!loading && users.length > 0">
          <thead>
            <tr>
              <th>User</th>
              <th>Username</th>
              <th>Email</th>
              <th>Jabatan</th>
              <th>Role</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <div class="user-info">
                  <div class="user-avatar" :style="{ background: getAvatarColor(user.namaLengkap) }">
                    {{ getInitials(user.namaLengkap) }}
                  </div>
                  <div>
                    <div class="font-medium">{{ user.namaLengkap }}</div>
                    <div class="text-xs text-muted">{{ user.nip || '-' }}</div>
                  </div>
                </div>
              </td>
              <td>{{ user.username }}</td>
              <td>{{ user.email || '-' }}</td>
              <td>{{ user.jabatan || '-' }}</td>
              <td><span class="badge" :class="`badge-${getRoleBadge(user.role)}`">{{ roleLabel(user.role) }}</span></td>
              <td>
                <span class="badge" :class="user.isActive ? 'badge-success' : 'badge-danger'">
                  {{ user.isActive ? '✅ Aktif' : '❌ Nonaktif' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-sm btn-icon" title="Edit" @click="openEditModal(user)">✏️</button>
                  <button class="btn btn-sm btn-icon" title="Reset Password" @click="confirmResetPassword(user)">🔑</button>
                  <button
                    class="btn btn-sm btn-icon"
                    :class="user.isActive ? 'btn-danger-icon' : 'btn-success-icon'"
                    :title="user.isActive ? 'Nonaktifkan' : 'Aktifkan'"
                    @click="toggleUserStatus(user)"
                  >
                    {{ user.isActive ? '🚫' : '✅' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="loading" class="p-4 text-center">
          <LoadingSpinner text="Memuat data user..." />
        </div>
        <div v-else class="empty-state p-4">
          <span>👥</span>
          <p>Belum ada user</p>
        </div>
      </div>
    </div>
    
    <!-- Create/Edit Modal -->
    <ModalDialog
      v-model="showFormModal"
      :title="isEditing ? 'Edit User' : 'Tambah User'"
      size="lg"
      :confirmText="isEditing ? 'Simpan' : 'Tambah'"
      @confirm="handleSave"
    >
      <div class="form-row">
        <div class="form-group">
          <label>Username <span class="text-danger">*</span></label>
          <input v-model="form.username" type="text" class="form-control" required :disabled="isEditing" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" class="form-control" />
        </div>
      </div>
      <div class="form-group">
        <label>Nama Lengkap <span class="text-danger">*</span></label>
        <input v-model="form.namaLengkap" type="text" class="form-control" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>NIP</label>
          <input v-model="form.nip" type="text" class="form-control" />
        </div>
        <div class="form-group">
          <label>Jabatan</label>
          <input v-model="form.jabatan" type="text" class="form-control" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Unit Kerja</label>
          <input v-model="form.unitKerja" type="text" class="form-control" />
        </div>
        <div class="form-group">
          <label>Role</label>
          <select v-model="form.role" class="form-control">
            <option value="admin">Administrator</option>
            <option value="kepala">Kepala</option>
            <option value="sekretaris">Sekretaris</option>
            <option value="staff">Staff</option>
            <option value="user">Pengguna</option>
          </select>
        </div>
      </div>
      <div class="form-group" v-if="!isEditing">
        <label>Password <span class="text-danger">*</span></label>
        <input v-model="form.password" type="password" class="form-control" required placeholder="Minimal 8 karakter" />
      </div>
      <div class="form-group" v-if="isEditing">
        <label>Password Baru (kosongkan jika tidak diubah)</label>
        <input v-model="form.password" type="password" class="form-control" placeholder="Minimal 8 karakter" />
      </div>
    </ModalDialog>
    
    <!-- Reset Password Modal -->
    <ModalDialog
      v-model="showResetModal"
      title="Reset Password"
      confirmText="Reset"
      @confirm="handleResetPassword"
    >
      <p>Reset password untuk user <strong>{{ selectedUser?.namaLengkap }}</strong>?</p>
      <div class="form-group mt-3">
        <label>Password Baru</label>
        <input v-model="resetPassword" type="text" class="form-control" placeholder="Masukkan password baru" />
      </div>
    </ModalDialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import SearchBar from '@/components/common/SearchBar.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ModalDialog from '@/components/common/ModalDialog.vue'
import { roleLabel } from '@/utils/formatters'
import { getInitials, getAvatarColor } from '@/utils/helpers'

export default {
  name: 'UsersManage',
  components: { SearchBar, LoadingSpinner, ModalDialog },
  setup() {
    const adminStore = useAdminStore()
    
    const searchQuery = ref('')
    const loading = ref(false)
    const users = ref([])
    const showFormModal = ref(false)
    const isEditing = ref(false)
    const selectedUser = ref(null)
    const showResetModal = ref(false)
    const resetPassword = ref('')
    
    const form = reactive({
      username: '', email: '', namaLengkap: '', nip: '',
      jabatan: '', unitKerja: '', role: 'staff', password: ''
    })
    
    const getRoleBadge = (r) => ({ admin: 'primary', kepala: 'success', sekretaris: 'info', staff: 'warning' }[r] || 'secondary')
    
    const fetchUsers = async () => {
      loading.value = true
      const result = await adminStore.fetchUsers({ search: searchQuery.value })
      if (result.success) users.value = adminStore.users
      loading.value = false
    }
    
    const handleSearch = () => fetchUsers()
    
    const openCreateModal = () => {
      isEditing.value = false
      Object.keys(form).forEach(k => form[k] = '')
      form.role = 'staff'
      showFormModal.value = true
    }
    
    const openEditModal = (user) => {
      isEditing.value = true
      selectedUser.value = user
      form.username = user.username
      form.email = user.email || ''
      form.namaLengkap = user.namaLengkap
      form.nip = user.nip || ''
      form.jabatan = user.jabatan || ''
      form.unitKerja = user.unitKerja || ''
      form.role = user.role || 'staff'
      form.password = ''
      showFormModal.value = true
    }
    
    const handleSave = async () => {
      if (isEditing.value && selectedUser.value) {
        const data = { ...form }
        if (!data.password) delete data.password
        await adminStore.updateUser(selectedUser.value.id, data)
      } else {
        await adminStore.createUser(form)
      }
      showFormModal.value = false
      fetchUsers()
    }
    
    const confirmResetPassword = (user) => {
      selectedUser.value = user
      resetPassword.value = ''
      showResetModal.value = true
    }
    
    const handleResetPassword = async () => {
      if (selectedUser.value && resetPassword.value) {
        await adminStore.updateUser(selectedUser.value.id, { password: resetPassword.value })
        showResetModal.value = false
      }
    }
    
    const toggleUserStatus = async (user) => {
      await adminStore.updateUser(user.id, { isActive: !user.isActive })
      fetchUsers()
    }
    
    onMounted(() => fetchUsers())
    
    return {
      searchQuery, loading, users, showFormModal, isEditing, selectedUser, showResetModal, resetPassword, form,
      roleLabel, getInitials, getAvatarColor, getRoleBadge,
      handleSearch, fetchUsers, openCreateModal, openEditModal, handleSave,
      confirmResetPassword, handleResetPassword, toggleUserStatus
    }
  }
}
</script>

<style lang="scss" scoped>
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
  h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
}
.user-info { display: flex; align-items: center; gap: 12px; }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; font-weight: 600; flex-shrink: 0; }
.data-table { width: 100%; border-collapse: collapse;
  th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border-light); }
  th { background: var(--bg-tertiary); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); }
  td { font-size: 0.875rem; }
  tbody tr:hover { background: var(--bg-hover); }
}
.action-buttons { display: flex; gap: 4px; }
.btn-icon { width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); background: transparent; border: 1px solid var(--border-color); cursor: pointer; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { margin-bottom: 16px;
  label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.875rem; }
  .form-control { width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem;
    &:focus { outline: none; border-color: var(--color-primary); }
  }
}
.font-medium { font-weight: 500; }
.text-xs { font-size: 0.75rem; }
.text-muted { color: var(--text-tertiary); }
.text-danger { color: var(--color-danger); }
.mb-4 { margin-bottom: 16px; }
.mt-3 { margin-top: 12px; }
.p-4 { padding: 16px; }
</style>
