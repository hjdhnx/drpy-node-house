<template>
  <div class="p-2 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-white/50 file-list-header flex-shrink-0 gap-2 md:gap-0">
    <h2 class="text-base md:text-lg font-bold text-gray-800 flex items-center w-full md:w-auto justify-center md:justify-start whitespace-nowrap flex-shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      {{ t.filesTitle }}
    </h2>

    <div class="grid grid-cols-12 gap-2 w-full md:flex md:flex-wrap md:w-auto md:items-center md:justify-end md:gap-2">
      <div v-if="uploadersList.length > 0 || user" class="col-span-6 md:w-auto relative group">
        <button
          @click="showFilterUploaderDropdown = !showFilterUploaderDropdown"
          class="flex items-center justify-between w-full md:w-28 px-2 h-8 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:bg-white"
          :title="filterUploaders.length > 0 ? `${filterUploaders.length} selected` : (t.allUploaders || 'All Users')"
        >
          <span class="truncate block text-left" :class="filterUploaders.length === 0 ? 'text-gray-500' : 'text-gray-800'">
            {{ filterUploaders.length === 0 ? (t.allUploaders || 'Users') : (filterUploaders.length === 1 && user && filterUploaders[0] === user.id ? (t.myFiles || 'My Files') : filterUploaders.length + ' selected') }}
          </span>
          <svg class="w-3 h-3 ml-1 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <div v-if="showFilterUploaderDropdown" class="absolute top-full left-0 mt-1 w-full md:w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto p-2">
          <label class="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" :checked="filterUploaders.length === 0" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" @change="toggleFilterUploader('all')">
            <span class="text-sm text-gray-700">{{ t.allUploaders || 'All Users' }}</span>
          </label>
          <div class="h-px bg-gray-100 my-1"></div>
          <template v-if="user">
            <label class="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
              <input type="checkbox" :value="user.id" :checked="filterUploaders.includes(user.id)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" @change="toggleFilterUploader('me')">
              <span class="text-sm text-gray-700 font-medium">{{ t.myFiles || 'My Files' }}</span>
            </label>
            <div class="h-px bg-gray-100 my-1"></div>
          </template>

          <label v-for="u in uploadersList" :key="u.id" class="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" :value="u.id" :checked="filterUploaders.includes(u.id)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" @change="toggleFilterUploader(u.id)">
            <span class="text-sm text-gray-700">{{ u.nickname || u.username }}</span>
          </label>
        </div>

        <div v-if="showFilterUploaderDropdown" class="fixed inset-0 z-40 cursor-default" @click="showFilterUploaderDropdown = false"></div>
      </div>

      <div v-if="allowedTags.length > 0" class="col-span-6 md:w-auto relative group">
        <button
          @click="showFilterTagDropdown = !showFilterTagDropdown"
          class="flex items-center justify-between w-full md:w-28 px-2 h-8 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:bg-white"
          :title="filterTags.length > 0 ? filterTags.join(', ') : (t.allTags || 'All Tags')"
        >
          <span class="truncate block text-left" :class="filterTags.length === 0 ? 'text-gray-500' : 'text-gray-800'">
            {{ filterTags.length === 0 ? (t.allTags || 'Tags') : (filterTags.length === 1 ? filterTags[0] : filterTags.length + ' tags') }}
          </span>
          <svg class="w-3 h-3 ml-1 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <div v-if="showFilterTagDropdown" class="absolute top-full left-0 mt-1 w-full md:w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto p-2">
          <label class="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" :checked="filterTags.length === 0" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" @change="toggleFilterTag('all')">
            <span class="text-sm text-gray-700">{{ t.allTags || 'All Tags' }}</span>
          </label>
          <div class="h-px bg-gray-100 my-1"></div>
          <label v-for="tag in allowedTags" :key="tag" class="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" :value="tag" :checked="filterTags.includes(tag)" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" @change="toggleFilterTag(tag)">
            <span class="text-sm text-gray-700">{{ tag }}</span>
          </label>
          <template v-if="user && (user.role === 'admin' || user.role === 'super_admin')">
            <div class="h-px bg-gray-100 my-1"></div>
            <label class="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
              <input type="checkbox" value="chat-image" :checked="filterTags.includes('chat-image')" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" @change="toggleFilterTag('chat-image')">
              <span class="text-sm text-gray-700">聊天图片 (Hidden)</span>
            </label>
          </template>
        </div>

        <div v-if="showFilterTagDropdown" class="fixed inset-0 z-40 cursor-default" @click="showFilterTagDropdown = false"></div>
      </div>

      <form class="col-span-12 md:w-auto relative group flex-1 md:flex-none" @submit.prevent="handleSearch">
        <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <svg class="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="search"
          enterkeyhint="search"
          :placeholder="t.searchPlaceholder"
          class="pl-7 pr-8 h-8 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white w-full md:w-32 transition-all"
          @keyup.enter="handleSearch"
        >
        <button v-if="searchQuery" type="button" class="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer" @click="clearSearch">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </button>
      </form>

      <div class="col-span-12 md:w-auto flex items-center justify-between md:justify-start gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-gray-100">
        <div v-if="totalPages > 1 || totalItems > 0" class="flex items-center space-x-2 text-sm text-gray-600">
          <select v-model="itemsPerPage" class="bg-white border border-gray-200 text-gray-700 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 h-8 px-2 w-auto min-w-[80px]" @change="changeItemsPerPage">
            <option :value="10">10 / {{ t.page || 'Page' }}</option>
            <option :value="20">20 / {{ t.page || 'Page' }}</option>
            <option :value="30">30 / {{ t.page || 'Page' }}</option>
            <option :value="50">50 / {{ t.page || 'Page' }}</option>
            <option :value="100">100 / {{ t.page || 'Page' }}</option>
          </select>
          <span class="text-xs hidden sm:inline-block whitespace-nowrap">{{ currentPage }} / {{ totalPages }}</span>
          <div class="flex items-center space-x-1">
            <button class="h-8 w-8 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" :title="t.previous" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button class="h-8 w-8 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" :title="t.next" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <button class="h-8 w-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors flex justify-center items-center ml-auto md:ml-0" :title="t.refresh" @click="fetchFiles">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
  uploadersList,
  user,
  filterUploaders,
  showFilterUploaderDropdown,
  toggleFilterUploader,
  allowedTags,
  showFilterTagDropdown,
  filterTags,
  toggleFilterTag,
  handleSearch,
  searchQuery,
  clearSearch,
  totalPages,
  totalItems,
  itemsPerPage,
  currentPage,
  changeItemsPerPage,
  changePage,
  fetchFiles
} = inject('mainApp');
</script>
