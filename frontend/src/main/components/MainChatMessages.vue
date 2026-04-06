<template>
  <div id="chat-container" ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4 pb-2">
    <div v-for="(msg, index) in chatMessages" :key="index">
      <div v-if="msg.type === 'system'" class="text-center my-2">
        <span class="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{{ msg.content }}</span>
      </div>
      <div v-else class="flex gap-3 group" :class="{ 'flex-row-reverse': user && msg.user_id === user.id }">
        <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer hover:ring-2 hover:ring-opacity-50 transition-all" :class="user && msg.user_id === user.id ? 'bg-green-500' : 'bg-blue-500'" @click.stop="openPublicProfile(msg)">
          {{ (msg.nickname || msg.username || 'A')[0].toUpperCase() }}
        </div>
        <div class="max-w-[80%] md:max-w-[70%]">
          <div class="text-xs text-gray-500 mb-1 flex items-center gap-2" :class="{ 'flex-row-reverse': user && msg.user_id === user.id }">
            <span v-if="msg.rankLevel !== undefined" class="text-[10px] text-yellow-600 bg-yellow-50 border border-yellow-100 px-1 rounded font-normal">{{ t.ranks[msg.rankLevel] || t.unranked }}</span>
            <span>{{ msg.nickname || msg.username }}</span>
            <button
              v-if="user && (msg.user_id === user.id || ['admin', 'super_admin'].includes(user.role))"
              class="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
              :title="t.recall"
              @click="recallMessage(msg.id)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <div class="px-4 py-2 rounded-2xl text-sm shadow-sm prose prose-sm max-w-none break-words" :class="user && msg.user_id === user.id ? 'bg-green-50 text-green-800 rounded-tr-none border border-green-100' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'" v-html="renderMarkdown(msg.content)"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const {
  chatContainer,
  chatMessages,
  user,
  openPublicProfile,
  t,
  recallMessage,
  renderMarkdown
} = inject('mainApp');
</script>
