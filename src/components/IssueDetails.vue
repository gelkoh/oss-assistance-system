<template>
    <button @click="$emit('go-back-to-issues-list')" class="sticky top-0 left-0 bg-neutral-700 rounded-sm p-1 flex items-center gap-1 hover:bg-neutral-600">
        <ArrowLeft :size="18" class="inline-block" /> Back
    </button>

    <div class="text-lg mt-4">{{ selectedIssue.title }}</div>
    <div>#{{ selectedIssue.number }} by {{ selectedIssue.user.login }}</div>

    <div class="overflow-y-auto">
        <div v-for="entry in parsedIssueBody" class="mt-4">
            <div v-if="entry.type === 'text'">
                {{ entry.content }}
            </div>

            <highlightjs v-else autodetect :code="entry.content" class="whitespace-pre-wrap rounded-sm overflow-hidden" />
        </div>
    </div>
</template>

<script setup>
    import { ArrowLeft } from "lucide-vue-next"

    const props = defineProps({
        selectedIssue: Object,
        parsedIssueBody: Object
    })
</script>
