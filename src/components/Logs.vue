<script setup>
import { useAppStore } from "../stores/app";
import { computed, onMounted, ref, watchEffect, nextTick } from "vue";

const app = useAppStore();


const logFilePath = app.info?.logFilePath || "the log directory.";

const logs = computed(() => {

    const logs = app.logs.map((log) => {
        let message = ""
        for(let item in log.data) {
            // if type string 
            if(typeof log.data[item] === "string") {
                message += log.data[item] + " ";
            }
            // if type object
            else if(typeof log.data[item] === "object") {
                message += JSON.stringify(log.data[item]) + " ";
            }
            else{
                message += log.data[item] + " ";
            }
        }
        return {
            level: log.level.toUpperCase(),
            message: message,
        };
    });

    return logs

});

// scroll to bottom

const logRef = ref(null);

async function scrollToBottom() {
    await nextTick()
    if (logRef.value) {
        logRef.value.scrollTop = logRef.value.scrollHeight;
    }
};


watchEffect(() => {
    if (app.logs.length) {
        scrollToBottom();
    }
});

onMounted(() => {
    scrollToBottom();
});



</script>
<template>
  <div class="overflow-hidden bg-slate-50 shadow sm:rounded-lg h-full">
        <div class="py-5 px-4 sm:p-6 lg:pb-8 h-full">
            <h2 class="text-lg font-medium leading-6 text-gray-900 h-full">Logs</h2>
            <div class="min-w-full max-h-[500px] overflow-y-scroll bg-slate-200 rounded p-0 mt-4 h-full" :ref="logRef">
                <ul class=" divide-y-2 divide-slate-300">
                    <li v-for="(log, index) in logs" :key="index" :class="log.type" class="p-3">
                        [{{ log.level }}] {{ log.message }}
                    </li>
                </ul>
            </div>

            <!-- <div class="pt-5">You can see the full logs in C:\Users\&lt;username&gt;\AppData\Roaming\tainybot\</div> -->
            <div class="pt-5">Full logs can be found in {{logFilePath}}.</div>
        </div>
    </div>
</template>