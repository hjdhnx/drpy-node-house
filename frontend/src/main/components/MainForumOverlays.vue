<template>
  <transition name="fade">
    <div v-if="showPointsHistory" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">
        <div class="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
          <h3 class="text-lg font-bold text-gray-800">{{ t.pointsHistory }}</h3>
          <button @click="showPointsHistory = false" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4 overflow-y-auto">
          <div v-if="pointsHistory.length === 0" class="text-center text-gray-500 py-8">
            No history found.
          </div>
          <ul v-else class="divide-y divide-gray-100">
            <li v-for="item in pointsHistory" :key="item.id" class="py-3 flex justify-between items-center">
              <div>
                <p class="text-sm font-medium text-gray-900">{{ t[item.reason] || item.reason }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(item.created_at) }}</p>
              </div>
              <span class="font-bold" :class="item.amount > 0 ? 'text-green-600' : 'text-red-600'">
                {{ item.amount > 0 ? '+' : '' }}{{ item.amount }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </transition>

  <div v-if="isMentioning && mentionCandidates.length > 0" class="fixed z-[60] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[200px] max-h-60 overflow-y-auto" :style="mentionPopupStyle">
    <div
      v-for="(user, index) in mentionCandidates"
      :key="user.username"
      @click="insertMention(user)"
      class="px-4 py-2 hover:bg-purple-50 cursor-pointer flex items-center gap-2 transition-colors border-b border-gray-50 last:border-0"
    >
      <div class="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {{ (user.nickname || user.username || 'A')[0].toUpperCase() }}
      </div>
      <div class="flex flex-col min-w-0">
        <span class="text-sm font-medium text-gray-800 truncate">{{ user.nickname || user.username }}</span>
        <span class="text-xs text-gray-400 truncate">@{{ user.username }}</span>
      </div>
    </div>
  </div>
  <div v-if="isMentioning" @click="closeMentionPopup" class="fixed inset-0 z-[55] cursor-default bg-transparent"></div>

  <div v-if="showCreateTopic" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 max-h-[90vh] flex flex-col">
      <div class="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
        <h3 class="text-lg font-bold text-gray-800">{{ t.newTopic }}</h3>
        <button @click="showCreateTopic = false" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-4 space-y-3 overflow-y-auto">
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{{ t.topicTitle }}</label>
          <div class="relative">
            <input v-model="newTopicForm.title" maxlength="100" type="text" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm pr-12" :placeholder="t.topicTitle">
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{{ newTopicForm.title.length }}/100</span>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex justify-between items-center">
            {{ t.topicContent }}
            <div class="flex space-x-0.5">
              <button @click="handleMdAction('newTopicContent', 'bold', 'topic-content-input')" class="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100" :title="t.mdBold || 'Bold'"><b>B</b></button>
              <button @click="handleMdAction('newTopicContent', 'italic', 'topic-content-input')" class="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100" :title="t.mdItalic || 'Italic'"><i>I</i></button>
              <button @click="handleMdAction('newTopicContent', 'code', 'topic-content-input')" class="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100" :title="t.mdCode || 'Code'">&lt;/&gt;</button>
              <button @click="handleMdAction('newTopicContent', 'link', 'topic-content-input')" class="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100" :title="t.mdLink || 'Link'">🔗</button>
              <button @click="toggleEmojiPicker('newTopicContent', $event)" class="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100" :title="t.mdEmoji || 'Emoji'">😀</button>
              <label class="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100 cursor-pointer" :title="t.mdImage || 'Upload Image'">
                <input type="file" class="hidden" accept="image/*" @change="handleImageUpload($event, 'newTopicContent')">
                🖼️
              </label>
              <button @click="openFileSelector('newTopicContent')" class="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100" :title="t.insertFile || 'Insert File'">📎</button>
              <button @click="handleMdAction('newTopicContent', 'list', 'topic-content-input')" class="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100" :title="t.mdList || 'List'">≣</button>
            </div>
          </label>
          <textarea id="topic-content-input" v-model="newTopicForm.content" class="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none h-32 font-mono text-sm" :placeholder="t.topicContent" @paste="handlePaste($event, 'newTopicContent')"></textarea>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{{ t.settings || 'Advanced' }}</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">{{ t.bountyPoints }}</label>
              <input v-model.number="newTopicForm.bounty_points" type="number" min="0" class="w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">{{ t.minRank }}</label>
              <select v-model.number="newTopicForm.view_permission_level" class="w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white">
                <option :value="0">{{ t.public || 'Public' }}</option>
                <option v-for="(rank, idx) in t.ranks" :key="idx" :value="idx">{{ rank }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">{{ t.viewCost }}</label>
              <input v-model.number="newTopicForm.view_points_required" type="number" min="0" class="w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm">
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ t.costPoints }}: {{ newTopicForm.bounty_points || 0 }}
          </p>
        </div>
      </div>
      <div class="px-4 py-2.5 bg-gray-50/50 flex justify-end space-x-2 flex-shrink-0 border-t border-gray-100">
        <button @click="showCreateTopic = false" class="px-3 py-1.5 rounded-lg text-gray-600 font-medium hover:bg-gray-200 transition-colors text-sm">{{ t.cancel }}</button>
        <button @click="createTopic" class="bg-purple-600 text-white px-3 py-1.5 rounded-lg font-medium shadow-md shadow-purple-500/30 hover:bg-purple-700 transition-all text-sm">
          {{ t.publish }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const {
  showPointsHistory,
  t,
  pointsHistory,
  formatDate,
  isMentioning,
  mentionCandidates,
  mentionPopupStyle,
  insertMention,
  closeMentionPopup,
  showCreateTopic,
  newTopicForm,
  handleMdAction,
  toggleEmojiPicker,
  handleImageUpload,
  openFileSelector,
  handlePaste,
  createTopic
} = inject('mainApp');
</script>
