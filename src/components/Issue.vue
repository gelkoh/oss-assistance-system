<template>
    <div
        class="mt-4 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-sm group"
        :class="{ 'bg-white text-black hover:bg-neutral-100!' : issue.is_targeted }"
    >
        <div class="flex gap-x-4 justify-between">
            <div>
                <div
                    @click="$emit('view-issue', issue)"
                    class="hover:underline font-bold text-lg cursor-pointer inline-block"
                >
                    {{ issue.title }}
                </div>

                <div v-for="label in issue.labels" class="ml-3 px-3 py-1 inline-block rounded-full text-xs" :style="{ 'color': '#' + label.color, 'background': '#' + label.color + '30', 'border': '1px solid #' + label.color }">
                    {{ label.name }}
                </div>
            </div>

            <button @click="$emit('target-issue', issue)" class="cursor-pointer">
                <Target v-if="issue.is_targeted" />
                <Circle v-else class="opacity-0 group-hover:opacity-100 text-neutral-500" />
            </button>
        </div>

        <div>#{{ issue.number }}<Dot class="inline" />{{ issue.user.login }} opened on {{ issue.created_at.slice(0, 10) }}</div>
    </div>
</template>

<script setup>
    import { Dot, Target, Circle } from "lucide-vue-next"

    defineProps({
        issue: {
            type: Object,
            required: true
        }
    })
</script>
