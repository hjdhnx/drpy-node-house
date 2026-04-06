<template>
  <div class="glass-panel rounded-2xl shadow-sm flex flex-col flex-1 min-h-0 h-full w-full">
    <div class="p-3 border-b border-gray-100 flex flex-col bg-white/50 flex-shrink-0">
      <div class="flex items-start justify-between gap-2.5">
        <div class="flex items-center min-w-0">
          <button class="mr-1.5 p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors flex-shrink-0" @click="closeTopic()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div class="min-w-0 flex items-center gap-1.5">
            <div class="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-purple-500/30 cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all flex-shrink-0" @click.stop="openPublicProfile(currentTopic.topic)">
              {{ (currentTopic.topic.nickname || currentTopic.topic.username || 'A')[0].toUpperCase() }}
            </div>
            <div class="min-w-0">
              <div class="font-bold text-gray-800 text-sm truncate">
                <span v-if="currentTopic.topic.rankLevel !== undefined" class="text-[10px] text-yellow-600 bg-yellow-50 border border-yellow-100 px-1 py-0.5 rounded mr-1 font-normal">{{ t.ranks[currentTopic.topic.rankLevel] || t.unranked }}</span>
                {{ currentTopic.topic.nickname || currentTopic.topic.username }}
              </div>
              <div class="text-[10px] text-gray-500">{{ formatDate(currentTopic.topic.created_at) }}</div>
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-0.5 flex-shrink-0">
          <button
            v-if="user && (user.role === 'admin' || user.role === 'super_admin')"
            class="p-1.5 rounded-lg transition-colors"
            :class="currentTopic.topic.is_pinned ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'"
            :title="currentTopic.topic.is_pinned ? t.unpin : t.pin"
            @click="togglePin(currentTopic.topic.id, currentTopic.topic.is_pinned)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :fill="currentTopic.topic.is_pinned ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            v-if="user && (user.role === 'admin' || user.role === 'super_admin')"
            class="p-1.5 rounded-lg transition-colors"
            :class="currentTopic.topic.is_featured ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-500'"
            :title="currentTopic.topic.is_featured ? t.unfeature : t.feature"
            @click="toggleFeature(currentTopic.topic.id, currentTopic.topic.is_featured)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :fill="currentTopic.topic.is_featured ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button
            v-if="user && (user.role === 'admin' || user.role === 'super_admin' || user.id === currentTopic.topic.user_id)"
            class="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
            :title="t.editTopic"
            @click="openEditTopic(currentTopic.topic)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            v-if="user && (user.role === 'admin' || user.role === 'super_admin' || user.id === currentTopic.topic.user_id)"
            class="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
            :title="t.deleteTopic"
            @click="deleteTopic(currentTopic.topic.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div id="forum-detail-container" ref="forumDetailContainer" class="flex-1 overflow-y-auto overscroll-contain p-3" style="max-height: calc(100vh - 350px);">
      <h2 class="text-base md:text-lg font-semibold text-gray-800 mb-3 leading-snug break-words">{{ currentTopic.topic.title }}</h2>
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <span v-if="currentTopic.topic.bounty_points > 0" class="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-yellow-200">
            <span>💰</span> {{ currentTopic.topic.bounty_points }}
          </span>
          <span v-if="currentTopic.topic.is_solved" class="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold border border-green-200">
            ✅ {{ t.solved }}
          </span>
          <span v-if="currentTopic.topic.view_points_required > 0" class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
            💎 {{ currentTopic.topic.view_points_required }}
          </span>
          <span v-if="currentTopic.topic.view_permission_level > 0" class="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">
            🔒 {{ t.minRank }}: {{ t.ranks[currentTopic.topic.view_permission_level] || currentTopic.topic.view_permission_level }}
          </span>
        </div>
        <div v-if="currentTopic.topic.access_denied" class="p-8 text-center bg-gray-100 rounded-xl border border-gray-200 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 class="text-lg font-bold text-gray-800 mb-2">{{ t.accessDenied }}</h3>
          <p class="text-gray-600 mb-4">{{ t[currentTopic.topic.deny_reason] || currentTopic.topic.deny_reason }}</p>

          <div v-if="currentTopic.topic.deny_reason === 'rankTooLow'" class="text-sm text-red-500 font-medium bg-red-50 px-3 py-1 rounded-full inline-block">
            {{ t.minRank }}: {{ t.ranks[currentTopic.topic.view_permission_level] || currentTopic.topic.view_permission_level }}
          </div>

          <button
            v-if="currentTopic.topic.deny_reason === 'purchaseRequired'"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            :disabled="user && user.points < currentTopic.topic.view_points_required"
            @click="purchaseTopic(currentTopic.topic.id, currentTopic.topic.view_points_required)"
          >
            <span v-if="user && user.points < currentTopic.topic.view_points_required">{{ t.insufficientPoints }} ({{ user.points }} / {{ currentTopic.topic.view_points_required }})</span>
            <span v-else>{{ t.purchase }} ({{ currentTopic.topic.view_points_required }} {{ t.points }})</span>
          </button>
          <button
            v-if="currentTopic.topic.deny_reason === 'loginRequired'"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-transform hover:scale-105 active:scale-95"
            @click="showLogin = true"
          >
            {{ t.loginToView || t.login }}
          </button>
        </div>
        <div v-else class="prose prose-sm prose-blue max-w-none text-[13px] text-gray-700 leading-relaxed bg-gray-50/50 p-2.5 rounded-xl border border-gray-100" v-html="renderMarkdown(currentTopic.topic.content)"></div>
      </div>

      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          {{ t.comments }} ({{ currentTopic.comments.length }})
        </h3>

        <div v-for="(comment, index) in currentTopic.comments" :key="comment.id" class="flex gap-2.5 group">
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold cursor-pointer hover:ring-2 hover:ring-gray-400 transition-all" @click.stop="openPublicProfile(comment)">
            {{ (comment.nickname || comment.username || 'A')[0].toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="bg-gray-50 rounded-2xl rounded-tl-none p-2.5 relative">
              <div class="flex justify-between items-center mb-1.5 pb-1.5 border-b border-gray-100 border-dashed">
                <div class="flex items-center gap-3">
                  <span class="text-xs text-purple-500 font-mono bg-purple-50 px-2 py-0.5 rounded font-bold">#{{ index + 1 }}</span>
                  <span class="text-xs text-gray-400">{{ formatDate(comment.created_at) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button v-if="user" class="text-gray-400 hover:text-purple-600 transition-all p-1.5 rounded hover:bg-purple-50" :title="t.reply" @click.stop="replyToComment(comment)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </button>
                  <button
                    v-if="user && (user.role === 'admin' || user.role === 'super_admin' || user.id == comment.user_id || user.id == currentTopic.topic.user_id)"
                    class="text-gray-400 hover:text-red-500 transition-all p-1.5 rounded hover:bg-red-50"
                    :title="t.deleteComment"
                    @click.stop="deleteComment(comment.id)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    v-if="user && currentTopic.topic.bounty_points > 0 && !currentTopic.topic.is_solved && (user.id === currentTopic.topic.user_id || user.role === 'admin')"
                    class="text-gray-400 hover:text-green-500 transition-all p-1.5 rounded hover:bg-green-50"
                    :title="t.solve"
                    @click.stop="solveTopic(currentTopic.topic.id, comment.id)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <div v-if="currentTopic.topic.solved_comment_id === comment.id" class="text-green-500 p-1" title="Best Answer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 mb-1.5">
                <span v-if="comment.rankLevel !== undefined" class="text-[10px] text-yellow-600 bg-yellow-50 border border-yellow-100 px-1 rounded font-normal">{{ t.ranks[comment.rankLevel] || t.unranked }}</span>
                <span class="font-bold text-sm text-gray-800">{{ comment.nickname || comment.username }}</span>
              </div>
              <div class="text-[13px] text-gray-700 prose prose-sm max-w-none">
                <div v-if="comment.parent_id" class="bg-purple-50 border-l-2 border-purple-400 p-2 mb-2 text-xs text-gray-500 rounded-r">
                  <div class="font-bold text-purple-600 mb-0.5">
                    Replying to @{{ currentTopic.comments.find((c) => c.id === comment.parent_id)?.nickname || currentTopic.comments.find((c) => c.id === comment.parent_id)?.username || 'Unknown' }}
                  </div>
                  <div class="line-clamp-1 opacity-75">
                    {{ currentTopic.comments.find((c) => c.id === comment.parent_id)?.content }}
                  </div>
                </div>
                <div v-html="renderMarkdown(comment.content)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="user" class="p-3 border-t border-gray-100 bg-white/50 flex-shrink-0">
      <div v-if="replyingToComment" class="flex justify-between items-center mb-2 px-2.5 py-1.5 bg-purple-50 border border-purple-100 rounded-lg">
        <div class="text-xs text-gray-600 truncate max-w-[80%]">
          <span class="font-bold text-purple-600">@{{ replyingToComment.nickname || replyingToComment.username }}</span>: {{ replyingToComment.content }}
        </div>
        <button class="text-gray-400 hover:text-red-500 p-1" @click="cancelReply">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="flex justify-between items-center mb-2 px-1">
        <span class="text-xs text-gray-500">{{ t.reply }}</span>
        <div class="flex space-x-1">
          <button class="p-1 text-gray-500 hover:text-purple-600 rounded hover:bg-purple-50" :title="t.mdBold || 'Bold'" @click="handleMdAction('newComment', 'bold', 'comment-content-input')"><b>B</b></button>
          <button class="p-1 text-gray-500 hover:text-purple-600 rounded hover:bg-purple-50" :title="t.mdItalic || 'Italic'" @click="handleMdAction('newComment', 'italic', 'comment-content-input')"><i>I</i></button>
          <button class="p-1 text-gray-500 hover:text-purple-600 rounded hover:bg-purple-50" :title="t.mdCode || 'Code'" @click="handleMdAction('newComment', 'code', 'comment-content-input')">&lt;/&gt;</button>
          <button class="p-1 text-gray-500 hover:text-purple-600 rounded hover:bg-purple-50" :title="t.mdLink || 'Link'" @click="handleMdAction('newComment', 'link', 'comment-content-input')">🔗</button>
          <button class="p-1 text-gray-500 hover:text-purple-600 rounded hover:bg-purple-50" :title="t.mdEmoji || 'Emoji'" @click="toggleEmojiPicker('newComment', $event)">😀</button>
          <label class="p-1 text-gray-500 hover:text-purple-600 rounded hover:bg-purple-50 cursor-pointer" :title="t.mdImage || 'Upload Image'">
            <input type="file" class="hidden" accept="image/*" @change="handleImageUpload($event, 'newComment')">
            🖼️
          </label>
          <button class="p-1 text-gray-500 hover:text-purple-600 rounded hover:bg-purple-50" :title="t.insertFile || 'Insert File'" @click="openFileSelector('newComment')">📎</button>
          <button class="p-1 text-gray-500 hover:text-purple-600 rounded hover:bg-purple-50" :title="t.mdList || 'List'" @click="handleMdAction('newComment', 'list', 'comment-content-input')">≣</button>
        </div>
      </div>
      <div class="flex gap-1.5">
        <textarea
          id="comment-content-input"
          v-model="newCommentContent"
          class="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none h-20 min-h-[44px] max-h-44"
          :placeholder="t.reply + '... (Markdown supported)'"
          @input="checkMention($event, 'comment')"
          @keydown.ctrl.enter="submitComment"
          @paste="handlePaste($event, 'newComment')"
        ></textarea>
        <button class="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-xl shadow-lg shadow-purple-500/20 transition-all self-end disabled:opacity-50 disabled:cursor-not-allowed" :disabled="isSubmittingComment" @click="submitComment">
          <svg v-if="isSubmittingComment" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
    <div v-else class="p-4 border-t border-gray-100 bg-gray-50 text-center text-sm text-gray-500">
      {{ t.loginToPost }}
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const {
  currentTopic,
  t,
  user,
  closeTopic,
  openPublicProfile,
  formatDate,
  togglePin,
  toggleFeature,
  openEditTopic,
  deleteTopic,
  purchaseTopic,
  showLogin,
  renderMarkdown,
  replyToComment,
  deleteComment,
  solveTopic,
  replyingToComment,
  cancelReply,
  handleMdAction,
  toggleEmojiPicker,
  handleImageUpload,
  openFileSelector,
  newCommentContent,
  checkMention,
  submitComment,
  handlePaste,
  isSubmittingComment,
  forumDetailContainer
} = inject('mainApp');
</script>
