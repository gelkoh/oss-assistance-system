<template>
    <div class="flex flex-col h-full overflow-hidden">
        <div>
            <div class="flex items-center gap-x-4 mb-6">
                <button @click="closeIssue" class="w-11 h-11 flex items-center justify-center cursor-pointer rounded-sm p-1 flex items-center gap-1 hover:bg-neutral-700 border border-neutral-500 active:bg-neutral-600">
                    <ArrowLeft :size="18" class="inline-block" />
                </button>

                <div>
                    <div class="font-bold text-xl">{{ repoStore.currentlyViewedIssue.title }}</div>
                    <div>#{{ repoStore.currentlyViewedIssue.number }} by {{ repoStore.currentlyViewedIssue.user.login }}</div>
                </div>

                <button @click="repoStore.targetIssue(repoStore.currentlyViewedIssue.id)" class="self-start mr-2 cursor-pointer ml-auto">
                    <Target v-if="isCurrentlyTargeted" />
                    <Circle v-else class="text-neutral-500" />
                </button>
            </div>
        </div>

        <div class="overflow-y-auto grow">
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
    import { useRepoStateStore } from "../stores/repoState.js"
    import { useMarkdownParser } from "../composables/useMarkdownParser.js"
    import { ArrowLeft, Target, Circle } from "lucide-vue-next"

    const repoStore = useRepoStateStore()

    const closeIssue = () => {
        repoStore.currentlyViewedIssue = {}
    }

    const isCurrentlyTargeted = computed(() => {
        return repoStore.currentlyViewedIssue.id === repoStore.targetedIssueId
    })

    const parsedIssueBody = computed(() => {
        return useMarkdownParser(repoStore.currentlyViewedIssue.body)
    })
</script>
