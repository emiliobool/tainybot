<script setup>

import { openLink } from '../stores/app'
import { computed, ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import DangerZone from './DangerZone.vue'

const settings = useSettingsStore()

function getModel(key, trim = false) {
    return computed({
        get: () => settings.editingSettings[key],
        set: (value) => {
            if (trim) {
                settings.editingSettings[key] = String(value).trim()
            } else {
                settings.editingSettings[key] = value
            }
        }
    })
}


const openai_api_key = getModel('openai_api_key', true)
const twitch_access_token = getModel('twitch_access_token', true)
const system_message = getModel('system_message')
const model = getModel('model', true)
const postprocess_message = getModel('postprocess_message')
const preprocess_message = getModel('preprocess_message')
const username = getModel('username', true)
const channels = getModel('channels')
const trigger_word = getModel('trigger_word')
const user_cooldown = getModel('user_cooldown')
const global_cooldown = getModel('global_cooldown')
const max_context_messages = getModel('max_context_messages')
const permissions_user = getModel('permissions_user')
const permissions_mod = getModel('permissions_mod')
const permissions_broadcaster = getModel('permissions_broadcaster')
const permissions_vip = getModel('permissions_vip')
const permissions_subscriber = getModel('permissions_subscriber')
const send_to_text_file = getModel('send_to_text_file')
const send_to_twitch_chat = getModel('send_to_twitch_chat')

function resetContext() {
    system_message.value = settings.defaultSettings.system_message
}
function resetModel() {
    model.value = settings.defaultSettings.model
}

function resetPostprocess() {
    postprocess_message.value = settings.defaultSettings.postprocess_message
}

function resetPreprocess() {
    preprocess_message.value = settings.defaultSettings.preprocess_message
}



const showAdvanced = ref(false)
function toggleAdvanced() {
    showAdvanced.value = !showAdvanced.value
}




</script>

<template>
    <div class="divide-y divide-gray-200 bg-slate-50 shadow sm:rounded-lg">
        <div class="py-6 px-4 sm:p-6 lg:pb-8">
            <div>
                <h2 class="text-lg font-medium leading-6 text-gray-900">Settings</h2>
                <p class="mt-1 text-sm text-gray-500"></p>
            </div>

            <div class="mt-6 flex flex-col lg:flex-row">
                <div class="flex gap-6">
                    <div class="">
                        <label for="openai_api_key" class="block text-sm font-medium leading-6 text-gray-900">OpenAI API
                            Key*</label>
                        <input type="password" v-model="openai_api_key" name="openai_api_key" placeholder="sk-..."
                            id="openai_api_key"
                            class="mt-2 block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:border-0 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6" />
                        <p class="mt-2 text-xs text-gray-500">
                            Create an account if you don't have one and go to
                            <a href="" @click.prevent="() => openLink('https://platform.openai.com/account/api-keys')"
                                class="text-blue-500">https://platform.openai.com/account/api-keys</a>
                            to obtain your API Key.
                        </p>
                    </div>

                    <div class="">
                        <label for="twitch_access_token" class="block text-sm font-medium leading-6 text-gray-900">Twitch
                            Bot Access Token*</label>
                        <input type="password" v-model="twitch_access_token" name="twitch_access_token"
                            id="twitch_access_token" placeholder="abc..."
                            class="mt-2 block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:border-0 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6" />
                        <p class="mt-2 text-xs text-gray-500">
                            The access token for the Twitch account you want to act as a bot.
                            You can get one here
                            <a class="text-blue-500" href=""
                                @click.prevent="() => openLink('https://twitchtokengenerator.com/')">https://twitchtokengenerator.com/</a>
                        </p>
                    </div>
                </div>
            </div>

            <div class="mt-6 grid grid-cols-12 gap-6">
                <div class="col-span-12 sm:col-span-6">
                    <label for="username" class="block text-sm font-medium leading-6 text-gray-900">Twitch Bot
                        Username*</label>
                    <input type="text" name="username" id="username" v-model="username" placeholder="username"
                        class="mt-2 block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:border-0 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6" />

                    <p class="mt-2 text-xs text-gray-500">Username of the twitchbot</p>
                </div>

                <div class="col-span-12 sm:col-span-6">
                    <label for="channels" class="block text-sm font-medium leading-6 text-gray-900">Twitch Channel*</label>
                    <input type="text" name="channels" id="channels" v-model="channels" placeholder="channel"
                        class="mt-2 block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:border-0 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6" />

                    <p class="mt-2 text-xs text-gray-500">
                        Twitch Channel to connect to.
                    </p>
                </div>

                <div class="col-span-12 sm:col-span-6">
                    <label for="trigger_word" class="block text-sm font-medium leading-6 text-gray-900">Trigger
                        Word*</label>
                    <input type="text" name="trigger_word" id="trigger_word" autocomplete="family-name"
                        v-model="trigger_word" placeholder="@username"
                        class="mt-2 block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:border-0 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6" />
                    <p class="mt-2 text-xs text-gray-500">
                        The word that will trigger the AI to respond. "@username"
                        recommended.
                    </p>
                </div>

                <div class="col-span-12 sm:col-span-3">
                    <!-- cooldowns -->
                    <label for="cooldown" class="block text-sm font-medium leading-6 text-gray-900">Global Cooldown
                    </label>
                    <input type="number" name="cooldown" id="cooldown" v-model="global_cooldown"
                        class="mt-2 block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:border-0 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6" />
                    <p class="mt-2 text-xs text-gray-500">
                        The global cooldown between messages in seconds.
                    </p>
                </div>
                <div class="col-span-12 sm:col-span-3">
                    <label for="cooldown" class="block text-sm font-medium leading-6 text-gray-900">User Cooldown
                    </label>
                    <input type="number" name="cooldown" id="cooldown" v-model="user_cooldown"
                        class="mt-2 block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:border-0 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6" />
                    <p class="mt-2 text-xs text-gray-500">
                        The user cooldown between messages in seconds.
                    </p>
                </div>
            </div>
            <div class="mb-2 mt-6">
                <span>Permissions</span>
            </div>
            <div class="sm:flex">

                <!-- checkboxes -->
                <div class="flex-grow flex items-start">
                    <div class="">
                        <input id="permissions_user" name="permissions_user" type="checkbox" v-model="permissions_user"
                            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                    </div>
                    <div class="ml-3 text-sm leading-6">
                        <label for="permissions_user" class="font-medium text-gray-900">User</label>
                    </div>
                </div>

                <div class="flex-grow flex items-start">
                    <div class="">
                        <input id="permissions_subscriber" name="permissions_subscriber" type="checkbox"
                            v-model="permissions_subscriber"
                            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                    </div>
                    <div class="ml-3 text-sm leading-6">
                        <label for="permissions_subscriber" class="font-medium text-gray-900">Sub</label>
                    </div>
                </div>

                <div class="flex-grow flex items-start">
                    <div class="">
                        <input id="permissions_vip" name="permissions_vip" type="checkbox" v-model="permissions_vip"
                            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                    </div>
                    <div class="ml-3 text-sm leading-6">
                        <label for="permissions_vip" class="font-medium text-gray-900">VIP</label>
                    </div>
                </div>


                <div class="flex-grow flex items-start">
                    <div class="">
                        <input id="permissions_mod" name="permissions_mod" type="checkbox" v-model="permissions_mod"
                            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                    </div>
                    <div class="ml-3 text-sm leading-6">
                        <label for="permissions_mod" class="font-medium text-gray-900">Mod</label>
                    </div>
                </div>


            </div>
            <div>
                <div>
                    <button class="text-sm rounded bg-slate-400 px-2 py-1 float-right text-slate-100" @click="resetContext">
                        Reset
                    </button>
                    <label for="system" class="block text-sm font-medium leading-6 text-gray-900 mt-4">System Context
                    </label>
                </div>
                <div class="mt-2">
                    <textarea id="system" name="system" rows="3" v-model="system_message"
                        class="min-h-[300px] mt-1 block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:py-1.5 sm:text-sm sm:leading-6" />
                </div>
                <p class="mt-2 text-xs text-gray-500">
                    Instructions on how the AI should behave. Uses nunjucks templating.
                </p>
            </div>

            <!-- advanced section toggle -->
            <div class="mt-6">
                <button class="text-sm rounded bg-slate-400 px-2 py-1 float-right text-slate-100" @click="toggleAdvanced">
                    Advanced
                </button>
                <label for="system" class="block text-sm font-medium leading-6 text-gray-900 mt-4">Advanced Settings
                </label>
            </div>
            <div v-if="showAdvanced">



                <div class="mb-2 mt-6">
                    <span class="text-md">Send response to:</span>
                </div>

                <div class="sm:flex">
                    <!-- checkboxes -->
                    <div class="flex-grow flex items-start">
                        <div class="">
                            <input id="send_to_twitch_chat" name="send_to_twitch_chat" type="checkbox"
                                v-model="send_to_twitch_chat"
                                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                        </div>
                        <div class="ml-3 text-sm leading-6">
                            <label for="send_to_twitch_chat" class="font-medium text-gray-900">Twitch Chat</label>
                        </div>
                    </div>

                    <div class="flex-grow flex items-start">
                        <div class="">
                            <input id="send_to_text_file" name="send_to_text_file" type="checkbox"
                                v-model="send_to_text_file"
                                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                        </div>
                        <div class="ml-3 text-sm leading-6">
                            <label for="send_to_text_file" class="font-medium text-gray-900">Text File</label>
                        </div>
                    </div>
                </div>




                <!--  pick model -->
                <div class="mt-6 grid grid-cols-12 gap-6">
                    <div class="flex col-span-12 sm:col-span-6">
                        <div class="flex-grow">
                            <button class="float-right rounded bg-slate-400 py-1 px-2 text-sm text-slate-100"
                                @click="resetModel">
                                Reset
                            </button>
                            <label for="model" class="block text-sm font-medium leading-6 text-gray-900">Model*</label>

                            <input type="text" name="model" id="model" v-model="model" placeholder="model"
                                class="mt-2 block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:border-0 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6" />

                            <p class="mt-2 text-xs text-gray-500">
                                Name of the model to use. Warning: Different models have
                                different costs, some of them can become expensive.
                            </p>
                        </div>
                    </div>
                    <div class="col-span-12 sm:col-span-6">
                        <label for="max_context_messages" class="block text-sm font-medium leading-6 text-gray-900">
                            Max Context History</label>
                        <input type="number" name="max_context_messages" id="max_context_messages"
                            autocomplete="family-name" v-model="max_context_messages"
                            class="mt-2 block w-full rounded-md border-0 px-3 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:border-0 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6" />
                        <p class="mt-2 text-xs text-gray-500">
                            How many previous messages from the same user to feed to the AI.
                        </p>
                    </div>
                </div>

                <div>
                    <div>
                        <button class="text-sm rounded bg-slate-400 px-2 py-1 float-right text-slate-100"
                            @click="resetPreprocess">
                            Reset
                        </button>
                        <label for="preprocess_message" class="block text-sm font-medium leading-6 text-gray-900 mt-4">
                            Pre Process
                        </label>
                    </div>
                    <div class="mt-2">
                        <textarea id="preprocess_message" name="preprocess_message" rows="3" v-model="preprocess_message"
                            class="min-h-[100px] mt-1 block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:py-1.5 sm:text-sm sm:leading-6" />
                    </div>
                    <p class="mt-2 text-xs text-gray-500">
                        Modify the message before sending it to the AI. Uses nunjucks templating.
                    </p>
                </div>



                <div>
                    <div>
                        <button class="text-sm rounded bg-slate-400 px-2 py-1 float-right text-slate-100"
                            @click="resetPostprocess">
                            Reset
                        </button>
                        <label for="postprocess_message" class="block text-sm font-medium leading-6 text-gray-900 mt-4">Post
                            Process
                        </label>
                    </div>



                    <div class="mt-2">
                        <textarea id="postprocess_message" name="postprocess_message" rows="3" v-model="postprocess_message"
                            class="min-h-[100px] mt-1 block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:py-1.5 sm:text-sm sm:leading-6" />
                    </div>
                    <p class="mt-2 text-xs text-gray-500">
                        Modify the message before sending it to twitch. Uses nunjucks templating.
                    </p>
                </div>

                <DangerZone />
            </div>


        </div>
    </div>
</template>
