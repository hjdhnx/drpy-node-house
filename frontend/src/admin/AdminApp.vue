<template>
  <div class="min-h-screen w-screen max-w-[100vw] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-900 overflow-x-hidden">
    <div class="flex min-h-screen w-full">
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-20 lg:hidden"
        @click="isSidebarOpen = false"
      ></div>

      <AdminSidebar
        :is-sidebar-open="isSidebarOpen"
        :current-view="currentView"
        :version="version"
        :user="user"
        :t="t"
        @navigate="handleNavigate"
      />

      <div role="main" class="flex-1 min-w-0 w-full overflow-hidden lg:ml-0 block">
        <div class="h-screen w-full overflow-hidden">
          <div class="h-full w-full min-w-0 flex flex-col px-4 py-4 lg:px-8 lg:py-6">
            <AdminHeader
              :current-view="currentView"
              :t="t"
              @open-sidebar="isSidebarOpen = true"
              @download-package="downloadPackage"
            />

            <div class="flex-1 min-h-0 min-w-0 overflow-hidden">
              <AdminUsersView
                v-if="currentView === 'users'"
                :users="users"
                :total-users="totalUsers"
                :current-user-page="currentUserPage"
                :users-per-page="usersPerPage"
                :total-user-pages="totalUserPages"
                :user-search-query="userSearchQuery"
                :user-status-filter="userStatusFilter"
                :user="user"
                :t="t"
                :format-date="formatDate"
                :change-user-page="changeUserPage"
                :set-users-per-page="setUsersPerPage"
                :set-user-search-query="setUserSearchQuery"
                :set-user-status-filter="setUserStatusFilter"
                :handle-user-search="handleUserSearch"
                :handle-user-status-filter="handleUserStatusFilter"
                :clear-user-search="clearUserSearch"
                :update-user-status="updateUserStatus"
                :reset-user-password="resetUserPassword"
                :update-user-role="updateUserRole"
                :delete-user="deleteUser"
                :view-user-details="viewUserDetails"
              />

              <AdminSettingsView
                v-else-if="currentView === 'settings'"
                :settings="settings"
                :loading="loading"
                :t="t"
                :format-size="formatSize"
                :reset-settings="resetSettings"
                :save-settings="saveSettings"
              />

              <AdminInvitesView
                v-else-if="currentView === 'invites'"
                :invites="invites"
                :t="t"
                :format-date="formatDate"
                :copy-to-clipboard="copyToClipboard"
                :delete-invite="deleteInvite"
                :open-invite-modal="openInviteModal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <AdminUserDetailsModal
      v-if="selectedUser"
      :show="showUserDetailsModal"
      :selected-user="selectedUser"
      :protocol-options="protocolOptions"
      :t="t"
      :save-user-details="saveUserDetails"
      :close="closeUserDetailsModal"
    />

    <AdminInviteModal
      :show="showCreateInviteModal"
      :invite-form="inviteForm"
      :loading="loading"
      :t="t"
      :create-invite="createInvite"
      :close="closeInviteModal"
    />

    <AdminNotificationToast :message="notification" />
  </div>
</template>

<script setup>
import AdminHeader from './components/AdminHeader.vue';
import AdminInviteModal from './components/AdminInviteModal.vue';
import AdminNotificationToast from './components/AdminNotificationToast.vue';
import AdminSidebar from './components/AdminSidebar.vue';
import AdminUserDetailsModal from './components/AdminUserDetailsModal.vue';
import AdminInvitesView from './views/AdminInvitesView.vue';
import AdminSettingsView from './views/AdminSettingsView.vue';
import AdminUsersView from './views/AdminUsersView.vue';
import { useAdminApp } from './app.js';

const {
  isSidebarOpen,
  currentView,
  version,
  user,
  users,
  totalUsers,
  currentUserPage,
  usersPerPage,
  totalUserPages,
  userSearchQuery,
  userStatusFilter,
  settings,
  invites,
  loading,
  notification,
  showUserDetailsModal,
  selectedUser,
  showCreateInviteModal,
  inviteForm,
  protocolOptions,
  t,
  handleNavigate,
  formatDate,
  formatSize,
  changeUserPage,
  setUsersPerPage,
  setUserSearchQuery,
  setUserStatusFilter,
  handleUserSearch,
  handleUserStatusFilter,
  clearUserSearch,
  updateUserStatus,
  resetUserPassword,
  updateUserRole,
  deleteUser,
  viewUserDetails,
  saveUserDetails,
  closeUserDetailsModal,
  saveSettings,
  resetSettings,
  copyToClipboard,
  deleteInvite,
  openInviteModal,
  closeInviteModal,
  createInvite,
  downloadPackage
} = useAdminApp();
</script>
