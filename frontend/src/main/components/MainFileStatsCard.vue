<template>
  <div v-if="currentView === 'files'" class="glass-panel rounded-2xl shadow-sm p-4 hidden lg:block">
    <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">{{ t.storageInfo }}</h3>
    <div class="grid grid-cols-2 gap-2">
      <div class="bg-gray-50 p-2 rounded-xl">
        <div class="text-xl font-bold text-gray-800">{{ files.length }}</div>
        <div class="text-xs text-gray-500">{{ t.totalFiles }}</div>
      </div>
      <div class="bg-gray-50 p-2 rounded-xl">
        <div class="text-xl font-bold text-gray-800">{{ formatSize(files.reduce((acc, file) => acc + file.size, 0)) }}</div>
        <div class="text-xs text-gray-500">{{ t.totalSize }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentView: { type: String, required: true },
  t: { type: Object, required: true },
  files: { type: Array, required: true },
  formatSize: { type: Function, required: true }
});
</script>
