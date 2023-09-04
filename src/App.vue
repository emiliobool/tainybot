<script setup lang="ts">
import Header from './components/Header.vue';
import ChatHistory from './components/ChatHistory.vue';
import ConnectPopup from './components/ConnectPopup.vue';
import Settings from './components/Settings.vue';
import { useSettingsStore } from './stores/settings';
import { useAppStore } from './stores/app';
// import { useAppStore } from './stores/app';
const app = useAppStore();
const settings = useSettingsStore();


</script>

<template>
  <div class="h-full  bg-tertiary">
    <div class="h-full flex flex-col">
      <Header class="w-full" />
      <div v-if="settings.open" class="flex-grow overflow-hidden">
        <Settings />
      </div>
      <div v-else class="flex-grow overflow-hidden">
        <ChatHistory />
      </div>
    </div>
  </div>
  <ConnectPopup />
</template>

<style></style>
