<template>
  <div class="lg:col-span-4 space-y-2 lg:space-y-4 lg:overflow-y-auto lg:pr-2 lg:h-full scrollable-column flex-shrink-0 lg:max-h-full" :class="{ 'hidden lg:block': currentView !== 'files' }">
    <div class="glass-panel rounded-2xl shadow-sm p-1 gap-1 hidden lg:flex flex-row justify-between items-center overflow-x-auto">
      <button
        @click="switchView('files')"
        class="p-1 rounded-xl flex items-center justify-center gap-1 transition-colors flex-1 min-w-0 md:min-w-[80px]"
        :class="currentView === 'files' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'"
      >
        <div class="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0" :class="currentView === 'files' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <span class="font-medium truncate hidden sm:inline text-xs md:text-sm">{{ t.filesTitle }}</span>
      </button>

      <button
        @click="switchView('forum')"
        class="p-1 rounded-xl flex items-center justify-center gap-1 transition-colors flex-1 min-w-0 md:min-w-[80px]"
        :class="currentView === 'forum' ? 'bg-purple-50 text-purple-600' : 'hover:bg-gray-50 text-gray-600'"
      >
        <div class="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0" :class="currentView === 'forum' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </div>
        <span class="font-medium truncate hidden sm:inline text-xs md:text-sm">{{ t.forum }}</span>
      </button>

      <button
        @click="switchView('chat')"
        class="p-1 rounded-xl flex items-center justify-center gap-1 transition-colors flex-1 min-w-0 md:min-w-[80px]"
        :class="currentView === 'chat' ? 'bg-green-50 text-green-600' : 'hover:bg-gray-50 text-gray-600'"
      >
        <div class="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0" :class="currentView === 'chat' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <span class="font-medium truncate hidden sm:inline text-xs md:text-sm">{{ t.chat }}</span>
      </button>

      <button
        @click="switchView('leaderboard')"
        class="p-1 rounded-xl flex items-center justify-center gap-1 transition-colors flex-1 min-w-0 md:min-w-[80px]"
        :class="currentView === 'leaderboard' ? 'bg-yellow-50 text-yellow-600' : 'hover:bg-gray-50 text-gray-600'"
      >
        <div class="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0" :class="currentView === 'leaderboard' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span class="font-medium truncate hidden sm:inline text-xs md:text-sm">{{ t.leaderboard }}</span>
      </button>
    </div>

    <div v-if="currentView === 'files'" class="glass-panel rounded-2xl shadow-sm p-4 card-hover">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {{ t.uploadTitle }}
        </h2>
        <div class="flex items-center space-x-2">
          <button @click="isMobileUploadExpanded = !isMobileUploadExpanded" class="lg:hidden text-gray-500 hover:text-blue-600 transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{ 'rotate-180': isMobileUploadExpanded }">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="user" class="relative">
            <select v-model="isPublicUpload" class="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5 pr-8 cursor-pointer hover:bg-gray-100 transition-colors bg-none">
              <option :value="true">🌐 {{ t.public }}</option>
              <option :value="false">🔒 {{ t.private }}</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div :class="{ 'hidden lg:block': !isMobileUploadExpanded }">
        <div
          v-if="canUpload"
          class="relative group border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300"
          :class="{ 'border-blue-500 bg-blue-50': uploading }"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <input ref="fileInput" type="file" class="hidden" multiple :accept="fileInputAccept" @change="handleFileSelect">

          <div v-if="uploading" class="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl transition-opacity duration-300">
            <svg class="animate-spin h-10 w-10 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-blue-600 font-medium animate-pulse">{{ uploadStatusText }}</p>
          </div>

          <div class="group-hover:scale-105 transition-transform duration-300">
            <div class="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p class="text-gray-700 font-medium mb-1 text-sm">{{ t.clickToUpload }}</p>
            <p class="text-gray-400 text-xs mb-1">{{ uploadConfig?.allowed_extensions }}</p>
            <p class="text-gray-400 text-xs">Max size: {{ formatSize(uploadConfig?.max_file_size || 0) }}</p>
          </div>
        </div>

        <div v-else-if="user && user.status === 'pending'" class="text-center p-6 bg-amber-50 border-2 border-dashed border-amber-200 rounded-xl">
          <div class="w-12 h-12 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-amber-800 font-medium mb-2 text-sm">{{ t.pendingApproval }}</p>
          <p class="text-amber-600 text-xs">{{ t.uploadRestricted }}</p>
        </div>

        <div v-else class="text-center p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
          <div class="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p class="text-gray-600 font-medium mb-2 text-sm">{{ t.loginToUpload }}</p>
          <button @click="showLogin = true; showRegister = false" class="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline">
            {{ t.loginNow }}
          </button>
        </div>

        <p v-if="!user && canUpload" class="text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs mt-4 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ t.anonymousTip }}
        </p>
      </div>
    </div>

    <MainFileStatsCard :current-view="currentView" :t="t" :files="files" :format-size="formatSize" />
    <MainCommunitySidebars :current-view="currentView" :t="t" :site-info="siteInfo" :online-users="onlineUsers" :user="user" :open-public-profile="openPublicProfile" />
  </div>
</template>

<script setup>
import { inject } from 'vue';
import MainFileStatsCard from './MainFileStatsCard.vue';
import MainCommunitySidebars from './MainCommunitySidebars.vue';

const {
  currentView,
  switchView,
  t,
  user,
  isPublicUpload,
  canUpload,
  uploading,
  uploadStatusText,
  handleDrop,
  handleFileSelect,
  fileInput,
  fileInputAccept,
  uploadConfig,
  formatSize,
  showLogin,
  showRegister,
  files,
  siteInfo,
  onlineUsers,
  openPublicProfile,
  isMobileUploadExpanded
} = inject('mainApp');
</script>
