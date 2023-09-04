import { ipcRenderer } from 'electron'
import { defineStore } from 'pinia'
import { computed, ref, toRaw } from 'vue'
import { loadSettings } from './settings'

export function loadContext() {
  ipcRenderer.send("context:load")
}

export function loadInfo() {
  console.log('>loadInfo')
  ipcRenderer.send("info:load")
}



export function loadStatus() {
  console.log('>loadStatus')
  ipcRenderer.send("status:load")
}

export function connect() {
  ipcRenderer.send('bot:connect')
}

export function disconnect() {
  // send disconnect to main process
  ipcRenderer.send('bot:disconnect')
}

export function sendBotMessage(args) {
  // send disconnect to main process
  ipcRenderer.send('bot:send', args)
}


export function openLink(link) {
  ipcRenderer.send('open:link', link)
}

export function emptyContext() {
  ipcRenderer.send('context:empty')
}

export const useAppStore = defineStore('app', () => {
  const status = ref("disconnected")
  const connected = computed(() => status.value === "connected")
  const totalTokens = ref(0)
  const sessionTokens = ref(0)
  const contextMessages = ref([])

  const connectPopupOpen = ref(false)
  const version = ref("unknown")

  function openConnectPopup() {
    connectPopupOpen.value = true
  }

  ipcRenderer.on('status:update', (event, updatedStatus) => {
    console.log('status:update', updatedStatus)
    status.value = updatedStatus
  })

  ipcRenderer.on('tokens:update', (event, tokens) => {
    console.log('tokens:update', tokens)
    totalTokens.value = tokens.total_tokens
    sessionTokens.value = tokens.session_tokens
  })

  ipcRenderer.on("context:loaded", (event, messages) => {
    contextMessages.value = messages
  })
  ipcRenderer.on("context:add", (event, message) => {
    contextMessages.value.push(message)
  })



  ipcRenderer.on("version", (event, _version) => {
    console.log('version', _version)
    version.value = _version
  })

const autoUpdaterHandler = (event, data) => {
    console.log(event, data)
  }
  ipcRenderer.on("checking_for_update", autoUpdaterHandler)
  ipcRenderer.on("update_not_available", autoUpdaterHandler)
  ipcRenderer.on("update_available", autoUpdaterHandler)
  ipcRenderer.on("update_downloaded", autoUpdaterHandler)
  ipcRenderer.on("error", autoUpdaterHandler)
  ipcRenderer.on("download_progress", autoUpdaterHandler)

  const info = ref({})
  ipcRenderer.on("info:loaded", (event, _info) => {
    console.log('info:loaded', _info)
    info.value = _info
  })

  const logs = ref([])
  ipcRenderer.on('log', (event, _data) => {
    const { level, data } = _data;
    console.log(`[${level}]`, ...data);
    logs.value.push({ level, data });
  });

  // load context messages 

  console.log("app store loaded")
  loadSettings()
  loadContext()
  loadStatus()
  loadInfo()

  function sendMessage(channel, message) {
    console.log('sendMessage', channel, message)
    sendBotMessage({ channel: toRaw(channel), message: toRaw(message) })
  }

  return {
    disconnect,
    connect,
    sendMessage,
    openConnectPopup,
    connectPopupOpen,
    contextMessages,
    totalTokens,
    sessionTokens,
    status,
    connected,
    logs,
    info
  }
})