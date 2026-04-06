<template>
  <div v-if="user" class="p-2 border-t border-gray-100 bg-white/80 backdrop-blur-md relative z-20 flex-shrink-0">
    <div class="flex justify-end px-2 mb-1 space-x-1">
      <button class="p-1 text-gray-500 hover:text-green-600 rounded hover:bg-green-50" :title="t.mdBold || 'Bold'" @click="handleMdAction('chat', 'bold', 'chat-input')"><b>B</b></button>
      <button class="p-1 text-gray-500 hover:text-green-600 rounded hover:bg-green-50" :title="t.mdItalic || 'Italic'" @click="handleMdAction('chat', 'italic', 'chat-input')"><i>I</i></button>
      <button class="p-1 text-gray-500 hover:text-green-600 rounded hover:bg-green-50" :title="t.mdCode || 'Code'" @click="handleMdAction('chat', 'code', 'chat-input')">&lt;/&gt;</button>
      <button class="p-1 text-gray-500 hover:text-green-600 rounded hover:bg-green-50" :title="t.mdLink || 'Link'" @click="handleMdAction('chat', 'link', 'chat-input')">🔗</button>
      <button class="p-1 text-gray-500 hover:text-green-600 rounded hover:bg-green-50" :title="t.mdEmoji || 'Emoji'" @click="toggleEmojiPicker('chat', $event)">😀</button>
      <label class="p-1 text-gray-500 hover:text-green-600 rounded hover:bg-green-50 cursor-pointer" :title="t.mdImage || 'Upload Image'">
        <input type="file" class="hidden" accept="image/*" @change="handleImageUpload($event, 'chat')">
        🖼️
      </label>
      <button class="p-1 text-gray-500 hover:text-green-600 rounded hover:bg-green-50" :title="t.insertFile || 'Insert File'" @click="openFileSelector('chat')">📎</button>
    </div>
    <form class="flex gap-2 items-end" @submit.prevent="sendChatMessage">
      <textarea
        id="chat-input"
        v-model="chatInput"
        class="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all shadow-sm resize-none h-10 max-h-24 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        :placeholder="chatPlaceholder"
        :disabled="chatCooldown > 0"
        @input="checkMention($event, 'chat')"
        @keydown.enter.exact.prevent="sendChatMessage"
        @keydown.enter.shift.exact="() => {}"
        @paste="handlePaste($event, 'chat')"
      ></textarea>
      <button type="submit" class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg shadow-green-500/20 transition-all flex-shrink-0 active:scale-95 mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="chatCooldown > 0">
        <svg v-if="chatCooldown > 0" class="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
  </div>
  <div v-else class="p-4 border-t border-gray-100 bg-gray-50 text-center text-sm text-gray-500 flex-shrink-0">
    {{ t.loginToChat }}
  </div>
</template>

<script setup>
import { inject } from 'vue';

const {
  user,
  t,
  handleMdAction,
  toggleEmojiPicker,
  handleImageUpload,
  openFileSelector,
  sendChatMessage,
  chatInput,
  chatPlaceholder,
  chatCooldown,
  checkMention,
  handlePaste
} = inject('mainApp');
</script>
