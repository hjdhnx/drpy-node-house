<template>
  <div v-show="currentView === 'files'" class="lg:col-span-8 lg:h-full lg:overflow-hidden flex-1 min-h-0 flex flex-col lg:h-full">
    <div class="glass-panel rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <MainFilesToolbar />
      <MainFilesTable />
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';
import MainFilesToolbar from './MainFilesToolbar.vue';
import MainFilesTable from './MainFilesTable.vue';

const {
  currentView
} = inject('mainApp');
</script>
