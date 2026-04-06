<template>
  <div v-if="currentView === 'forum'" class="glass-panel rounded-2xl shadow-sm p-4">
    <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{{ t.forum }}</h3>
    <p class="text-sm text-gray-600">{{ siteInfo.welcome || '欢迎来到社区论坛！请遵守社区规范。' }}</p>
  </div>

  <div v-if="currentView === 'chat'" class="glass-panel rounded-2xl shadow-sm p-4 hidden lg:flex flex-col h-full max-h-[calc(100vh-200px)]">
    <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
      <span>{{ t.onlineUsers }}</span>
      <span class="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">{{ onlineUsers.length }}</span>
    </h3>
    <div class="flex-1 overflow-y-auto space-y-2">
      <div v-for="onlineUser in onlineUsers" :key="onlineUser.id" class="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
        <div @click.stop="openPublicProfile(onlineUser)" class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
          {{ (onlineUser.nickname || onlineUser.username || 'A')[0].toUpperCase() }}
        </div>
        <div>
          <div class="text-sm font-medium text-gray-800">
            <span class="text-[10px] text-yellow-600 bg-yellow-50 border border-yellow-100 px-1 rounded mr-1" v-if="onlineUser.rankLevel !== undefined">{{ t.ranks[onlineUser.rankLevel] || t.unranked }}</span>
            {{ onlineUser.nickname || onlineUser.username }}
          </div>
          <div class="text-xs text-green-500 flex items-center">
            <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
            {{ t.online }} <span v-if="user && user.id === onlineUser.id">({{ t.hi }})</span>
          </div>
        </div>
      </div>
      <div v-if="onlineUsers.length === 0" class="text-center text-gray-400 text-xs py-4">
        {{ t.noOnlineUsers }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentView: { type: String, required: true },
  t: { type: Object, required: true },
  siteInfo: { type: Object, required: true },
  onlineUsers: { type: Array, required: true },
  user: { type: Object, default: null },
  openPublicProfile: { type: Function, required: true }
});
</script>
