<template>
  <div ref="filesContainer" class="flex-1 file-list-body relative overflow-auto min-h-0">
    <input ref="replaceFileInput" type="file" class="hidden" @change="handleReplaceFileSelect" />
    <table class="min-w-full divide-y divide-gray-100 relative">
      <thead class="bg-gray-50/95 sticky top-0 z-20 backdrop-blur-sm shadow-sm">
        <tr>
          <th class="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)] w-12">#</th>
          <th class="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.fileName }}</th>
          <th class="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.tags }}</th>
          <th class="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.fileSize }}</th>
          <th class="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.owner }}</th>
          <th class="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.fileVisibility }}</th>
          <th class="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.uploadDate }}</th>
          <th class="px-2 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)] w-24">{{ t.actions }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 bg-white/30">
        <tr v-for="(file, index) in files" :key="file.id" class="hover:bg-blue-50/30 transition-colors group">
          <td class="px-2 py-3 whitespace-nowrap text-sm text-gray-500 sticky left-0 bg-white/95 group-hover:bg-blue-50/95 z-10 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)] font-mono text-center">
            {{ (currentPage - 1) * itemsPerPage + index + 1 }}
          </td>
          <td class="px-2 py-3">
            <div class="flex items-center">
              <div class="hidden md:flex flex-shrink-0 h-10 w-10 bg-indigo-50 text-indigo-500 rounded-lg items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="md:ml-4">
                <div class="text-sm font-medium text-gray-900 max-w-[200px] truncate" :title="file.filename">{{ file.filename }}</div>
                <div class="text-xs text-gray-400 font-mono mt-0.5 flex items-center cursor-pointer hover:text-blue-500" :title="t.copyCID" @click="copyToClipboard(file.cid)">
                  {{ truncate(file.cid, 12) }}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </div>
              </div>
            </div>
          </td>
          <td class="px-2 py-3">
            <div class="flex flex-wrap gap-1 max-w-[150px]">
              <span v-for="tag in (file.tags ? file.tags.split(',') : [])" :key="tag" class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100">
                {{ tag }}
              </span>
            </div>
          </td>
          <td class="px-2 py-3 whitespace-nowrap text-sm text-gray-600">
            {{ formatSize(file.size) }}
          </td>
          <td class="px-2 py-3 whitespace-nowrap">
            <div class="flex items-center space-x-2">
              <div class="h-6 w-6 rounded-full bg-gradient-to-r from-pink-400 to-red-400 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:ring-2 hover:ring-pink-400 transition-all" @click.stop="openPublicProfile(file)">
                {{ (file.nickname || file.username || 'A')[0].toUpperCase() }}
              </div>
              <span class="text-sm text-gray-600">{{ file.nickname || file.username || t.anonymous }}</span>
            </div>
          </td>
          <td class="px-2 py-3 whitespace-nowrap">
            <span class="px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full border" :class="file.is_public ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'">
              {{ file.is_public ? t.publicLabel : t.privateLabel }}
            </span>
          </td>
          <td class="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
            {{ formatDate(file.created_at) }}
          </td>
          <td class="px-2 py-3 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white/90 backdrop-blur-sm shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)] group-hover:bg-blue-50/90 transition-colors" :class="activeMenuFileId === file.id ? 'z-50' : 'z-10'">
            <div class="flex items-center justify-end space-x-1 opacity-80 group-hover:opacity-100 transition-opacity relative">
              <a v-if="canPreview" :href="getDownloadUrl(file.cid, true, file.id)" target="_blank" class="p-1.5 rounded-lg text-teal-600 hover:text-teal-800 hover:bg-teal-50 transition-colors" :title="t.preview">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 5 8.268 7.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </a>
              <span v-else class="p-1.5 text-gray-300 cursor-not-allowed" :title="user && user.status === 'pending' ? t.pendingPreview : t.loginToPreview">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </span>

              <a v-if="canDownload" :href="getFileDownloadUrl(file)" target="_blank" class="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors" :title="t.download">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
              <span v-else class="p-1.5 text-gray-300 cursor-not-allowed" :title="user && user.status === 'pending' ? t.pendingDownload : t.loginToDownload">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>

              <div class="relative" :class="{ invisible: !isOwner(file) }">
                <button class="action-menu-btn p-1.5 rounded-lg transition-all duration-200 outline-none focus:ring-2 focus:ring-purple-100" :class="activeMenuFileId === file.id ? 'bg-purple-50 text-purple-600 ring-2 ring-purple-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'" @click.stop="toggleFileMenu(file.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>

                <transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <div v-if="activeMenuFileId === file.id" class="action-menu-content absolute right-0 w-36 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl ring-1 ring-black/5 border border-gray-100 z-50 overflow-hidden" :class="[index < 3 ? 'mt-1 origin-top-right' : 'bottom-full mb-1 origin-bottom-right']">
                    <div class="py-1">
                      <button class="group w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors" @click="openTagModal(file); closeFileMenu()">
                        <span class="p-1 rounded bg-blue-50 text-blue-500 group-hover:bg-blue-100 group-hover:text-blue-600 mr-2 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </span>
                        {{ t.tags }}
                      </button>

                      <button class="group w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center transition-colors" @click="triggerReplaceFile(file); closeFileMenu()">
                        <span class="p-1 rounded bg-green-50 text-green-500 group-hover:bg-green-100 group-hover:text-green-600 mr-2 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </span>
                        {{ t.replaceFile }}
                      </button>

                      <button class="group w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 flex items-center transition-colors" @click="toggleVisibility(file); closeFileMenu()">
                        <template v-if="file.is_public">
                          <span class="p-1 rounded bg-amber-50 text-amber-500 group-hover:bg-amber-100 group-hover:text-amber-600 mr-2 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </span>
                          {{ t.makePrivate }}
                        </template>
                        <template v-else>
                          <span class="p-1 rounded bg-amber-50 text-amber-500 group-hover:bg-amber-100 group-hover:text-amber-600 mr-2 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                          </span>
                          {{ t.makePublic }}
                        </template>
                      </button>

                      <div class="my-0.5 border-t border-gray-50"></div>
                      <button class="group w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center transition-colors" @click="deleteFile(file); closeFileMenu()">
                        <span class="p-1 rounded bg-red-50 text-red-500 group-hover:bg-red-100 group-hover:text-red-600 mr-2 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </span>
                        {{ t.delete }}
                      </button>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </td>
        </tr>
        <tr v-if="files.length === 0">
          <td colspan="6" class="px-6 py-12 text-center text-gray-400">
            <div class="flex flex-col items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p>{{ t.noFiles }}</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const {
  t,
  files,
  filesContainer,
  currentPage,
  itemsPerPage,
  formatSize,
  formatDate,
  copyToClipboard,
  truncate,
  openPublicProfile,
  activeMenuFileId,
  canPreview,
  getDownloadUrl,
  user,
  canDownload,
  getFileDownloadUrl,
  isOwner,
  toggleFileMenu,
  openTagModal,
  closeFileMenu,
  toggleVisibility,
  deleteFile,
  replaceFileInput,
  triggerReplaceFile,
  handleReplaceFileSelect
} = inject('mainApp');
</script>
