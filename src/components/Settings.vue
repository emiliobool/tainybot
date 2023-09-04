<script setup lang="ts">
import { computed, ref } from 'vue'

import { useSettingsStore } from '../stores/settings'
import { openLink } from '../stores/app'
import { ChatBubbleBottomCenterIcon, Cog6ToothIcon, Square3Stack3DIcon } from '@heroicons/vue/20/solid';
import Logs from './Logs.vue';
import About from './About.vue';
import SettingsForm from './SettingsForm.vue';

const settings = useSettingsStore()

function cancel() {
    settings.closeSettings()
}

function save() {
    settings.saveSettings()
}

const navigation = ref([
    { name: 'Settings', icon: Cog6ToothIcon, current: true },
    { name: 'Logs', icon: Square3Stack3DIcon, current: false },
    { name: 'About', icon: ChatBubbleBottomCenterIcon, current: false },
])

const currentItem = computed(() => {
    return navigation.value.find((item) => item.current)
})

const settingsVisible = computed(() => {
    return currentItem.value.name === 'Settings'
})

const logsVisible = computed(() => {
    return currentItem.value.name === 'Logs'
})

const aboutVisible = computed(() => {
    return currentItem.value.name === 'About'
})

function handleChangeSection(item) {
    navigation.value.forEach((item) => {
        item.current = false
    })
    item.current = true
}



</script>

<template>
    <div class="flex flex-col h-full ">

        <main class="h-full overflow-hidden">
            <div class="md:grid md:grid-cols-12 md:gap-x-4 h-full flex-grow overflow-y-scroll md:overflow-y-auto">
                <aside class="md:col-span-2 p-3 md:pr-0">
                    <nav class="space-y-1 flex md:flex-col">
                        <a v-for="item in navigation" :key="item.name" @click="handleChangeSection(item)"
                            :class="[item.current ? 'bg-slate-700 text-indigo-400 ' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-200', 'group flex items-center rounded-md px-3 py-2 text-sm font-medium']"
                            :aria-current="item.current ? 'page' : undefined">
                            <component :is="item.icon"
                                :class="[item.current ? 'text-indigo-500 group-hover:text-indigo-500' : 'text-gray-400 group-hover:text-gray-500', '-ml-1 mr-3 h-6 w-6 flex-shrink-0']"
                                aria-hidden="true" />
                            <span class="truncate">{{ item.name }}</span>
                        </a>
                    </nav>
                </aside>

                <div class="space-y-6 md:col-span-10 pt-0 p-3 pr-1 overflow-y-scroll md:pt-3 md:pl-0 md:pr-3">


                    <div class="mx-auto max-w-screen-xl h-full">

                        <div class="overflow-hidden rounded-lg shadow w-full min-h-full pb-4

                                                                                    ">
                            <div v-if="settingsVisible" class="divide-y divide-gray-200 lg:grid lg:divide-y-0 lg:divide-x">

                                <SettingsForm />

                            </div>
                            <div v-if="logsVisible">
                                <Logs />
                            </div>
                            <div v-if="aboutVisible">
                                <About />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
        <div v-if="settingsVisible" class="divide-y divide-x-2 divide-slate-600 w-full bg-slate-900">

            <div class="flex justify-end gap-x-3 py-4 px-4 sm:px-6">
                <button type="button"
                    class="inline-flex justify-center rounded-md bg-white py-2 px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    @click="cancel">Cancel</button>

                <button type="submit"
                    class="inline-flex justify-center rounded-md py-2 px-3 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
                    :class="{
                        'bg-sky-700': settings.changed,
                        'bg-gray-400': !settings.changed,
                        'hover:bg-sky-600': settings.changed,
                    }" :disabled="!settings.changed" @click="save">Save</button>
            </div>
        </div>
    </div>
</template>
  
