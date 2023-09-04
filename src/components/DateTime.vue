<script lang="ts" setup>
import { DateTime } from 'luxon'
import { ref, onUnmounted } from 'vue'

const props = defineProps(['datetime'])

const datetime = ref(getFormattedDate(props.datetime))

function getFormattedDate(datetime) {
    return DateTime.fromSQL(datetime, {
        zone: 'utc'
    }).toRelative()
}


let intervalId = null
let currentDuration = 1000 * 30

function updateTime() {
    datetime.value = getFormattedDate(props.datetime)
    let newDuration = 1000 * 30
    if (datetime.value.includes('second')) {
        newDuration = 1000 * 30
    } else if (datetime.value.includes('minute')) {
        newDuration = 1000 * 30
    } else if (datetime.value.includes('hour')) {
        newDuration = 1000 * 60 * 30
    } else if (datetime.value.includes('day')) {
        newDuration = 1000 * 60 * 60 * 12
    } else if (datetime.value.includes('week')) {
        newDuration = 1000 * 60 * 60 * 24 * 3
    } else if (datetime.value.includes('month')) {
        newDuration = 1000 * 60 * 60 * 24 * 15
    } else if (datetime.value.includes('year')) {
        newDuration = 1000 * 60 * 60 * 24 * 180
    }
    if (newDuration !== currentDuration) {
        currentDuration = newDuration
        resetInterval(currentDuration)
    }

}

function resetInterval(time) {
    clearInterval(intervalId)
    intervalId = setInterval(updateTime, time)
}

resetInterval(currentDuration)

// clear the interval when the component is unmounted
onUnmounted(() => {
    clearInterval(intervalId);
});

</script>
<template>
    <p>
        <time :datetime="props.datetime">{{ datetime }}</time>
    </p>
</template>
