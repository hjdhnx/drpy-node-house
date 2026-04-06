<template>
  <div v-if="message" class="fixed bottom-4 right-4 z-[60]">
    <div class="bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl shadow-black/20 flex items-center space-x-3 min-w-[280px]">
      <div class="w-8 h-8 rounded-full bg-green-500/20 text-green-300 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p class="text-sm">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' }
});
</script>
