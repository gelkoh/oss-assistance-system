<template>
    <div class="mt-2 p-1 bg-neutral-700 rounded-sm group">
        <div class="flex gap-x-4 justify-between">
            <div @click="$emit('view-issue', issue)" class="text-blue-500 text-lg cursor-pointer inline-block">{{ issue.title }}</div>

            <button @click="$emit('target-issue', issue)" class="cursor-pointer">
                <Target v-if="issue.is_targeted" />
                <Circle v-else class="opacity-0 group-hover:opacity-100 text-neutral-500" />
            </button>
        </div>

        <div>#{{ issue.number }} by {{ issue.user.login }}</div>
    </div>
</template>

<script setup>
    import { Target, Circle } from "lucide-vue-next"

    defineProps({
        issue: {
            type: Object,
            required: true
        }
    })
</script>
