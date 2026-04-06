<template>
  <aside :class="sidebarClass">
    <div class="p-6 border-b border-gray-700/50 flex items-center space-x-3">
      <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
        DS
      </div>
      <div>
        <h1 class="text-lg font-bold text-white tracking-wide">{{ t.adminPanel }}</h1>
        <span
          v-if="version"
          class="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-md font-mono block w-fit mt-1"
        >
          v{{ version }}
        </span>
      </div>
    </div>

    <nav class="flex-1 min-h-0 p-4 space-y-2 overflow-y-auto">
      <p class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">{{ t.mainMenu }}</p>
      <a
        href="#"
        @click.prevent="navigate('users')"
        :class="navClass('users')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        {{ t.userManagement }}
      </a>

      <p class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">{{ t.configMenu }}</p>
      <a
        href="#"
        @click.prevent="navigate('settings')"
        :class="navClass('settings')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {{ t.systemSettings }}
      </a>
      <a
        href="#"
        @click.prevent="navigate('invites')"
        :class="navClass('invites')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        {{ t.inviteManagement }}
      </a>
    </nav>

    <div class="mt-auto shrink-0 p-4 border-t border-gray-700/50 bg-black/20 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
            {{ user?.username?.charAt(0).toUpperCase() }}
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-white">{{ user?.username }}</p>
            <p class="text-xs text-gray-500">{{ user?.role === 'super_admin' ? t.superAdmin : t.admin }}</p>
          </div>
        </div>
        <a href="/" class="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors" :title="t.backToHome">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </a>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isSidebarOpen: { type: Boolean, required: true },
  currentView: { type: String, required: true },
  version: { type: String, default: '' },
  user: { type: Object, default: null },
  t: { type: Object, required: true }
});

const emit = defineEmits(['navigate']);

const sidebarClass = computed(() => [
  'fixed inset-y-0 left-0 z-30 w-64 h-dvh max-h-dvh overflow-hidden min-h-0 glass-sidebar border-r border-gray-800 flex flex-col shadow-xl transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto lg:h-auto lg:max-h-none',
  props.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
]);

const navClass = (view) => [
  'sidebar-link flex items-center px-4 py-3 rounded-xl text-sm mb-1',
  props.currentView === view ? 'active text-white' : 'text-gray-400 hover:text-white'
];

const navigate = (view) => {
  emit('navigate', view);
};
</script>
