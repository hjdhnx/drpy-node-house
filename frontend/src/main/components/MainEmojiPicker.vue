<template>
  <div v-if="showEmojiPicker" class="fixed inset-0 z-[60]" @click="showEmojiPicker = false">
    <div
      class="absolute bg-white rounded-xl shadow-2xl border border-gray-100 p-2 w-72 max-h-80 overflow-y-auto flex flex-wrap gap-1 content-start"
      :style="emojiPickerStyle"
      @click.stop
    >
      <button
        v-for="emoji in emojis"
        :key="emoji"
        @click="insertEmoji(emoji)"
        class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-xl transition-colors cursor-pointer"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const { showEmojiPicker, emojiPickerStyle, emojis, insertEmoji } = inject('mainApp');
</script>
