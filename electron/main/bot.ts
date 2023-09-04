import { EventEmitter } from 'node:events';
// import { Client } from '@twitchapis/twitch.js'
import * as db from './db';
import * as openai from './openai';
import * as settings from './settings';
import * as ui from './ui';
import { ipcMain } from 'electron';
import nunjucks from 'nunjucks';
import tmi from 'tmi.js';
import { DateTime } from 'luxon';
// import log from 'electron-log';
import { customLog } from './customLog'

import { app } from 'electron';
import path from 'path'

import fs from 'fs'

const userDataPath = app.getPath('userData');
const responseFilePath = path.join(userDataPath, 'response.txt');

export function getResponseFilePath() {
    return responseFilePath
}

// nunjucks.configure({ autoescape: false, trimBlocks: true });
const env = new nunjucks.Environment(null, {
    autoescape: false,
    trimBlocks: true,
});


env.addFilter('object', function (obj) {
    // if obj is a string return as is 
    if (typeof obj === 'string') return obj
    // if obj is an object return its keys and values in the format: key: value, 
    if (typeof obj === 'object') {
        return Object.keys(obj).map(key => `${key}: ${obj[key]}`).join(', ')
    }
});

env.addFilter('regexReplace', function (str, pattern, replacement, flags = 'gi') {
    const regex = new RegExp(pattern, flags);
    return str.replace(regex, replacement);
});

export async function init() {
    // start polling for current game, stream status 
    // reset session tokens
    await resetSessionTokens()

}


// async function login() {
//     console.log("Logging in with ", settings.get('twitch_access_token'))
//     // await client.login(settings.get('twitch_access_token'));
//     emitter.emit('status:update', 'connected')
// }




let client = null


async function helixGet(path) {
    const twitch_access_token = settings.get('twitch_access_token')
    const twitch_client_id = settings.get('twitch_client_id')

    const response = await fetch(`https://api.twitch.tv/helix/${path}`, {
        headers: {
            'Client-Id': twitch_client_id,
            'Authorization': `Bearer ${twitch_access_token}`
        }
    })
        .then(response => response.json())

    if (response.error) {
        throw new Error(response.error + ':' + response.message)
    }

    return response

}

async function getUserInfo(channelName) {
    const response = await helixGet(`users?login=${channelName}`)
    return response.data[0]
}

async function getChannelInfo(channelId) {
    const response = await helixGet(`channels?broadcaster_id=${channelId}`)
    // console.log("response", response)
    return response.data[0]

}

let channel = ""
let channelUserInfo = null
let interval = null
let channelInfo = null

function onConnected(address, port) {
    console.log(`* Connected to ${address}:${port}`);
    customLog('info', `* Connected to ${address}:${port}`);
    emitter.emit('status:update', 'connected')
}

function onConnecting(address, port) {
    console.log(`* Connecting to ${address}:${port}`);
    customLog('info', `* Connecting to ${address}:${port}`);
    emitter.emit('status:update', 'connecting')
}
function onDisconnected(reason) {
    console.log(`* Disconnected: ${reason}`);
    customLog('info', `* Disconnected: ${reason}`);
    emitter.emit('status:update', 'disconnected')
}


const cooldowns = {
    global: {
        lastUsed: null,
    },
    users: new Map(),
};
function isOnGlobalCooldown() {
    const lastUsed = cooldowns.global.lastUsed;
    const duration = settings.get('global_cooldown') * 1000;
    // console.log("Global lastUsed", lastUsed, duration)
    if (lastUsed && Date.now() - lastUsed < duration) {
        return true;
    }
    return false;
}

function isOnUserCooldown(userId) {
    const lastUsed = cooldowns.users.get(userId);
    const duration = settings.get('user_cooldown') * 1000;
    // console.log("User lastUsed", userId, lastUsed, duration)
    if (lastUsed && Date.now() - lastUsed < duration) {
        return true;
    }
    return false;
}
function addGlobalCooldown() {
    cooldowns.global.lastUsed = Date.now();
}

function addUserCooldown(userId) {
    cooldowns.users.set(userId, Date.now());
}

async function onMessage(channel, tags, message, self) {
    // check if the message is contains trigger word
    if (self || !tags.username) return;
    const username = tags.username
    // remove # from channel 
    channel = channel.replace('#', '')


    if (isOnGlobalCooldown()) {
        console.log('Global cooldown active');
        return;
    }

    if (isOnUserCooldown(username)) {
        console.log(`Cooldown active for user ${username}`);
        return;
    }

    const isVIP = tags.vip
    const isMod = tags.mod
    const isBroadcaster = tags.badges && tags.badges.broadcaster == '1'
    const isSub = tags.subscriber
    const isBot = tags['bot'] == '1'

    const permissions_user = settings.get('permissions_user')
    const permissions_mod = settings.get('permissions_mod')
    const permissions_vip = settings.get('permissions_vip')
    const permissions_sub = settings.get('permissions_subscriber')
    const permissions_broadcaster = settings.get('permissions_broadcaster')

    // check if the user has permission to use the bot
    let hasPermission = false
    if (permissions_user && !isMod && !isBroadcaster && !isSub && !isVIP) {
        hasPermission = true
    }
    if (permissions_mod && isMod) hasPermission = true
    if (permissions_vip && isVIP) hasPermission = true
    if (permissions_sub && isSub) hasPermission = true
    if (permissions_broadcaster && isBroadcaster) hasPermission = true

    if (!hasPermission) return

    const botUsername = (client.getUsername() || "")
    if (username.toLowerCase() === botUsername.toLowerCase()) return;

    const trigger_word = (settings.get('trigger_word') || "").toLowerCase()

    const reply_parent_msg_id = tags['reply-parent-msg-id']
    const reply_parent_display_name = tags['reply-parent-display-name']
    let reply_parent_msg_body = tags['reply-parent-msg-body']
    if (reply_parent_msg_body) {
        // remove \\s from the message
        reply_parent_msg_body = reply_parent_msg_body.replace(/\\s/g, ' ')

    }


    if (message.toLowerCase().includes(trigger_word) || (reply_parent_msg_body && reply_parent_msg_body.toLowerCase().includes(trigger_word))) {
        // console.log("triggered", message)


        // get previous messages from the context table
        let tableMessages = []

        const max_context_messages = settings.get('max_context_messages')

        if (max_context_messages > 0) {
            tableMessages = await getPreviousMessages(channel, username, max_context_messages)
            tableMessages = tableMessages.map((message) => ({
                "role": message.role, "content": message.message,
            }))
        }

        if (reply_parent_msg_body) {
            const lowercase_parent_username = reply_parent_display_name.toLowerCase()

            let role = "user"
            if (lowercase_parent_username == botUsername.toLowerCase()) {
                role = "assistant"
            }
            if (tableMessages.length > 0) {
                const index = tableMessages.length - 1

                tableMessages.splice(index, 0, {
                    "role": role, "content": reply_parent_msg_body,
                })
            } else {
                tableMessages.push({
                    "role": role, "content": reply_parent_msg_body,
                })
            }
        } else {


        }

        const { currentDate, currentTime } = getCurrentDateAndTime()
        // prepare context
        const context_data = {
            "settings": settings.getSettings(),
            "channel_name": channel,
            "channel_user_info": channelUserInfo || {},
            "channel_info": channelInfo || {},
            "username": username,
            "bot_username": botUsername,
            "current_game": channelInfo?.game_name || "",
            "channel_title": channelInfo?.title || "",
            "channel_tags": (channelInfo?.tags || []).join(", ") || "",
            "channel_language": channelInfo?.broadcaster_language || "",
            "channel_description": channelUserInfo?.description || "",
            "user": tags,
            "current_date": currentDate,
            "current_time": currentTime,
        }
        // console.log(context_data)
        let system_message = settings.get('system_message')
        // let system_message = await db.getSetting('system_message')
        system_message = env.renderString(system_message, context_data);


        let processedMessage = message
        const preprocess_message = settings.get('preprocess_message')
        processedMessage = env.renderString(preprocess_message, {
            ...context_data,
            message: processedMessage,
        });

        const contextMessages = [
            {
                "role": "system", "content": system_message,
            },
            ...tableMessages,
            { "role": "user", "content": processedMessage }
        ]

        await addMessageToContextTable(channel, username, "user", processedMessage)


        // then send the message to the ai
        try {

            const { text, tokens } = await openai.chatgpt(contextMessages)
            addGlobalCooldown()
            addUserCooldown(username)
            await updateTokens(tokens)

            let replyMessage = postProcess(text)
            // post process



            if (!replyMessage) return;


            // add message to the context table
            await addMessageToContextTable(channel, username, "assistant", replyMessage)

            // add tokens to the data table total_tokens and session_tokens


            // get send_to_twitch_chat setting
            const send_to_twitch_chat = settings.get('send_to_twitch_chat')
            const send_to_text_file = settings.get('send_to_text_file')

            if (send_to_text_file) {
                // write to text file to responsePath
                fs.writeFile(responseFilePath, replyMessage, function (err) {
                    if (err) {
                        customLog('error', err)
                    }
                })
            }

            if (send_to_twitch_chat) {
                // limit message to 500 characters and add ... 
                if (replyMessage.length > 500) {
                    replyMessage = replyMessage.substring(0, 497) + "..."
                }


                if (reply_parent_msg_id) {
                    client.reply(channel, replyMessage, tags.id)
                } else {
                    client.reply(channel, replyMessage, tags.id)
                }
            }

        } catch (e) {
            // if axios error then get response data
            if (e.response) {
                console.log(e.response.data)
                const error = e.response.data?.error?.message
                if (error) {
                    // log.error(error)
                    customLog('error', error)
                }
                // add error to error log 
            } else {
                console.log(e)
                // log.error(e)
                customLog('error', e)
            }
            // await disconnect()
        }

    }
}

function postProcess(text, context_data = {}) {
    const postprocess_message = settings.get('postprocess_message')
    let replyMessage = env.renderString(postprocess_message, {
        ...context_data,
        message: text,
    });

    replyMessage = replyMessage.replace(/\r\n|\r|\n/g, ' ')
    replyMessage = replyMessage.trim()

    return replyMessage
}

// function extractTextAfterSplitMessage(replyMessage, splitMessage) {
//     const splitIndex = replyMessage.indexOf(splitMessage);

//     if (splitIndex !== -1) {
//         return replyMessage.substring(splitIndex + splitMessage.length);
//     } else {
//         return replyMessage;
//     }

// }

export async function connect() {
    // start polling for current game, stream status

    const username = settings.get('username')
    const twitch_access_token = settings.get('twitch_access_token')
    // if twitch_access_token does not start with oauth: then add it
    let password = twitch_access_token
    if (!twitch_access_token.startsWith('oauth:')) {
        password = `oauth:${twitch_access_token}`
    }

    const channels = (settings.get('channels') || "").split(',').map(c => c.trim()).filter(c => c.length > 0)
    if (channels.length === 0) {
        throw new Error("No channels specified")
    }

    channel = channels[0]

    // get channel id
    channelUserInfo = await getUserInfo(channel)
    // console.log("channelUserInfo", channelUserInfo)

    const channelId = channelUserInfo.id

    const data_refresh_interval = settings.get('data_refresh_interval') || 30

    channelInfo = await getChannelInfo(channelId)
    interval = setInterval(async () => {
        channelInfo = await getChannelInfo(channelId)
        // console.log("channelInfo", channelInfo)
    }, 1000 * data_refresh_interval)


    client = new tmi.Client({
        options: { debug: true },
        identity: {
            username,
            password
        },
        channels: channels
    });

    client.on('connected', onConnected);
    client.on('connecting', onConnecting);
    client.on('disconnected', onDisconnected);
    client.on('message', onMessage);



    client.connect();
    openai.setAPIKey(settings.get('openai_api_key'))

}

function getTaggedUser(message) {
    const taggedUser = message.match(/@(\w+)/)
    if (taggedUser) {
        return taggedUser[1]
    }
    return null
}

async function sendMessage(channel, message, parentId = null) {

    console.log("sending message", channel, message)
    // trim message up to 500 characters
    const { currentDate, currentTime } = getCurrentDateAndTime()
    // prepare context
    const botUsername = (client.getUsername() || "")
    const username = botUsername
    const tags = {}

    const context_data = {
        "settings": settings.getSettings(),
        "channel_name": channel,
        "channel_user_info": channelUserInfo || {},
        "channel_info": channelInfo || {},
        "username": username,
        "bot_username": botUsername,
        "current_game": channelInfo?.game_name || "",
        "channel_title": channelInfo?.title || "",
        "channel_tags": (channelInfo?.tags || []).join(", ") || "",
        "channel_language": channelInfo?.broadcaster_language || "",
        "channel_description": channelUserInfo?.description || "",
        "user": tags,
        "current_date": currentDate,
        "current_time": currentTime,
    }
    message = postProcess(message, context_data)

    message = message.substring(0, 500)

    // send message
    if (parentId) {
        // client.reply(channel, message, parentId)
        // client.say(channel, message, { 'reply-parent-msg-id': parentId })
        client.reply(channel, message, parentId)
    } else {
        client.say(channel, message);
    }

    // get tagged user from message 
    const taggedUser = getTaggedUser(message)

    // save message to the context table under the tagged user or null if none 
    await addMessageToContextTable(channel, taggedUser, "assistant", message)
}



export async function disconnect() {
    try {
        customLog('info', "disconnecting...")
        channel = ""
        channelUserInfo = null

        if (interval) {
            clearInterval(interval)
            interval = null
        }

        if (client) {
            client.off('connected', onConnected)
            client.off('connecting', onConnecting)
            client.off('disconnected', onDisconnected)
            client.off('message', onMessage)

            await client?.disconnect()
        }



    } catch (e) {
        console.log(e)
        // log.error(e)
        customLog('error', e)
    } finally {

        emitter.emit('status:update', 'disconnected')
    }
}

async function reconnect() {
    await disconnect()
    await connect()
    // await login()
    // await joinChannels()
}

async function reconnectIfConnected() {
    if (isConnected()) {
        await reconnect()
    }
}

// async function joinChannels() {
//     const channels = (settings.get('channels') || "").split(',').map(c => c.trim()).filter(c => c.length > 0)
//     if (channels.length > 0) {
//         console.log("Joining channels: ", channels)
//         return await client.multiJoin(channels);
//     } else {
//         // TODO: show error

//         await disconnect()
//     }
// }

async function getPreviousAllMessages(count) {
    const rows = await db.all("SELECT * FROM context_messages ORDER BY id LIMIT ? OFFSET (SELECT COUNT(*) FROM context_messages) - ?", [count, count])
    return rows
}

// remove all messages from the context table
async function clearContextTable() {
    await db.run("DELETE FROM context_messages")
}

async function getPreviousMessages(channel, user, count) {
    const rows = await db.all("SELECT * FROM (SELECT * FROM context_messages WHERE channel = ? AND (user = ? OR user IS NULL) ORDER BY id DESC LIMIT ?) sub ORDER BY id ASC", [channel, user, count]);

    return rows
}

function getCurrentDateAndTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return {
        currentDate: `${year}-${month}-${day}`,
        currentTime: `${hours}:${minutes}:${seconds}`
    };
}

function getInt(value) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
}

async function getCurrentTokens() {
    // get total_tokens and sessions_tokens from table data
    const total_tokens = getInt(await db.getData("total_tokens"))
    const session_tokens = getInt(await db.getData("session_tokens"))

    return { total_tokens, session_tokens }
}

async function updateTokens(tokens) {
    // skip if tokens is 0 or anything else than a number
    if (tokens === 0 || isNaN(tokens)) {
        return
    }

    const { total_tokens, session_tokens } = await getCurrentTokens()

    const new_total_tokens = total_tokens + tokens
    const new_session_tokens = session_tokens + tokens

    await db.setData("total_tokens", new_total_tokens)
    await db.setData("session_tokens", new_session_tokens)

    emitter.emit('tokens:update', { total_tokens: new_total_tokens, session_tokens: new_session_tokens })

    return { total_tokens: new_total_tokens, session_tokens: new_session_tokens }

}

export async function resetSessionTokens() {
    return await db.run("UPDATE data SET value = 0 WHERE key = 'session_tokens'")
}


// function splitMessage(message) {
//     const maxLength = 497; // Account for the ellipsis
//     const ellipsis = '...';

//     if (message.length <= maxLength) {
//         return [message];
//     }

//     const chunks = [];

//     while (message.length > 0) {
//         const chunk = message.substring(0, maxLength);

//         if (chunk.length < maxLength) {
//             chunks.push(chunk + ellipsis);
//         } else {
//             chunks.push(chunk);
//         }

//         message = message.substring(maxLength);
//     }

//     return chunks.map((chunk, index) => {
//         if (index === 0) {
//             return chunk;
//         } else {
//             return `${ellipsis}${chunk}`;
//         }
//     }).filter((chunk) => chunk && chunk.length > 0);
// }

function currentSQLDate() {
    const now = DateTime.utc();
    return now.toSQL({ includeZone: false })
}

async function addMessageToContextTable(channel, user, role, message) {
    await db.run("INSERT INTO context_messages (channel, user, role, message) VALUES (?, ?, ?, ?)", [channel, user, role, message])
    // send to ui
    emitter.emit('context:add', { channel, user, role, message, created_at: currentSQLDate() })
}


function getStatus() {
    const readyState = client?.readyState()
    const status = readyState === 'OPEN' ? 'connected' : 'disconnected'
    return status
}

function isConnected() {
    return getStatus() === 'connected'
}


export const emitter = new EventEmitter()

ipcMain.on('context:load', async (event, arg) => {
    console.log('<context:load')
    const context = await getPreviousAllMessages(100)
    event.reply('context:loaded', context); // sends a message back to the renderer
});

ipcMain.on('context:empty', async (event, arg) => {
    console.log('context:empty')
    await clearContextTable()
    const context = await getPreviousAllMessages(100)
    event.reply('context:loaded', context); // sends a message back to the renderer
});




ipcMain.on('bot:send', async (event, arg) => {
    await sendMessage(arg.channel, arg.message)
});



ipcMain.on('bot:connect', async (event, arg) => {
    await disconnect()
    await connect()
});

ipcMain.on('bot:disconnect', async (event, arg) => {
    await disconnect()
});

ipcMain.on('status:load', async (event, arg) => {
    const status = getStatus()
    console.log("status:load", status)
    ui.send('status:update', status)
});

emitter.on('context:add', (data) => {
    ui.send('context:add', data)
})

emitter.on('tokens:update', (data) => {
    ui.send('tokens:update', data)
})

// pass bot status to ui
emitter.on('status:update', (status) => {
    ui.send('status:update', status)
})


settings.emitter.on('settings-changed:channels', reconnectIfConnected)
settings.emitter.on('settings-changed:twitch_access_token', reconnectIfConnected)