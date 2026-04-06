<template>
  <div v-show="currentView === 'leaderboard'" class="lg:col-span-8 lg:h-full lg:overflow-hidden flex flex-col flex-1 min-h-0 relative">
    <div class="glass-panel rounded-2xl shadow-sm overflow-hidden flex flex-col h-full w-full lg:h-full">
      <div class="p-2 border-b border-gray-100 flex justify-between items-center bg-white/50 flex-shrink-0 backdrop-blur-md z-10">
        <h2 class="text-base md:text-lg font-bold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {{ t.leaderboard }}
        </h2>
        <div class="flex space-x-1 bg-gray-100/50 p-1 rounded-lg overflow-x-auto no-scrollbar max-w-[60%] md:max-w-none">
          <button class="px-2 py-1 text-xs rounded-md transition-all whitespace-nowrap flex-shrink-0" :class="leaderboardTab === 'files' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'" @click="leaderboardTab = 'files'">{{ t.filesLeaderboard }}</button>
          <button class="px-2 py-1 text-xs rounded-md transition-all whitespace-nowrap flex-shrink-0" :class="leaderboardTab === 'points' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'" @click="leaderboardTab = 'points'">{{ t.pointsLeaderboard }}</button>
          <button class="px-2 py-1 text-xs rounded-md transition-all whitespace-nowrap flex-shrink-0" :class="leaderboardTab === 'rank' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'" @click="leaderboardTab = 'rank'">{{ t.rankLeaderboard }}</button>
          <button class="px-2 py-1 text-xs rounded-md transition-all whitespace-nowrap flex-shrink-0" :class="leaderboardTab === 'topics' ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:text-gray-700'" @click="leaderboardTab = 'topics'">{{ t.topicLeaderboard }}</button>
          <button class="px-2 py-1 text-xs rounded-md transition-all whitespace-nowrap flex-shrink-0" :class="leaderboardTab === 'comments' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'" @click="leaderboardTab = 'comments'">{{ t.commentLeaderboard }}</button>
          <button class="px-2 py-1 text-xs rounded-md transition-all whitespace-nowrap flex-shrink-0" :class="leaderboardTab === 'chat' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'" @click="leaderboardTab = 'chat'">{{ t.chatLeaderboard }}</button>
        </div>
      </div>

      <div id="leaderboard-container" ref="leaderboardContainer" class="flex-1 overflow-y-auto p-4 space-y-4 pb-20 lg:pb-4">
        <div v-if="leaderboardLoading" class="flex justify-center items-center h-full">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>

        <div v-else>
          <div v-if="leaderboards[leaderboardTab] && leaderboards[leaderboardTab].length > 0">
            <div v-for="(lbUser, index) in leaderboards[leaderboardTab]" :key="lbUser.id" class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl mb-2 hover:shadow-md transition-all">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-8 h-8 flex-shrink-0 flex items-center justify-center font-bold rounded-full shadow-sm"
                  :class="index === 0 ? 'bg-yellow-100 text-yellow-600 ring-2 ring-yellow-200' : index === 1 ? 'bg-gray-100 text-gray-600 ring-2 ring-gray-200' : index === 2 ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-200' : 'bg-gray-50 text-gray-400'"
                >
                  {{ index + 1 }}
                </div>
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer hover:ring-2 hover:ring-opacity-50 transition-all" :class="user && lbUser.id === user.id ? 'bg-green-500' : 'bg-blue-500'" @click.stop="openPublicProfile(lbUser)">
                  {{ (lbUser.nickname || lbUser.username || 'A')[0].toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-gray-800 truncate flex items-center gap-1">
                    {{ lbUser.nickname || lbUser.username }}
                    <span v-if="lbUser.role" class="text-[10px] text-yellow-600 bg-yellow-50 border border-yellow-100 px-1 rounded font-normal flex-shrink-0">{{ t.userRole[lbUser.role] || lbUser.role }}</span>
                  </div>
                </div>
              </div>
              <div
                class="font-mono font-bold text-sm whitespace-nowrap flex-shrink-0"
                :class="{
                  'text-indigo-600': leaderboardTab === 'files',
                  'text-blue-600': leaderboardTab === 'points',
                  'text-purple-600': leaderboardTab === 'rank',
                  'text-pink-600': leaderboardTab === 'topics',
                  'text-green-600': leaderboardTab === 'comments',
                  'text-orange-600': leaderboardTab === 'chat'
                }"
              >
                <span v-if="leaderboardTab === 'files'">{{ lbUser.count }} {{ t.filesUnit }}</span>
                <span v-else-if="leaderboardTab === 'points'">{{ lbUser.points }} {{ t.pts }}</span>
                <span v-else-if="leaderboardTab === 'rank'">{{ lbUser.rankTitle || (t.ranks && t.ranks[lbUser.role]) || lbUser.role }}</span>
                <span v-else-if="leaderboardTab === 'topics'">{{ lbUser.count }} {{ t.topicsUnit }}</span>
                <span v-else-if="leaderboardTab === 'comments'">{{ lbUser.count }} {{ t.commentsUnit }}</span>
                <span v-else-if="leaderboardTab === 'chat'">{{ lbUser.count }} {{ t.msgsUnit }}</span>
              </div>
            </div>
          </div>

          <div v-else class="text-center text-gray-400 py-10">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>{{ t.noLeaderboardData }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const {
  currentView,
  t,
  leaderboardTab,
  leaderboardContainer,
  leaderboardLoading,
  leaderboards,
  user,
  openPublicProfile
} = inject('mainApp');
</script>
