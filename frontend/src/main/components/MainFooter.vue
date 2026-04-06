<template>
  <footer class="mt-8 pt-4 pb-2 text-center text-[13px] leading-6 text-gray-400 flex-shrink-0" :class="{ 'hidden lg:block': currentView === 'chat' }">
    <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
      <span class="whitespace-nowrap">{{ siteInfo.copyright || 'Copyright © 2026 Drpy Node House. All Rights Reserved.' }}</span>
      <span v-if="siteInfo.icp" class="hidden md:inline text-gray-300">|</span>
      <span v-if="siteInfo.icp" class="whitespace-nowrap">{{ siteInfo.icp }}</span>
    </div>
  </footer>
</template>

<script setup>
defineProps({
  currentView: { type: String, required: true },
  t: { type: Object, required: true },
  siteInfo: { type: Object, required: true }
});
</script>
