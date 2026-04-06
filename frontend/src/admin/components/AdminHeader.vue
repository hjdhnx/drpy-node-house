<template>
  <header class="flex w-full min-w-0 justify-between items-center gap-2 lg:gap-4 mb-6 lg:mb-8">
    <div class="flex min-w-0 items-center flex-1">
      <button
        @click="$emit('open-sidebar')"
        class="lg:hidden mr-3 p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div class="min-w-0">
        <h2 class="text-xl lg:text-2xl font-bold text-gray-800 tracking-tight break-words">{{ currentTitle }}</h2>
        <p class="text-[10px] lg:text-sm text-gray-500 mt-0.5 lg:mt-1 break-words whitespace-normal">{{ t.manageSystem }}</p>
      </div>
    </div>
    <div class="flex shrink-0 items-center space-x-2 lg:space-x-4">
      <button
        @click="$emit('download-package')"
        class="bg-white px-2.5 py-1.5 lg:px-4 lg:py-2 rounded-xl shadow-sm border border-gray-100 flex items-center text-xs lg:text-sm text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span class="text-[10px] lg:text-sm whitespace-nowrap">{{ t.downloadPackage }}</span>
      </button>
      <div class="bg-white px-2.5 py-1.5 lg:px-4 lg:py-2 rounded-xl lg:rounded-full shadow-sm border border-gray-100 flex items-center text-xs lg:text-sm text-gray-600 shrink-0">
        <span class="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-green-500 mr-1.5 lg:mr-2 shrink-0 animate-pulse"></span>
        <span class="text-[10px] lg:text-sm whitespace-nowrap">{{ t.systemActive }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentView: { type: String, required: true },
  t: { type: Object, required: true }
});

defineEmits(['open-sidebar', 'download-package']);

const currentTitle = computed(() => {
  if (props.currentView === 'settings') return props.t.systemSettings;
  if (props.currentView === 'invites') return props.t.inviteManagement;
  return props.t.userManagement;
});
</script>
