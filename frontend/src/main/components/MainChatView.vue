<template>
  <div v-if="currentView === 'chat'" class="lg:col-span-8 lg:h-full lg:overflow-hidden flex flex-col flex-1 min-h-0 relative">
    <div class="glass-panel rounded-2xl shadow-sm overflow-hidden flex flex-col h-full w-full lg:h-full">
      <div class="p-2 border-b border-gray-100 flex justify-between items-center bg-white/50 flex-shrink-0 backdrop-blur-md z-10">
        <h2 class="text-base md:text-lg font-bold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {{ t.chat }}
        </h2>
        <div class="flex items-center space-x-2">
          <button class="lg:hidden p-1 text-gray-500 hover:text-green-600 rounded hover:bg-green-50 relative" title="Online Users" @click="showOnlineUsersModal = true">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span class="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full ring-2 ring-white"></span>
          </button>
          <span class="w-2 h-2 rounded-full hidden lg:block" :class="isChatConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'"></span>
          <span class="text-xs text-gray-500 hidden lg:block">{{ isChatConnected ? t.online : t.offline }}</span>
        </div>
      </div>

      <MainChatMessages />
      <MainChatComposer />
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';
import MainChatComposer from './MainChatComposer.vue';
import MainChatMessages from './MainChatMessages.vue';

const {
  currentView,
  t,
  showOnlineUsersModal,
  isChatConnected
} = inject('mainApp');
</script>
