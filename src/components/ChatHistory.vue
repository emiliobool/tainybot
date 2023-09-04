<script setup lang="ts">
import { CalendarIcon, MapPinIcon, PaperAirplaneIcon, UsersIcon } from '@heroicons/vue/20/solid'
import { onMounted, ref, watch, computed, watchEffect, nextTick } from 'vue';
import { useAppStore } from '../stores/app';
import { useSettingsStore } from '../stores/settings';
import DateTime from './DateTime.vue';

import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid'
import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxLabel,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/vue'



const app = useAppStore()
const settings = useSettingsStore()

const chatBoxRef = ref(null);

async function scrollToBottom() {
    await nextTick()
    if (chatBoxRef.value) {
        chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight;
    }
};


watchEffect(() => {
    if (app.contextMessages.length) {
        scrollToBottom();
    }
});

const messageInputRef = ref(null)
function focusInput() {
    messageInputRef.value?.focus()
}

onMounted(() => {
    scrollToBottom();
    focusInput();
});


const message = ref("")
const channel = ref("")

// const channels = computed(() => settings.channels.map((channel) => {
//     console.log("channel", channel)
//     return {
//         name: channel,
//         id: channel,
//     }
// }))

watchEffect(() => {
    if (!channel.value && settings.channels.length > 0) {
        channel.value = settings.channels[0]
    }
})


// const channelQuery = ref('')
// const filteredChannels = computed(() =>
//     channelQuery.value === ''
//         ? channels.value
//         : channels.value.filter((channel) => {
//             return channel.name.toLowerCase().includes(channelQuery.value.toLowerCase())
//         })
// )


const inputPlaceholder = computed(() => {
    if (app.connected) {
        return "Send a message as the bot. (Use twitch chat to interact with the bot)"
    } else {
        return "Click start to send a message as the bot"
    }
})



const sendEnabled = computed(() => message.value && message.value.length <= 500 && app.connected)

function sendMessage() {
    if (!sendEnabled.value) {
        return
    }
    if (settings.channels?.length === 0) {
        return
    }

    if (!channel.value) {
        channel.value = settings.channels[0]
    }

    // if channel.value not in settings.channels, set it to the first channel
    if (!settings.channels.includes(channel.value)) {
        channel.value = settings.channels[0]
    }

    if (!channel.value) {
        return
    }
    app.sendMessage(channel.value, message.value)
    message.value = ""
}

</script>

<template>
    <div class="flex flex-col h-full">
        <div v-if="!app.contextMessages.length"
            class=" text-2xl  text-slate-300 p-12 line flex h-full items-center justify-center">
            <div v-if="settings.missingSettings.length">
                <div class="p-4">
                    <p class="text-lg font-semibold mb-2">To start using the app, please follow these steps:</p>
                    <ol class="list-decimal list-inside text-base">
                        <li>Go to Settings and enter your ChatGPT and Twitch keys.</li>
                        <li>Click 'Start'.</li>
                        <li>Use the trigger word you set to interact with the bot in the selected chat.</li>
                    </ol>
                </div>
            </div>

            <div v-else>
                <div class="p-4">
                    <p class="text-lg font-semibold mb-2">The bot is ready!</p>
                    <ol class="list-decimal list-inside text-base">
                        <li>Now click start.</li>
                        <li>Go to your twitch channel </li>
                        <li>Use your trigger word to interact with the bot.</li>
                    </ol>
                </div>
            </div>


        </div>
        <div v-else class="h-full overflow-y-scroll" ref="chatBoxRef">

            <div class="overflow-hidden text-slate-300 shadow sm:rounded-md m-3">

                <ul role="list" class="divide-y divide-y-0 divide-slate-800">
                    <li v-for="message in app.contextMessages" :key="message.id">
                        <div :class="{
                            'bg-row1 text-row1text': message.role === 'user',
                            'bg-row2 text-row2text': message.role === 'assistant'
                        }">

                            <div class="p-3">
                                <div class="flex items-center justify-between">
                                    <div class="">

                                        <span class="mr-1" :class="{
                                            'text-row1name': message.role === 'user',
                                            'text-row2name': message.role === 'assistant'
                                        }">{{ message.role == 'assistant' ?
    settings.settings.username ?
        settings.settings.username
        : "BOT" : message.user }}:</span>
                                        {{ message.message }}
                                    </div>

                                    <div class="whitespace-nowrap ml-4">
                                        <DateTime :datetime="message.created_at" />
                                    </div>
                                </div>

                            </div>

                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <div class="flex">
            <!-- <div class="">

                                                                            <Combobox as="div" v-model="selectedChannel" class="h-14">
                                                                                <div class="relative h-14">
                                                                                    <ComboboxInput
                                                                                        class="h-14 w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                                                        @change="channelQuery = $event.target.value" :display-value="(channel) => channel?.name" />
                                                                                    <ComboboxButton
                                                                                        class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                                                                                        <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                                                    </ComboboxButton>

                                                                                    <ComboboxOptions v-if="filteredChannels.length > 0"
                                                                                        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                                                        <ComboboxOption v-for="channel in filteredChannels" :key="channel.id" :value="channel" as="template"
                                                                                            v-slot="{ active, selected }">
                                                                                            <li
                                                                                                :class="['relative cursor-default select-none py-2 pl-3 pr-9', active ? 'bg-indigo-600 text-white' : 'text-gray-900']">
                                                                                                <span :class="['block truncate', selected && 'font-semibold']">
                                                                                                    {{ channel.name }}
                                                                                                </span>

                                                                                                <span v-if="selected"
                                                                                                    :class="['absolute inset-y-0 right-0 flex items-center pr-4', active ? 'text-white' : 'text-indigo-600']">
                                                                                                    <CheckIcon class="h-5 w-5" aria-hidden="true" />
                                                                                                </span>
                                                                                            </li>
                                                                                        </ComboboxOption>
                                                                                    </ComboboxOptions>
                                                                                </div>
                                                                            </Combobox>

                                                                        </div> -->
            <div>
                <select v-if="settings.channels.length > 1"
                    class="w-full border border-gray-300 shadow-sm pr-9 py-3 px-3 text-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    <option v-for="channel in settings.channels" :key="channel" :value="channel">
                        {{ channel }}
                    </option>
                </select>
            </div>
            <div class="relative flex-grow">
                <input type="text"
                    class="w-full border border-gray-300 shadow-sm py-3 px-3 text-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    ref="messageInputRef" :placeholder="inputPlaceholder" v-model="message" @keyup.enter="sendMessage"
                    :class="{
                        'bg-gray-300': !app.connected,
                        'bg-white': app.connected,
                        'bg-red-300': message.length > 500,
                    }" />

                <div class="absolute top-4 right-12">
                    <!-- maximum 500 characters -->
                    <p class=" text-gray-400 text-right mr-2">{{ message.length }}/500</p>
                </div>
                <!-- submit icon -->
                <PaperAirplaneIcon class="absolute right-2 top-3 h-8 w-8 text-gray-400 hover:text-gray-500 cursor-pointer"
                    :class="{
                        'text-indigo-500': sendEnabled
                    }" @click="sendMessage" />
            </div>

        </div>
    </div>
</template>

<style>
/* Hide the scrollbar until the user hovers over the chatbox */
.overflow-y-scroll::-webkit-scrollbar {
    width: 0.7rem;
    background-color: transparent;
}

.overflow-y-scroll:hover::-webkit-scrollbar {
    width: 0.7rem;
    /* background-color: #F3F4F6; */
}

/* Style the scrollbar */
.overflow-y-scroll::-webkit-scrollbar-thumb {
    background-color: #A5B4FC;
    border-radius: 1rem;
}

.overflow-y-scroll:hover::-webkit-scrollbar-thumb {
    background-color: #7C3AED;
}

/* Scroll to the last message in the chatbox */
.chatbox-scroll {
    scroll-behavior: smooth;
}
</style>