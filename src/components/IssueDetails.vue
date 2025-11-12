<template>
    <div>
        <div class="flex items-center gap-x-4 mb-4">
            <button @click="$emit('go-back-to-issues-list')" class="w-11 h-11 flex items-center justify-center cursor-pointer rounded-sm p-1 flex items-center gap-1 hover:bg-neutral-700 border border-neutral-500 active:bg-neutral-600">
                <ArrowLeft :size="18" class="inline-block" />
            </button>

            <div>
                <div class="font-bold text-xl">{{ selectedIssue.title }}</div>
                <div>#{{ selectedIssue.number }} by {{ selectedIssue.user.login }}</div>
            </div>

            <button @click="repoStore.targetIssue(selectedIssue.id)" class="self-start mr-2 cursor-pointer ml-auto">
                <Target v-if="isCurrentlyTargeted" />
                <Circle v-else class="text-neutral-500" />
            </button>
        </div>

        <div class="overflow-y-auto">
            <template v-for="(part, index) in parsedIssueBody" :key="index">
                <div v-if="part.type === 'paragraph'" class="mt-4 first:mt-0">
                    <template v-for="(subPart, subIndex) in part.content" :key="subIndex">
                        <span v-if="subPart.type === 'text'" class="whitespace-pre-wrap">{{ subPart.content }}</span>

                        <code
                            v-else-if="subPart.type === 'inline-code'"
                            class="px-1.5 py-0.5 bg-neutral-950 rounded text-sm font-mono"
                        >
                            {{ subPart.content }}
                        </code>

                    </template>
                </div>

                <highlightjs
                    v-else
                    autodetect
                    :code="part.content"
                    class="mt-4 whitespace-pre-wrap rounded-sm overflow-hidden *:bg-neutral-950!"
                />
            </template>
        </div>
    </div>
</template>

<script setup>
    import { computed } from "vue"
    import { ArrowLeft, Target, Circle } from "lucide-vue-next"
    import { useRepoStateStore } from "../stores/repoState.js"

    const repoStore = useRepoStateStore()

    const props = defineProps({
        selectedIssue: Object,
        parsedIssueBody: Object
    })

    const isCurrentlyTargeted = computed(() => {
        return props.selectedIssue.id === repoStore.targetedIssueId
    })
</script>
