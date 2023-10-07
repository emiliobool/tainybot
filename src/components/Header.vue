<script setup lang="ts">
import {
  CircleStackIcon,
  Cog6ToothIcon,
  PlayIcon,
  SignalIcon,
  StopIcon,
  WifiIcon,
XMarkIcon,
} from '@heroicons/vue/20/solid'
import { useSettingsStore } from '../stores/settings'
import { useAppStore } from '../stores/app';
import { computed } from 'vue';

const settings = useSettingsStore()
const app = useAppStore()
const openSettings = settings.openSettings
const closeSettings = settings.closeSettings

function start(){
  // 
  if(settings.missingSettings.length){
    app.openConnectPopup()
    return
  }
  app.connect()

}

const tokens = computed(() => {
  //divide by 1000 to get kTokens and format to 1 decimal places with "k" suffix but ommit decimal if 0
  const kTokens = (app.sessionTokens / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + "k" 

  return kTokens
})

</script>

<template>
  <div class="text-tertiary p-3 flex items-center justify-between" :class="{
    'bg-green-500': app.connected,
    'bg-slate-600': !app.connected,
    'text-slate-500': !app.connected,
    'text-green-900': app.connected,
  }">
    <div class="min-w-0 flex-1">
      <div class="flex ">
        <h2 class="text-lg leading-7sm:truncate tracking-tight" :class="{
          // 'text-green-800': app.connected,
        }">
          t<span class="text-xl font-bold">ai</span>nybot
        </h2>
        <div class="flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
          <div class="flex items-center text-sm ml-4">
            <CircleStackIcon class="mr-1.5 h-5 w-5 flex-shrink-0 " aria-hidden="true" />
            {{ tokens }} tokens used this session
          </div>
          <div class="flex items-center text-sm " :class="{
            // 'text-green-900': app.connected,
          }">
            <div v-if="app.connected" class="">
              <SignalIcon class="mr-1.5 h-5 w-5 flex-shrink-0 " aria-hidden="true" />
            </div>
            <div v-else class="">
              <WifiIcon class="mr-1.5 h-5 w-5 flex-shrink-0 " aria-hidden="true" />
            </div>
            {{ app.status }}
          </div>

        </div>
      </div>
    </div>
    <div class="mt-0 flex">
      <span class="">
        <button type="button" v-if="!app.connected" @click="start" class="inline-flex items-center rounded-md ring-2 ring-green-500 bg-green-400 px-3 py-2 text-sm font-semibold shadow-sm 
             hover:bg-green-300">
          <PlayIcon class="-ml-0.5 mr-1.5 h-5 w-5 " aria-hidden="true" />
          Start
        </button>
        <button type="button" v-if="app.connected" @click="app.disconnect"
          class="inline-flex items-center rounded-md bg-red-300 px-3 py-2 ring-2 ring-red-500 text-sm font-semibold shadow-sm  hover:bg-red-500">
          <StopIcon class="-ml-0.5 mr-1.5 h-5 w-5 " aria-hidden="true" />
          Stop
        </button>
      </span>

      <span class="ml-3">
        <button v-if="!settings.open" type="button" @click="openSettings"
          class="ring-2 ring-slate-300
          inline-flex items-center rounded-md bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm  ring-inset  hover:bg-slate-200">
          <Cog6ToothIcon class="-ml-0.5 mr-1.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          Settings
        </button>

        <button v-if="settings.open" type="button" @click="closeSettings"
          class="
          ring-2 ring-slate-300
          inline-flex items-center rounded-md bg-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm  ring-inset  hover:bg-slate-200">
          <XMarkIcon class="-ml-0.5 mr-1.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          Close
        </button>
      </span>

    </div>
  </div>
</template>

