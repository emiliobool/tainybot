<script lang="ts" setup>
import { useAppStore } from "../stores/app";
const app = useAppStore();


const logFilePath = app.info?.logFilePath || "the log directory.";
const dbPath = app.info?.dbFilePath || "the db directory.";
const responseFilePath = app.info?.responseFilePath || "the response file directory.";

</script>

<template>
  <div class="overflow-hidden bg-slate-50 shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-base font-semibold leading-6 text-gray-900">tainybot v{{ app.info?.version }}</h3>
      <p class="mt-1 max-w-2xl text-sm text-gray-500">Free Twitch Bot Powered by ChatGPT</p>
    </div>
    <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
      <dl class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500">Developer</dt>
          <dd class="mt-1 text-sm text-gray-900">Emilio Bool</dd>
        </div>
        <div class="sm:col-span-1">
          <dt class="text-sm font-medium text-gray-500">Contact</dt>
          <dd class="mt-1 text-sm text-gray-900">contact@emiliobool.com</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-sm font-medium text-gray-500">About</dt>
          <dd class="mt-1 text-sm text-gray-900">
            Super easy to set up and use, completely free, and works on Windows and macOS. Set your own trigger word and
            let your viewers have fun chatting with the bot!



          </dd>
        </div>
      </dl>
    </div>

    <div class="border-t border-gray-200 px-4 py-5 sm:px-6">

      <dl class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <dt class="text-sm font-medium text-gray-500">Log Path: </dt>
          <dd class="mt-1 text-sm text-gray-900">
            {{ logFilePath }}
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-sm font-medium text-gray-500">DB Path: </dt>
          <dd class="mt-1 text-sm text-gray-900">
            {{ dbPath }}
          </dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-sm font-medium text-gray-500">Response File Path: </dt>
          <dd class="mt-1 text-sm text-gray-900">
            {{ responseFilePath }}
          </dd>
        </div>
      </dl>


    </div>

  </div>
</template>
  
 