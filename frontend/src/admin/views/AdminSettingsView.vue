<template>
  <div class="h-full w-full min-w-0 flex flex-col overflow-hidden">
    <div class="glass-panel rounded-2xl shadow-sm p-4 lg:p-6 w-full flex-1 min-w-0 flex flex-col border-0 ring-1 ring-gray-900/5 overflow-hidden relative">
      <div class="flex-1 overflow-y-auto pr-2 lg:pr-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          <div class="space-y-6">
            <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div class="border-b border-gray-100 pb-3 mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  {{ t.registrationControl }}
                </h3>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.registrationPolicy }}</label>
                <div class="relative">
                  <select v-model="settings.registration_policy" class="block w-full pl-4 pr-10 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors cursor-pointer appearance-none shadow-sm bg-none">
                    <option value="open">{{ t.openRegistration }}</option>
                    <option value="closed">{{ t.closedRegistration }}</option>
                    <option value="approval">{{ t.approvalRegistration }}</option>
                    <option value="invite">{{ t.inviteRegistration }}</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div class="border-b border-gray-100 pb-3 mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {{ t.securitySettings }}
                </h3>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.registrationIpLimit }}</label>
                  <input type="number" v-model.number="settings.registration_ip_limit" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm" min="1">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.apiRateLimit }}</label>
                  <input type="number" v-model.number="settings.rate_limit_max" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm" min="10">
                </div>
                <p class="text-xs text-gray-500">{{ t.securitySettingsHint }}</p>
              </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div class="border-b border-gray-100 pb-3 mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {{ t.anonymousAccess }}
                </h3>
              </div>
              <div class="space-y-4">
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <label class="text-sm font-medium text-gray-700">{{ t.anonymousUpload }}</label>
                    <p class="text-xs text-gray-500">{{ t.allowAnonymousUpload }}</p>
                  </div>
                  <button @click="toggleSetting('anonymous_upload')" :class="switchClass(settings.anonymous_upload)" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <span :class="switchKnobClass(settings.anonymous_upload)" class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <label class="text-sm font-medium text-gray-700">{{ t.anonymousPreview }}</label>
                    <p class="text-xs text-gray-500">{{ t.allowAnonymousPreview }}</p>
                  </div>
                  <button @click="toggleSetting('anonymous_preview')" :class="switchClass(settings.anonymous_preview)" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <span :class="switchKnobClass(settings.anonymous_preview)" class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <label class="text-sm font-medium text-gray-700">{{ t.anonymousDownload }}</label>
                    <p class="text-xs text-gray-500">{{ t.allowAnonymousDownload }}</p>
                  </div>
                  <button @click="toggleSetting('anonymous_download')" :class="switchClass(settings.anonymous_download)" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <span :class="switchKnobClass(settings.anonymous_download)" class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div class="border-b border-gray-100 pb-3 mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {{ t.notifications || 'Notifications' }}
                </h3>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.notificationLimit || 'Notification Limit' }}</label>
                  <input type="number" v-model="settings.notification_limit" class="block w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white" placeholder="10">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.notificationTemplates || 'Notification Templates (JSON)' }}</label>
                  <textarea v-model="settings.notification_templates" rows="10" class="block w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white font-mono text-xs"></textarea>
                  <p class="text-xs text-gray-500 mt-1">{{ t.notificationTemplatesHint }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div class="border-b border-gray-100 pb-3 mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {{ t.fileUploadLimits }}
                </h3>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.packageDownloadMode }}</label>
                  <select v-model="settings.package_download_mode" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm">
                    <option value="essential">{{ t.packageDownloadModeEssential }}</option>
                    <option value="all">{{ t.packageDownloadModeAll }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.downloadProtocols }}</label>
                  <textarea v-model="settings.download_protocols" rows="5" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl font-mono text-xs bg-gray-50/50 hover:bg-white transition-colors shadow-sm" placeholder="{ 'Protocol': 'scheme://...' }"></textarea>
                  <p class="mt-2 text-xs text-gray-500">{{ t.downloadProtocolsHint }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.allowedFileTypes }}</label>
                  <input type="text" v-model="settings.allowed_extensions" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm" placeholder=".json,.txt,.py,.php,.js,.m3u">
                  <p class="mt-2 text-xs text-gray-500">{{ t.separateByComma }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.allowedTagsLabel }}</label>
                  <input type="text" v-model="settings.allowed_tags" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm" placeholder="ds,dr2,catvod,php,hipy">
                  <p class="mt-2 text-xs text-gray-500">{{ t.separateTagsByComma }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.maxFileSize }}</label>
                  <div class="flex items-center space-x-4">
                    <div class="relative flex-1">
                      <input type="number" v-model.number="settings.max_file_size" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm">
                      <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <span class="text-gray-400 text-sm">Bytes</span>
                      </div>
                    </div>
                    <div class="bg-gray-100 px-4 py-2.5 rounded-xl min-w-[120px] text-center text-sm font-medium text-gray-700 border border-gray-200">
                      {{ formatSize(settings.max_file_size) }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <label class="text-sm font-medium text-gray-700">{{ t.imageCompression }}</label>
                    <p class="text-xs text-gray-500">{{ t.compressImages }}</p>
                  </div>
                  <button @click="toggleSetting('image_compression_enabled')" :class="switchClass(settings.image_compression_enabled)" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <span :class="switchKnobClass(settings.image_compression_enabled)" class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                  </button>
                </div>
              </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div class="border-b border-gray-100 pb-3 mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {{ t.leaderboard || 'Leaderboard' }}
                </h3>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.leaderboardLimit }}</label>
                  <input type="number" v-model.number="settings.leaderboard_limit" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm" min="1" step="1">
                </div>
              </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div class="border-b border-gray-100 pb-3 mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {{ t.chat }}
                </h3>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.chatInterval }}</label>
                  <input type="number" v-model.number="settings.chat_interval" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm" min="0">
                </div>
              </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div class="border-b border-gray-100 pb-3 mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ t.siteInfo }}
                </h3>
              </div>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.siteName }}</label>
                  <input type="text" v-model="settings.site_name" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm" placeholder="DS源仓库">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.siteWelcome }}</label>
                  <input type="text" v-model="settings.site_welcome" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm" placeholder="欢迎来到社区论坛！请遵守社区规范。">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Copyright</label>
                  <input type="text" v-model="settings.site_copyright" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm" placeholder="Copyright © 2026 Drpy Node House. All Rights Reserved.">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.icpNumber }}</label>
                  <input type="text" v-model="settings.site_icp" class="block w-full px-4 py-2.5 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-xl bg-gray-50/50 hover:bg-white transition-colors shadow-sm" placeholder="ICP...">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-gray-200 flex justify-end z-10">
          <button @click="resetSettings" :disabled="loading" class="mr-4 text-red-600 bg-red-50 hover:bg-red-100 font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            {{ t.resetDefaults }}
          </button>
          <button @click="saveSettings" :disabled="loading" class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium">
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? t.saving : t.saveChanges }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  settings: { type: Object, required: true },
  loading: { type: Boolean, required: true },
  t: { type: Object, required: true },
  formatSize: { type: Function, required: true },
  resetSettings: { type: Function, required: true },
  saveSettings: { type: Function, required: true }
});

const toggleSetting = (key) => {
  props.settings[key] = props.settings[key] === 'true' ? 'false' : 'true';
};

const switchClass = (value) => (value === 'true' ? 'bg-blue-600' : 'bg-gray-200');

const switchKnobClass = (value) => (value === 'true' ? 'translate-x-5' : 'translate-x-0');
</script>
