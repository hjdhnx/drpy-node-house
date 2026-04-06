<template>
  <div class="h-full w-full min-w-0 min-h-0 flex flex-col overflow-hidden">
    <div class="flex justify-between mb-6 shrink-0">
      <div></div>
      <div class="flex space-x-3">
        <button @click="openInviteModal" class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all flex items-center font-medium text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {{ t.generateInvite }}
        </button>
      </div>
    </div>

    <div class="glass-panel rounded-2xl shadow-sm overflow-hidden border-0 ring-1 ring-gray-900/5 flex-1 min-h-0 flex flex-col">
      <div class="overflow-auto flex-1 min-h-0">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50/80 backdrop-blur-sm">
            <tr>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.inviteCode }}</th>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.creator }}</th>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.usage }}</th>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.statusLabel }}</th>
              <th class="px-3 py-3 lg:px-6 lg:py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ t.actions }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white/60">
            <tr v-for="invite in invites" :key="invite.code" class="hover:bg-blue-50/50 transition-colors group">
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-mono text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100 select-all">{{ invite.code }}</span>
                  <button @click="copyToClipboard(invite.code)" class="text-gray-400 hover:text-blue-500 transition-colors" title="Copy">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </td>
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap text-sm text-gray-600">{{ invite.created_by_username }}</td>
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-1 w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div class="bg-blue-500 h-2 rounded-full" :style="{ width: invite.max_uses === 0 ? '0%' : Math.min((invite.used_count / invite.max_uses) * 100, 100) + '%' }"></div>
                  </div>
                  <span class="text-xs text-gray-500 font-medium">{{ invite.used_count }} / {{ invite.max_uses === 0 ? '∞' : invite.max_uses }}</span>
                </div>
              </td>
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap text-sm text-gray-500">
                <span v-if="invite.max_uses > 0 && invite.used_count >= invite.max_uses" class="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-medium">{{ t.exhausted }}</span>
                <span v-else-if="invite.expires_at && new Date() > new Date(invite.expires_at * 1000)" class="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">{{ t.expired }}</span>
                <span v-else class="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-medium">{{ t.valid }}</span>
                <div class="text-xs text-gray-400 mt-1" v-if="invite.expires_at">{{ t.expired }}: {{ formatDate(invite.expires_at) }}</div>
              </td>
              <td class="px-3 py-3 lg:px-6 lg:py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="deleteInvite(invite.code)" class="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="invites.length === 0" class="p-12 text-center">
        <div class="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900">{{ t.noInvites }}</h3>
        <p class="text-gray-500 mt-1">{{ t.createInviteTip }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  invites: { type: Array, required: true },
  t: { type: Object, required: true },
  formatDate: { type: Function, required: true },
  copyToClipboard: { type: Function, required: true },
  deleteInvite: { type: Function, required: true },
  openInviteModal: { type: Function, required: true }
});
</script>
