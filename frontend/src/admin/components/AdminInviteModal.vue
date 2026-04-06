<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100" @click.stop>
        <div class="p-6 border-b border-gray-100">
          <h3 class="text-xl font-bold text-gray-800">{{ t.generateInvite }}</h3>
          <p class="text-sm text-gray-500 mt-1">{{ t.setLimits }}</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ t.maxUses }}</label>
            <input type="number" v-model.number="inviteForm.max_uses" class="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50" min="0">
            <p class="text-xs text-gray-500 mt-2">{{ t.unlimitedUses }}</p>
          </div>
        </div>
        <div class="p-6 bg-gray-50 flex justify-end space-x-3">
          <button @click="close" class="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors">{{ t.cancel }}</button>
          <button @click="createInvite" :disabled="loading" class="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center">
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ t.generate }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  show: { type: Boolean, required: true },
  inviteForm: { type: Object, required: true },
  loading: { type: Boolean, required: true },
  t: { type: Object, required: true },
  createInvite: { type: Function, required: true },
  close: { type: Function, required: true }
});
</script>
