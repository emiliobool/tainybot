<script setup>
import { ref, onMounted, computed } from "vue";
import { useAppStore, emptyContext } from "../stores/app";

const app = useAppStore()

const messages = computed(() => {
    const count = app.contextMessages.length
    if(count >= 100){
        return `${count}+`
    }else{
        return count
    }
})

function clearContextHistory() {
    emptyContext()
}
</script>
<template>
    <div class="mt-4">
        <h3 class="font-bold text-red-500">Danger Zone</h3>
        <p class="text-xs text-gray-500">These actions are irreversible.</p>
        <div>
            <button class="text-sm rounded bg-red-400 px-2 py-1 float-right text-red-100" @click="clearContextHistory()">
                Empty Message History ({{ messages }} messages)
            </button>
            <label for="system" class="block text-sm font-medium leading-6 text-gray-900 mt-4">Message History
            </label>
        </div>
    </div>
</template>
