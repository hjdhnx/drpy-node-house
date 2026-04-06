<template>
  <div v-if="currentView === 'forum'" class="lg:col-span-8 lg:h-full lg:overflow-hidden overflow-hidden flex flex-col gap-4 flex-1 min-h-0 h-full relative">
    <MainForumListPanel v-show="!currentTopic" />
    <MainForumDetailPanel v-if="currentTopic" />
  </div>
</template>

<script setup>
import { inject } from 'vue';
import MainForumListPanel from './MainForumListPanel.vue';
import MainForumDetailPanel from './MainForumDetailPanel.vue';

const {
  currentView,
  currentTopic
} = inject('mainApp');
</script>
