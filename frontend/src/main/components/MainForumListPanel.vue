<template>
  <div class="glass-panel rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 lg:w-auto">
    <div class="p-4 border-b border-gray-100 bg-white/50 flex-shrink-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
      <div class="flex items-center w-full lg:w-auto min-w-0">
        <h2 class="text-lg font-bold text-gray-800 flex items-center min-w-0 mr-auto lg:mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
          <span class="truncate">{{ t.topics }}</span>
        </h2>
        <button v-if="user" class="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg shadow-purple-500/20 transition-all flex items-center whitespace-nowrap flex-shrink-0" @click="openCreateTopic">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="hidden sm:inline">{{ t.newTopic }}</span>
        </button>
      </div>
      <div class="flex items-center gap-2 w-full lg:flex-1 lg:min-w-0 lg:justify-end overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
        <div class="relative group">
          <input
            v-model.lazy="forumSearchQuery"
            type="text"
            :placeholder="t.search"
            class="w-8 focus:w-32 sm:w-40 sm:focus:w-48 lg:w-48 lg:focus:w-52 bg-gray-100/80 focus:bg-white border-none rounded-lg py-1 pl-8 pr-2 text-sm transition-all duration-300 outline-none placeholder-transparent focus:placeholder-gray-400 focus:shadow-sm focus:ring-1 focus:ring-purple-200"
            @keyup.enter="fetchTopics(1)"
          >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div class="flex bg-gray-100/80 rounded-lg p-1 gap-1">
          <button class="p-1 rounded-md transition-all" :class="forumSort === 'newest' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'" :title="t.sortNewest" @click="handleForumSort('newest')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button class="p-1 rounded-md transition-all" :class="forumSort === 'hottest' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'" :title="t.sortHottest" @click="handleForumSort('hottest')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </button>
          <button class="p-1 rounded-md transition-all" :class="forumSort === 'replies' ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'" :title="t.sortReplies" @click="handleForumSort('replies')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        </div>

        <div class="w-px h-5 bg-gray-200 mx-0.5"></div>

        <div class="flex bg-gray-100/80 rounded-lg p-1 gap-1 overflow-x-auto max-w-[200px] sm:max-w-none scrollbar-hide">
          <button class="p-1 rounded-md transition-all flex-shrink-0" :class="forumFilter === 'all' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'" :title="t.filterAll" @click="handleForumFilter('all')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button class="p-1 rounded-md transition-all flex-shrink-0" :class="forumFilter === 'featured' ? 'bg-white text-yellow-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'" :title="t.filterFeatured" @click="handleForumFilter('featured')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :fill="forumFilter === 'featured' ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button class="p-1 rounded-md transition-all flex-shrink-0" :class="forumFilter === 'paid' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'" :title="t.filterPaid" @click="handleForumFilter('paid')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
          <button class="p-1 rounded-md transition-all flex-shrink-0" :class="forumFilter === 'free' ? 'bg-white text-green-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'" :title="t.filterFree" @click="handleForumFilter('free')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </button>
          <button class="p-1 rounded-md transition-all flex-shrink-0" :class="forumFilter === 'bounty' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'" :title="t.filterBounty" @click="handleForumFilter('bounty')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div id="forum-list-container" ref="forumListContainer" class="flex-1 min-h-0 overflow-y-auto p-4">
      <div v-if="topics.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p>{{ t.noTopics }}</p>
      </div>
      <div v-else class="space-y-3">
        <div v-for="topic in topics" :key="topic.id" class="p-3 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all cursor-pointer group relative" @click="openTopic(topic.id)">
          <div class="space-y-1.5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex flex-wrap items-center gap-1.5 min-w-0 pr-2">
                <span v-if="topic.is_pinned" class="inline-block px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">{{ t.pinned }}</span>
                <span v-if="topic.is_featured" class="inline-block px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-bold border border-purple-200">⭐ {{ t.featured }}</span>
                <span v-if="topic.bounty_points > 0" class="inline-flex px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-bold items-center gap-1">
                  <span>💰</span>{{ topic.bounty_points }}
                </span>
                <span v-if="topic.is_solved" class="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-bold">{{ t.solved }}</span>
                <span v-if="topic.view_permission_level > 0 || topic.view_points_required > 0" class="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded" title="Restricted">🔒</span>
              </div>
              <div class="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap self-start mt-0.5">
                {{ formatDate(topic.created_at) }}
              </div>
            </div>
            <h3 class="text-sm md:text-[15px] font-semibold text-gray-800 group-hover:text-purple-600 transition-colors break-words w-full leading-snug">
              {{ truncate(topic.title, 80) }}
            </h3>
            <div class="flex-1 min-w-0 grid grid-cols-1">
              <div class="flex items-center text-xs text-gray-400 space-x-3">
                <span class="flex items-center whitespace-nowrap">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span v-if="topic.rankLevel !== undefined" class="text-[10px] text-yellow-600 bg-yellow-50 border border-yellow-100 px-1 rounded mr-1">{{ t.ranks[topic.rankLevel] || t.unranked }}</span>
                  <span class="truncate max-w-[150px]">{{ topic.nickname || topic.username }}</span>
                </span>
                <span class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 5 8.268 7.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {{ topic.views }}
                </span>
                <span class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  {{ topic.comment_count }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="forumTotalPages > 1" class="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-center">
      <div class="flex items-center space-x-1">
        <button class="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" :disabled="forumPage === 1" @click="fetchTopics(forumPage - 1, true)">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <template v-for="(p, i) in visibleForumPages" :key="i">
          <span v-if="p === '...'" class="px-2 text-gray-400 font-medium">...</span>
          <button v-else class="w-8 h-8 rounded-lg text-sm font-medium transition-colors" :class="p === forumPage ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'" @click="fetchTopics(p, true)">
            {{ p }}
          </button>
        </template>

        <button class="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" :disabled="forumPage === forumTotalPages" @click="fetchTopics(forumPage + 1, true)">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const {
  t,
  user,
  openCreateTopic,
  forumSearchQuery,
  fetchTopics,
  forumSort,
  handleForumSort,
  forumFilter,
  handleForumFilter,
  topics,
  openTopic,
  formatDate,
  truncate,
  forumTotalPages,
  forumPage,
  visibleForumPages,
  forumListContainer
} = inject('mainApp');
</script>
