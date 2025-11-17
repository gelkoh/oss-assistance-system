<template>
    <div v-if="Object.keys(repoStore.currentlyViewedIssue).length === 0" class="flex flex-col h-full overflow-hidden">
        <div class="overflow-y-auto grow">
            <div class="text-lg font-bold">There are {{ issues.length }} open issues. Target an issue to pass it as context to the chatbot.</div>

            <Issue
                v-if="issues.length > 0"
                v-for="(issue, index) in issues"
                :issue
                :key="index"
            />
        </div>
    </div>

    <IssueDetails v-else />
</template>

<script setup>
    import { ref, onMounted } from "vue"
    import { Circle, CircleDot, Target } from "lucide-vue-next"
    import IssueDetails from "../components/IssueDetails.vue"
    import Issue from "../components/Issue.vue"
    import { useRepoStateStore } from "../stores/repoState.js"

    const repoStore = useRepoStateStore()

    const props = defineProps({
        issues: Array,
        ownerName: String,
        repoName: String
    })
</script>
