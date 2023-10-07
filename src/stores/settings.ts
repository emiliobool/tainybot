import { defineStore } from "pinia";
import { computed, reactive, ref, toRaw } from "vue";
import { ipcRenderer } from "electron";
import { get_encoding, TiktokenEncoding } from "tiktoken";

/*
openai api key:
twitch access token: 
    (how to get one: twitchapps.com/tmi/)
channels: (comma separated)
trigger word:
system_message: 
max_context_messages: 
data_refresh_interval: 

*/

export function loadSettings() {
  console.log(">loadSettings");
  ipcRenderer.send("settings:load");
}

export const useSettingsStore = defineStore("settings", () => {
  const settings = ref({});
  const editingSettings = ref({});

  const open = ref(false);

  const required = [
    "openai_api_key",
    "twitch_access_token",
    "channels",
    "trigger_word",
    "username",
  ];

  const missingSettings = computed(() => {
    const missing = [];
    for (const key of required) {
      if (!settings.value[key]) {
        missing.push(key);
      }
    }
    return missing;
  });

  const changed = computed(() => {
    // console.log("changed", settings.value, editingSettings.value);
    return (
      JSON.stringify(settings.value) !== JSON.stringify(editingSettings.value)
    );
  });

  const changedSettings = computed(() => {
    // list of settings that have been changed
    const changed = [];
    for (const key in editingSettings.value) {
      if (settings.value[key] !== editingSettings.value[key]) {
        changed.push(key);
      }
    }
    return changed;
  });

  const channels = computed(() => {
    return (
      settings.value.channels
        ?.split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0) || []
    );
  });

  const changedSettingsObject = computed(() => {
    const changed = {};
    for (const key of changedSettings.value) {
      changed[key] = editingSettings.value[key];
    }
    return changed;
  });
  function saveSettings() {
    ipcRenderer.send("settings:save", toRaw(changedSettingsObject.value));
    // closeSettings()
  }

  ipcRenderer.on("settings:loaded", (event, loadedSettings) => {
    console.log("settings:loaded", loadedSettings);
    settings.value = loadedSettings;
    if (open.value) {
      editingSettings.value = JSON.parse(JSON.stringify(loadedSettings));
    }
  });
  const defaultSettings = ref({});
  ipcRenderer.on("settings:default", (event, _defaultSettings) => {
    console.log("settings:default", _defaultSettings);
    defaultSettings.value = _defaultSettings;
  });

  function openSettings() {
    if (open.value) return;
    loadSettings();
    open.value = true;
    editingSettings.value = JSON.parse(JSON.stringify(settings.value));
    console.log("editingSettings", editingSettings.value);
  }
  function closeSettings() {
    open.value = false;
  }

  function updateEditingSetting(key, value) {
    editingSettings.value[key] = value;
  }

  function countTokens(text: string) {
    const enc = get_encoding("cl100k_base");
    const tokens = enc.encode(text);
    return tokens?.length || 0;
  }

  return {
    open,
    changed,
    settings,
    editingSettings,
    changedSettings,
    changedSettingsObject,
    channels,
    missingSettings,
    defaultSettings,
    countTokens,
    saveSettings,
    loadSettings,
    openSettings,
    closeSettings,
    updateEditingSetting,
  };
});
