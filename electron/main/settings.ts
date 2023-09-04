// update token usage in data
// update session usage in data 

import * as db from "./db"
import * as ui from "./ui"
import { EventEmitter } from 'node:events';
import { ipcMain } from "electron";

let settings = {}

export async function init() {
    await loadSettings()
}

function getFloat(value, defaultValue) {
    try {
        const result = parseFloat(value)
        if (isNaN(result)) return defaultValue
        return result
    } catch (e) {
        return defaultValue
    }
}

function getInt(value, defaultValue) {
    try {
        const result = parseInt(value)
        if (isNaN(result)) return defaultValue
        return result
    } catch (e) {
        return defaultValue
    }
}

function getBool(value, defaultValue) {
    if (value === null || value === undefined) return defaultValue
    if (value === '1') return true
    if (value === '0') return false
    if (value === 'true') return true
    if (value === 'false') return false
    return !!value
}

function getArray(value, defaultValue) {
    if (value === null || value === undefined) return defaultValue
    return value.split(',')
}

ipcMain.on('settings:load', async (event, arg) => {
    console.log('<settings:load')
    const settings = await loadSettings()
    event.reply('settings:loaded', settings); // sends a message back to the renderer
});

ipcMain.on('settings:save', async (event, partialSettings) => {
    console.log('<settings:save', partialSettings)
    await savePartialSettings(partialSettings)
    const settings = await loadSettings()
    event.reply('settings:loaded', settings); // sends a message back to the renderer
});


function formatSetting(key, value) {
    let result = value
    switch (key) {
        case 'openai_temperature': // 0.0 to 2.0 - 0.2 less random and more deterministic
            result = getFloat(value, 1.0)
            break;
        case 'openai_top_p': // either temperature or top_p but not both, lower is higher probability mass,
            // 0.1 is top 10%
            result = getFloat(value, 1.0)
            break;
        case 'openai_presence_penalty': // -2.0 to 2.0 possitive means talk about something else
            result = getFloat(value, 0.0)
            break;
        case 'openai_frequency_penalty': // -2.0 to 2.0 possitive means not repeat itself
            result = getFloat(value, 0.0)
            break;
        case 'openai_max_tokens':
            result = getInt(value, 4096)
            break;
        case 'data_refresh_interval':
            result = getInt(value, 30)
            break;
        case 'max_context_messages':
        case 'global_cooldown':
        case 'user_cooldown':
            result = getInt(value, 0)
            break;
        // logit bias could be used later to make it talk like naruto
        case 'permissions_user':
        case 'permissions_mod':
        case 'permissions_broadcaster':
        case 'permissions_vip':
        case 'permissions_subscriber':
        case 'send_to_twitch_chat':
        case 'send_to_text_file':
            result = getBool(value, true)
            break;
        case 'channels':
        case 'openai_api_key':
        case 'twitch_access_token':
        case 'twitch_client_id':
        case 'twitch_client_secret':
        case 'system_message':
        case 'trigger_word':
        case 'username':
        default:
    }
    return result
}
export async function loadSettings() {
    const dbSettings = await db.getSettings()
    settings = {
        model: "gpt-3.5-turbo",
        openai_temperature: 1.0,
        openai_top_p: 1.0,
        openai_presence_penalty: 0.0,
        openai_frequency_penalty: 0.0,
        openai_max_tokens: 4096,
        channels: '',
        username: '',
        openai_api_key: '',
        twitch_access_token: '',
        twitch_client_id: 'gp762nuuoqcoxypju8c569th9wz7q5',
        twitch_client_secret: '',
        system_message: `You are {{ bot_username }}, a chatbot moderator of the twitch chat for the current stream: {{ channel_name }}.

The stream description is {{ channel_description }}.
The current date at the moment my message was sent is {{ current_date }}, and the time is {{ current_time }}, 
The current game is {{ current_game }}.
The current stream title is {{ channel_title }}.
The stream tags are: {{ channel_tags }}.
The current stream language is {{ channel_language }}.
You are in a chat conversation with me, the user "{{ username }}" in twitch chat.
My username color is {{ user.color }} 
{% if user.badges.broadcaster == '1' %}I'm the broadcaster.{% endif %}
{% if user.vip == '1' %}I am a VIP.{% endif %}
{% if user.subscriber %}I am a subscriber.{% endif %}
{% if user.mod %}I am a moderator.{% endif %}
{% if user['first-msg'] %}This is my first message, please welcome me to the community. {% endif %}
You always answer as concisely as possible in the language you are being spoken with. 
Your messages must be 500 characters or less.
`,
        trigger_word: '',
        max_context_messages: 1,
        data_refresh_interval: 30,
        global_cooldown: 0,
        user_cooldown: 0,
        permissions_user: true, 
        permissions_mod: true,
        permissions_broadcaster: true,
        permissions_vip: true,
        permissions_subscriber: true,
        preprocess_message: '{{ message }}',
        postprocess_message: '{{ message }}',
        send_to_twitch_chat: true,
        send_to_text_file: true,
        // split_message: '',
    }
    ui.send('settings:default', settings)
    for (const key in dbSettings) {
        settings[key] = formatSetting(key, dbSettings[key])
    }
    emitter.emit('settings:loaded', settings)
    ui.send('settings:loaded', settings)
    return settings

}
export function getSettings() {
    return settings
}


export function get(key) {
    return settings[key]
}

export async function set(key, value) {
    settings[key] = value
    await db.setSetting(key, value)
    await loadSettings()
}

export const emitter = new EventEmitter()

export async function savePartialSettings(partialSettings) {
    const results = []
    for (const key in partialSettings) {
        results.push(await db.setSetting(key, partialSettings[key]))
    }
    await loadSettings()
    for (const key in partialSettings) {
        emitter.emit(`settings-changed:${key}`, settings[key])
    }
    return results
}

