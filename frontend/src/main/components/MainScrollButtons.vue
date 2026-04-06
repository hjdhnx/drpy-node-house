<template>
  <div v-if="user && user.show_scroll_buttons === 1" class="fixed bottom-4 right-4 flex flex-col gap-2 z-30 pointer-events-auto">
    <button @click="scrollToTop()" class="w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg border border-white/50 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all hover:scale-105" :title="t.backToTop">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
    <button @click="scrollToBottom()" class="w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg border border-white/50 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all hover:scale-105" :title="t.backToBottom">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  user: { type: Object, default: null },
  t: { type: Object, required: true },
  scrollToTop: { type: Function, required: true },
  scrollToBottom: { type: Function, required: true }
});
</script>
