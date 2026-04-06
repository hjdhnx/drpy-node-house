<template>
  <div class="container mx-auto px-2 py-2 max-w-6xl relative flex flex-col lg:h-screen lg:p-4" :class="{ 'fixed inset-0 z-0 h-dvh flex flex-col overflow-hidden lg:static lg:h-screen lg:overflow-hidden': currentView !== 'files' }">
    <div v-if="!isAppReady" class="fixed inset-0 flex items-center justify-center z-50">
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4 shadow-sm"></div>
        <div class="text-gray-400 font-medium text-sm tracking-wide">LOADING...</div>
      </div>
    </div>

    <div v-else class="h-full min-h-0 flex flex-col">
      <div class="fixed top-0 inset-x-0 z-50 px-2 pt-2 lg:static lg:px-0 lg:pt-0">
        <MainTopHeader
          :current-view="currentView"
          :show-site-info-popover="showSiteInfoPopover"
          :site-info="siteInfo"
          :t="t"
          :version="version"
          :env-info="envInfo"
          :lang="lang"
          :user="user"
          :status="status"
          :notifications="notifications"
          :unread-notifications-count="unreadNotificationsCount"
          :show-notifications="showNotifications"
          :toggle-lang="toggleLang"
          :toggle-notifications="toggleNotifications"
          :mark-all-as-read="markAllAsRead"
          :handle-notification-click="handleNotificationClick"
          :format-date="formatDate"
          :open-all-notifications="openAllNotifications"
          :switch-view="switchView"
          :open-profile-modal="openProfileModal"
          :logout="logout"
          @toggle-site-info-popover="showSiteInfoPopover = !showSiteInfoPopover"
          @close-site-info-popover="showSiteInfoPopover = false"
          @close-notifications="showNotifications = false"
          @open-change-password="showChangePasswordModal = true"
          @open-login="showLogin = true"
          @open-register="showRegister = true"
        />
      </div>

      <div class="flex flex-col flex-1 min-h-0 animate-fade-in relative">
        <div class="h-[108px] sm:h-[116px] lg:hidden flex-shrink-0"></div>

        <main class="flex-1 min-h-0 flex flex-col gap-2 lg:grid lg:grid-cols-12 lg:gap-2 overflow-hidden relative w-full">
          <MainFilesSidebar />
          <MainFilesView />
          <MainForumView />
          <MainChatView />
          <MainLeaderboardView />
        </main>

        <MainFooter :current-view="currentView" :t="t" :site-info="siteInfo" />
      </div>

      <div class="fixed inset-0 pointer-events-none z-40">
        <MainScrollButtons :user="user" :t="t" :scroll-to-top="scrollToTop" :scroll-to-bottom="scrollToBottom" />
      </div>
    </div>

    <MainForumOverlays />
    <MainMainModals />
    <MainEmojiPicker />
    <MainAuthModals />
  </div>
</template>

<script setup>
import { provide } from 'vue';
import { useMainApp } from '@/main/app.js';
import MainTopHeader from './MainTopHeader.vue';
import MainFilesSidebar from './MainFilesSidebar.vue';
import MainFilesView from './MainFilesView.vue';
import MainForumView from './MainForumView.vue';
import MainChatView from './MainChatView.vue';
import MainLeaderboardView from './MainLeaderboardView.vue';
import MainFooter from './MainFooter.vue';
import MainScrollButtons from './MainScrollButtons.vue';
import MainForumOverlays from './MainForumOverlays.vue';
import MainMainModals from './MainMainModals.vue';
import MainEmojiPicker from './MainEmojiPicker.vue';
import MainAuthModals from './MainAuthModals.vue';

const mainApp = useMainApp();

provide('mainApp', mainApp);

const {
  currentView,
  isAppReady,
  showSiteInfoPopover,
  siteInfo,
  t,
  version,
  envInfo,
  lang,
  user,
  status,
  notifications,
  unreadNotificationsCount,
  showNotifications,
  toggleLang,
  toggleNotifications,
  markAllAsRead,
  handleNotificationClick,
  formatDate,
  openAllNotifications,
  switchView,
  openProfileModal,
  logout,
  showChangePasswordModal,
  showLogin,
  showRegister,
  scrollToTop,
  scrollToBottom
} = mainApp;
</script>

<style>
@supports (-webkit-touch-callout: none) {
  .mobile-fixed {
    position: fixed !important;
    -webkit-transform: translateZ(0) !important;
    transform: translateZ(0) !important;
    -webkit-backface-visibility: hidden !important;
    backface-visibility: hidden !important;
  }
}

@media screen and (max-width: 768px) {
  .mobile-fixed {
    position: fixed !important;
    transform: translateZ(0) !important;
  }
}
</style>
